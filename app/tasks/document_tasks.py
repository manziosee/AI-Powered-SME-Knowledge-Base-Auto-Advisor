"""
Document processing Celery task.

Pipeline (per document):
  1.  Upload file to S3
  2.  Extract raw text from PDF / DOCX / XLSX / TXT
  3.  NER pass via spaCy  →  extract dates, organisations, money, people
  4.  Classify document type via Groq
  5.  Generate summary via Groq
  6.  Extract structured knowledge (obligations, deadlines, risks, metrics) via Groq
  7.  Chunk text with LangChain RecursiveCharacterTextSplitter
  8.  Batch-embed all chunks + structured entries via SentenceTransformers
  9.  Persist KnowledgeEntry rows (structured + chunk-level)
  10. Update Document status → PROCESSED
  11. Send email notification to uploader
"""

import asyncio
import json
import logging
from datetime import datetime

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.document_tasks.process_document_task",
    bind=True,
    max_retries=3,
    soft_time_limit=1500,
    time_limit=1800,
)
def process_document_task(self, document_id: str, file_content: bytes, mime_type: str):
    try:
        asyncio.run(_process(document_id, file_content, mime_type, self))
    except Exception as exc:
        err_msg = str(exc)
        # Retry on transient AI/network errors
        if any(k in err_msg.lower() for k in ["rate limit", "connection", "timeout", "503", "502", "groq"]):
            try:
                raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
            except self.MaxRetriesExceededError:
                pass
        raise


