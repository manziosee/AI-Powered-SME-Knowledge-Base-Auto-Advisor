"""
Data retention enforcement task.

Runs daily via Celery Beat. Checks each company's `settings.retention_days`
and soft-deletes / archives documents and knowledge entries older than the
configured threshold. GDPR/RPDP-compliant by default.

Company settings JSON structure:
    {"retention_days": 365}   # 0 or absent = keep forever
"""

from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.retention_tasks.enforce_data_retention")
def enforce_data_retention():
    import asyncio

    async def run():
        import logging
        from datetime import datetime, timedelta
        from sqlalchemy import select, and_
        from app.core.database import AsyncSessionLocal
        from app.models.company import Company
        from app.models.document import Document, DocumentStatus
        from app.models.knowledge_entry import KnowledgeEntry

        logger = logging.getLogger(__name__)

        async with AsyncSessionLocal() as db:
            company_result = await db.execute(select(Company).where(Company.is_active == True))  # noqa: E712
            companies = company_result.scalars().all()

            for company in companies:
                retention_days = (company.settings or {}).get("retention_days", 0)
                if not retention_days or retention_days <= 0:
                    continue  # 0 = keep forever

                cutoff = datetime.utcnow() - timedelta(days=retention_days)

                # Mark old documents as FAILED (soft archive) and deactivate knowledge entries
                docs_result = await db.execute(
                    select(Document).where(
                        and_(
                            Document.company_id == company.id,
                            Document.created_at < cutoff,
                            Document.status == DocumentStatus.PROCESSED,
                        )
                    )
                )
                old_docs = docs_result.scalars().all()
                doc_count = len(old_docs)
                for doc in old_docs:
                    doc.status = DocumentStatus.FAILED
                    doc.doc_metadata = {**(doc.doc_metadata or {}), "archived_reason": "retention_policy", "archived_at": datetime.utcnow().isoformat()}

                # Deactivate old knowledge entries
                ke_result = await db.execute(
                    select(KnowledgeEntry).where(
                        and_(
                            KnowledgeEntry.company_id == company.id,
                            KnowledgeEntry.created_at < cutoff,
                            KnowledgeEntry.is_active == True,  # noqa: E712
                        )
                    )
                )
                old_entries = ke_result.scalars().all()
                ke_count = len(old_entries)
                for entry in old_entries:
                    entry.is_active = False

                if doc_count or ke_count:
                    logger.info(
                        "Retention: company=%s archived %d docs, %d knowledge entries (retention=%d days)",
                        company.id, doc_count, ke_count, retention_days,
                    )

            await db.commit()

    asyncio.run(run())
