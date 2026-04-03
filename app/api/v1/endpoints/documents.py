"""
Document management endpoints.

POST   /documents/upload          — upload file (triggers async processing)
POST   /documents/bulk-upload     — upload multiple files at once (max 20)
GET    /documents/                — list company documents (filterable, paginated)
GET    /documents/search          — semantic search across documents + knowledge
GET    /documents/{id}            — get document detail
GET    /documents/{id}/download   — get presigned S3 download URL
GET    /documents/{id}/knowledge  — get extracted knowledge entries for a document
PATCH  /documents/{id}            — update metadata / tags
DELETE /documents/{id}            — delete document + S3 file
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, and_, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.knowledge_entry import KnowledgeEntry
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.services.ai_service import generate_embedding
from app.tasks.document_tasks import process_document_task

router = APIRouter()


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a single document",
    description=(
        "Upload a PDF, DOCX, XLSX, DOC, XLS, or TXT file for AI processing. "
        "If a document with the same filename already exists for this company, "
        "the new upload is stored as the next version and the previous document's "
        "ID is recorded in `doc_metadata.previous_version_id`. "
        "Processing (text extraction, embedding, knowledge extraction) is triggered asynchronously."
    ),
    response_description="The newly created Document record with status=uploaded.",
)
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload (PDF, DOCX, XLSX, DOC, XLS, or TXT)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    file_ext = f".{file.filename.split('.')[-1].lower()}" if "." in file.filename else ""
    if file_ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )

    file_content = await file.read()
    file_size = len(file_content)

    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    document_id = uuid.uuid4()
    file_key = f"{current_user.company_id}/{document_id}/{file.filename}"

    # --- Version tracking: find any existing document with the same filename ---
    existing_result = await db.execute(
        select(Document.id, Document.version)
        .where(
            and_(
                Document.company_id == current_user.company_id,
                Document.original_filename == file.filename,
            )
        )
        .order_by(Document.version.desc())
        .limit(1)
    )
    existing_row = existing_result.first()
    new_version = 1
    previous_version_id = None
    if existing_row is not None:
        new_version = (existing_row.version or 1) + 1
        previous_version_id = str(existing_row.id)

    doc_metadata = {}
    if previous_version_id:
        doc_metadata["previous_version_id"] = previous_version_id

    document = Document(
        id=document_id,
        company_id=current_user.company_id,
        filename=file_key,
        original_filename=file.filename,
        file_path=file_key,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.id,
        status=DocumentStatus.UPLOADED,
        version=new_version,
        doc_metadata=doc_metadata,
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    process_document_task.delay(str(document.id), file_content, file.content_type)

    return document


# ---------------------------------------------------------------------------
# Bulk Upload
# ---------------------------------------------------------------------------

@router.post(
    "/bulk-upload",
    status_code=status.HTTP_201_CREATED,
    summary="Bulk upload multiple documents",
    description=(
        "Upload up to 20 files in a single request. Each file is validated and processed "
        "independently. Versioning applies per file just as with single upload. "
        "Returns a summary with counts of uploaded and failed files, plus the list of "
        "DocumentResponse objects for successfully created records."
    ),
    response_description="Summary dict with `uploaded`, `failed`, and `documents` keys.",
)
async def bulk_upload_documents(
    files: List[UploadFile] = File(..., description="List of document files (max 20)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per bulk upload request")

    uploaded_docs: List[DocumentResponse] = []
    failed_count = 0
    errors: List[dict] = []

    for file in files:
        try:
            file_ext = f".{file.filename.split('.')[-1].lower()}" if "." in file.filename else ""
            if file_ext not in settings.allowed_extensions_list:
                failed_count += 1
                errors.append({"filename": file.filename, "error": f"File type '{file_ext}' not allowed"})
                continue

            file_content = await file.read()
            file_size = len(file_content)

            if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                failed_count += 1
                errors.append({"filename": file.filename, "error": f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit"})
                continue

            document_id = uuid.uuid4()
            file_key = f"{current_user.company_id}/{document_id}/{file.filename}"

            # Version tracking
            existing_result = await db.execute(
                select(Document.id, Document.version)
                .where(
                    and_(
                        Document.company_id == current_user.company_id,
                        Document.original_filename == file.filename,
                    )
                )
                .order_by(Document.version.desc())
                .limit(1)
            )
            existing_row = existing_result.first()
            new_version = 1
            doc_metadata: dict = {}
            if existing_row is not None:
                new_version = (existing_row.version or 1) + 1
                doc_metadata["previous_version_id"] = str(existing_row.id)

            document = Document(
                id=document_id,
                company_id=current_user.company_id,
                filename=file_key,
                original_filename=file.filename,
                file_path=file_key,
                file_size=file_size,
                mime_type=file.content_type or "application/octet-stream",
                uploaded_by=current_user.id,
                status=DocumentStatus.UPLOADED,
                version=new_version,
                doc_metadata=doc_metadata,
            )

            db.add(document)
            await db.commit()
            await db.refresh(document)

            process_document_task.delay(str(document.id), file_content, file.content_type)
            uploaded_docs.append(document)

        except Exception as exc:
            failed_count += 1
            errors.append({"filename": file.filename, "error": str(exc)})

    return {
        "uploaded": len(uploaded_docs),
        "failed": failed_count,
        "errors": errors,
        "documents": uploaded_docs,
    }


# ---------------------------------------------------------------------------
# List (with filters)
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=List[DocumentResponse],
    summary="List company documents",
    description="Returns paginated list of documents for the authenticated user's company. Filter by status or document type.",
)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status_filter: Optional[DocumentStatus] = Query(None, alias="status", description="Filter by processing status"),
    doc_type: Optional[DocumentType] = Query(None, description="Filter by document type"),
    search: Optional[str] = Query(None, description="Filter by filename (case-insensitive)"),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    if not current_user.company_id:
        return []

    filters = [Document.company_id == current_user.company_id]
    if status_filter:
        filters.append(Document.status == status_filter)
    if doc_type:
        filters.append(Document.document_type == doc_type)
    if search:
        filters.append(Document.original_filename.ilike(f"%{search}%"))

    result = await db.execute(
        select(Document)
        .where(and_(*filters))
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Semantic search
# ---------------------------------------------------------------------------

@router.get("/search")
async def search_documents(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Semantic search over both documents and knowledge entries using pgvector.
    Returns the most relevant matches ranked by cosine similarity.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    query_embedding = await generate_embedding(q)

    # Search knowledge entries (most granular)
    ke_sql = text("""
        SELECT
            ke.id,
            ke.title,
            ke.content,
            ke.knowledge_type,
            ke.risk_level,
            ke.deadline,
            d.original_filename as source_document,
            ke.embedding <=> :embedding AS distance
        FROM knowledge_entries ke
        LEFT JOIN documents d ON ke.document_id = d.id
        WHERE ke.company_id = :company_id
          AND ke.is_active = true
          AND ke.embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :limit
    """)

    ke_result = await db.execute(
        ke_sql,
        {
            "embedding": str(query_embedding),
            "company_id": str(current_user.company_id),
            "limit": limit,
        },
    )
    ke_rows = ke_result.fetchall()

    # Search document summaries
    doc_sql = text("""
        SELECT
            id,
            original_filename,
            document_type,
            status,
            summary,
            embedding <=> :embedding AS distance
        FROM documents
        WHERE company_id = :company_id
          AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :limit
    """)

    doc_result = await db.execute(
        doc_sql,
        {
            "embedding": str(query_embedding),
            "company_id": str(current_user.company_id),
            "limit": max(5, limit // 2),
        },
    )
    doc_rows = doc_result.fetchall()

    return {
        "query": q,
        "knowledge_results": [
            {
                "id": str(r.id),
                "title": r.title,
                "content": r.content[:400],
                "type": str(r.knowledge_type),
                "risk_level": str(r.risk_level),
                "deadline": r.deadline.isoformat() if r.deadline else None,
                "source_document": r.source_document,
                "relevance_score": round(1 - float(r.distance), 4),
            }
            for r in ke_rows
        ],
        "document_results": [
            {
                "id": str(r.id),
                "filename": r.original_filename,
                "type": str(r.document_type),
                "status": str(r.status),
                "summary": (r.summary or "")[:300],
                "relevance_score": round(1 - float(r.distance), 4),
            }
            for r in doc_rows
        ],
    }


# ---------------------------------------------------------------------------
# Get single document
# ---------------------------------------------------------------------------

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = await _get_doc_or_404(db, document_id, current_user.company_id)
    return document


# ---------------------------------------------------------------------------
# Presigned download URL
# ---------------------------------------------------------------------------

@router.get("/{document_id}/download")
async def get_download_url(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    expires_in: int = Query(300, ge=60, le=3600, description="URL validity in seconds"),
):
    document = await _get_doc_or_404(db, document_id, current_user.company_id)

    try:
        import boto3
        from botocore.exceptions import ClientError

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": document.file_path},
            ExpiresIn=expires_in,
        )
        return {
            "download_url": url,
            "filename": document.original_filename,
            "expires_in": expires_in,
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Could not generate download URL: {exc}")


# ---------------------------------------------------------------------------
# Knowledge entries for a document
# ---------------------------------------------------------------------------

@router.get("/{document_id}/knowledge")
async def get_document_knowledge(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = await _get_doc_or_404(db, document_id, current_user.company_id)

    result = await db.execute(
        select(KnowledgeEntry)
        .where(
            and_(
                KnowledgeEntry.document_id == document.id,
                KnowledgeEntry.is_active.is_(True),
            )
        )
        .order_by(KnowledgeEntry.knowledge_type)
    )
    entries = result.scalars().all()

    return {
        "document_id": str(document_id),
        "knowledge_entries": [
            {
                "id": str(e.id),
                "type": e.knowledge_type.value,
                "title": e.title,
                "content": e.content,
                "risk_level": e.risk_level.value if e.risk_level else None,
                "deadline": e.deadline.isoformat() if e.deadline else None,
                "tags": e.tags,
            }
            for e in entries
        ],
        "total": len(entries),
    }


# ---------------------------------------------------------------------------
# Update metadata
# ---------------------------------------------------------------------------

@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: uuid.UUID,
    update_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = await _get_doc_or_404(db, document_id, current_user.company_id)

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(document, field, value)

    await db.commit()
    await db.refresh(document)
    return document


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    document = await _get_doc_or_404(db, document_id, current_user.company_id)

    # Best-effort S3 deletion
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=document.file_path)
    except Exception:
        pass  # DB record still deleted even if S3 cleanup fails

    await db.delete(document)
    await db.commit()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_doc_or_404(db: AsyncSession, document_id, company_id) -> Document:
    result = await db.execute(
        select(Document).where(
            and_(Document.id == document_id, Document.company_id == company_id)
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document
