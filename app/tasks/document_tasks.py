from app.core.celery_app import celery_app
from app.services.document_processor import extract_text
from app.services.ai_service import summarize_document, extract_knowledge, classify_document, generate_embedding
from app.services.s3_service import upload_file
from datetime import datetime


@celery_app.task(name="app.tasks.document_tasks.process_document_task")
def process_document_task(document_id: str, file_content: bytes, mime_type: str):
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.document import Document, DocumentStatus, DocumentType
    from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType, RiskLevel
    from sqlalchemy import select
    
    async def process():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            
            if not document:
                return
            
            document.status = DocumentStatus.PROCESSING
            await db.commit()
            
            try:
                await upload_file(file_content, document.file_path, mime_type)
                
                extracted_text = await extract_text(file_content, mime_type)
                if not extracted_text:
                    document.status = DocumentStatus.FAILED
                    await db.commit()
                    return
                
                document.extracted_text = extracted_text
                
                doc_type = await classify_document(document.original_filename, extracted_text[:500])
                if doc_type in [dt.value for dt in DocumentType]:
                    document.document_type = DocumentType(doc_type)
                
                summary = await summarize_document(extracted_text)
                document.summary = summary
                
                embedding = await generate_embedding(extracted_text[:8000])
                document.embedding = embedding
                
                knowledge_data = await extract_knowledge(extracted_text, document.document_type.value)
                
                for obligation in knowledge_data.get("obligations", []):
                    entry = KnowledgeEntry(
                        company_id=document.company_id,
                        document_id=document.id,
                        knowledge_type=KnowledgeType.OBLIGATION,
                        title=obligation.get("title", "Obligation"),
                        content=obligation.get("content", ""),
                        embedding=await generate_embedding(obligation.get("content", ""))
                    )
                    db.add(entry)
                
                for risk in knowledge_data.get("risks", []):
                    entry = KnowledgeEntry(
                        company_id=document.company_id,
                        document_id=document.id,
                        knowledge_type=KnowledgeType.RISK,
                        title=risk.get("title", "Risk"),
                        content=risk.get("content", ""),
                        risk_level=RiskLevel(risk.get("level", "medium")),
                        embedding=await generate_embedding(risk.get("content", ""))
                    )
                    db.add(entry)
                
                document.status = DocumentStatus.PROCESSED
                document.processed_at = datetime.utcnow()
                await db.commit()
                
            except Exception as e:
                document.status = DocumentStatus.FAILED
                await db.commit()
    
    asyncio.run(process())