async def _process(document_id: str, file_content: bytes, mime_type: str, task=None):
    from app.core.database import AsyncSessionLocal
    from app.models.document import Document, DocumentStatus, DocumentType
    from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType, RiskLevel
    from app.models.user import User
    from app.services.ai_service import (
        classify_document, extract_knowledge, generate_embedding,
        generate_embeddings_batch, summarize_document,
    )
    from app.services.document_processor import extract_text
    from app.services.email_service import send_document_processed_email
    from app.services.ml_service import RiskScorer, boost_risk_for_deadline
    from app.services.rag_pipeline import chunk_text_raw
    from app.services.s3_service import upload_file
    from sqlalchemy import select

    scorer = RiskScorer()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if not document:
            logger.error("Document %s not found", document_id)
            return

        document.status = DocumentStatus.PROCESSING
        await db.commit()

        try:
            # ----------------------------------------------------------
            # Step 1: Upload to S3
            # ----------------------------------------------------------
            await upload_file(file_content, document.file_path, mime_type)

            # ----------------------------------------------------------
            # Step 2: Extract raw text
            # ----------------------------------------------------------
            extracted_text = await extract_text(file_content, mime_type)

            # OCR fallback: if text is too short (e.g. scanned PDF), try pytesseract
            if len((extracted_text or "").strip()) < 100 and mime_type == "application/pdf":
                try:
                    import pytesseract
                    from pdf2image import convert_from_bytes
                    pages = convert_from_bytes(file_content, dpi=200)
                    ocr_texts = []
                    for page in pages[:20]:  # cap at 20 pages for memory
                        ocr_texts.append(pytesseract.image_to_string(page))
                    ocr_result = "\n".join(ocr_texts).strip()
                    if len(ocr_result) > len(extracted_text or ""):
                        extracted_text = ocr_result
                        logger.info("OCR extracted %d chars from document %s", len(ocr_result), document_id)
                except Exception as ocr_exc:
                    logger.warning("OCR failed for document %s: %s", document_id, ocr_exc)

            if not extracted_text or len(extracted_text.strip()) < 20:
                document.status = DocumentStatus.FAILED
                document.doc_metadata = {"error": "Could not extract text from document"}
                await db.commit()
                return

            document.extracted_text = extracted_text

            # ----------------------------------------------------------
            # Step 3: NER — extract entities with spaCy
            # ----------------------------------------------------------
            ner_entities = _run_ner(extracted_text)

            # ----------------------------------------------------------
            # Step 4: Classify
            # ----------------------------------------------------------
            doc_type_str = await classify_document(document.original_filename, extracted_text[:800])
            valid_types = {dt.value for dt in DocumentType}
            if doc_type_str in valid_types:
                document.document_type = DocumentType(doc_type_str)

            company_lang = await _get_company_language(db, document.company_id)

            # ----------------------------------------------------------
            # Step 5: Summarise
            # ----------------------------------------------------------
            document.summary = await summarize_document(extracted_text, company_lang)

            # ----------------------------------------------------------
            # Step 6: Structured knowledge extraction (Groq)
            # ----------------------------------------------------------
            knowledge_data = await extract_knowledge(extracted_text, document.document_type.value)

            # ----------------------------------------------------------
            # Step 7: Chunk full text for dense retrieval
            # ----------------------------------------------------------
            chunks = chunk_text_raw(extracted_text)

            # ----------------------------------------------------------
            # Step 8: Batch-embed (chunks + structured entries together)
            # ----------------------------------------------------------
            structured_texts = _collect_structured_texts(knowledge_data)
            all_texts = [extracted_text[:4096]] + chunks + structured_texts
            all_embeddings = await generate_embeddings_batch(all_texts)

            doc_embedding = all_embeddings[0]
            chunk_embeddings = all_embeddings[1: 1 + len(chunks)]
            structured_embeddings = all_embeddings[1 + len(chunks):]

            document.embedding = doc_embedding

            # ----------------------------------------------------------
            # Step 9a: Chunk-level KnowledgeEntry rows
            # ----------------------------------------------------------
            for i, (chunk, emb) in enumerate(zip(chunks, chunk_embeddings)):
                risk = scorer.score(chunk)
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.INSIGHT,
                    title=f"{document.original_filename} — chunk {i + 1}/{len(chunks)}",
                    content=chunk,
                    risk_level=RiskLevel(risk),
                    embedding=emb,
                    tags=["chunk"],
                    metadata={"chunk_index": i, "total_chunks": len(chunks)},
                )
                db.add(entry)

            # ----------------------------------------------------------
            # Step 9b: Structured knowledge entry rows
            # ----------------------------------------------------------
            emb_idx = 0

            for obligation in knowledge_data.get("obligations", []):
                content = obligation.get("content", "")
                if not content:
                    continue
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.OBLIGATION,
                    title=obligation.get("title", "Obligation"),
                    content=content,
                    risk_level=RiskLevel.MEDIUM,
                    embedding=structured_embeddings[emb_idx] if emb_idx < len(structured_embeddings) else None,
                    tags=["structured", "obligation"],
                )
                db.add(entry)
                emb_idx += 1

            for deadline_item in knowledge_data.get("deadlines", []):
                content = deadline_item.get("content", "")
                if not content:
                    continue
                deadline_dt = _parse_date(deadline_item.get("date"))
                base_risk = scorer.score(content)
                final_risk = boost_risk_for_deadline(base_risk, deadline_dt)
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.DEADLINE,
                    title=deadline_item.get("title", "Deadline"),
                    content=content,
                    risk_level=RiskLevel(final_risk),
                    deadline=deadline_dt,
                    embedding=structured_embeddings[emb_idx] if emb_idx < len(structured_embeddings) else None,
                    tags=["structured", "deadline"],
                )
                db.add(entry)
                emb_idx += 1

            for risk_item in knowledge_data.get("risks", []):
                content = risk_item.get("content", "")
                if not content:
                    continue
                risk_level_str = risk_item.get("level", scorer.score(content))
                try:
                    risk_level = RiskLevel(risk_level_str)
                except ValueError:
                    risk_level = RiskLevel(scorer.score(content))
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.RISK,
                    title=risk_item.get("title", "Risk"),
                    content=content,
                    risk_level=risk_level,
                    embedding=structured_embeddings[emb_idx] if emb_idx < len(structured_embeddings) else None,
                    tags=["structured", "risk"],
                )
                db.add(entry)
                emb_idx += 1

            for metric in knowledge_data.get("metrics", []):
                content = metric.get("content", "")
                if not content:
                    continue
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.METRIC,
                    title=metric.get("title", "Metric"),
                    content=content,
                    risk_level=RiskLevel.LOW,
                    embedding=structured_embeddings[emb_idx] if emb_idx < len(structured_embeddings) else None,
                    tags=["structured", "metric"],
                )
                db.add(entry)
                emb_idx += 1

            # NER-derived entries (dates, org names, monetary amounts)
            for ner_entry in ner_entities:
                entry = KnowledgeEntry(
                    company_id=document.company_id,
                    document_id=document.id,
                    knowledge_type=KnowledgeType.INSIGHT,
                    title=f"[NER] {ner_entry['label']}: {ner_entry['text'][:60]}",
                    content=ner_entry["context"],
                    risk_level=RiskLevel.LOW,
                    tags=["ner", ner_entry["label"].lower()],
                    metadata={"entity_type": ner_entry["label"]},
                )
                db.add(entry)

            # ----------------------------------------------------------
            # Step 10: Finalise document
            # ----------------------------------------------------------
            document.status = DocumentStatus.PROCESSED
            document.processed_at = datetime.utcnow()
            document.tags = list({
                document.document_type.value,
                *[e["label"].lower() for e in ner_entities[:5]],
            })
            document.doc_metadata = {
                "chunk_count": len(chunks),
                "ner_entities": len(ner_entities),
                "knowledge_entries": (
                    len(knowledge_data.get("obligations", []))
                    + len(knowledge_data.get("deadlines", []))
                    + len(knowledge_data.get("risks", []))
                    + len(knowledge_data.get("metrics", []))
                ),
            }
            await db.commit()

            # ----------------------------------------------------------
            # Step 11: Email notification
            # ----------------------------------------------------------
            if document.uploaded_by:
                uploader = await db.get(from_app_user(User), document.uploaded_by)
                if uploader and uploader.email:
                    total_ke = document.doc_metadata["knowledge_entries"]
                    await send_document_processed_email(
                        user_email=uploader.email,
                        user_name=uploader.full_name,
                        filename=document.original_filename,
                        document_type=document.document_type.value,
                        summary=document.summary or "",
                        knowledge_count=total_ke,
                    )

        except Exception as exc:
            logger.exception("Document processing failed for %s: %s", document_id, exc)
            err_msg = str(exc)
            # Propagate transient errors so the Celery task wrapper can retry
            if any(k in err_msg.lower() for k in ["rate limit", "connection", "timeout", "503", "502", "groq"]):
                document.status = DocumentStatus.FAILED
                document.doc_metadata = {"error": err_msg, "will_retry": True}
                await db.commit()
                raise
            document.status = DocumentStatus.FAILED
            document.doc_metadata = {"error": err_msg}
            await db.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run_ner(text: str) -> list:
    """Extract named entities using spaCy. Returns list of {label, text, context}."""
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            return []

        doc = nlp(text[:50000])
        interesting_labels = {"DATE", "ORG", "MONEY", "PERCENT", "LAW", "GPE", "PERSON"}
        seen = set()
        entities = []

        for ent in doc.ents:
            if ent.label_ not in interesting_labels:
                continue
            key = (ent.label_, ent.text.strip())
            if key in seen:
                continue
            seen.add(key)

            # Include surrounding context (sentence)
            sent = ent.sent.text[:200]
            entities.append({"label": ent.label_, "text": ent.text.strip(), "context": sent})

        return entities[:50]  # cap at 50 entities per document
    except Exception:
        return []


def _parse_date(date_str: str | None) -> datetime | None:
    if not date_str:
        return None
    from dateutil import parser as dateutil_parser
    try:
        return dateutil_parser.parse(date_str)
    except Exception:
        return None


def _collect_structured_texts(knowledge_data: dict) -> list:
    texts = []
    for key in ("obligations", "deadlines", "risks", "metrics"):
        for item in knowledge_data.get(key, []):
            content = item.get("content", "")
            if content:
                texts.append(content)
    return texts


async def _get_company_language(db, company_id) -> str:
    from app.models.company import Company
    from sqlalchemy import select
    result = await db.execute(select(Company.language).where(Company.id == company_id))
    lang = result.scalar_one_or_none()
    return lang or "en"


def from_app_user(user_cls):
    """Helper to avoid circular import in get()."""
    return user_cls
