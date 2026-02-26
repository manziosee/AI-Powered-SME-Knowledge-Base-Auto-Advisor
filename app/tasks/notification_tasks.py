from app.core.celery_app import celery_app
from datetime import datetime, timedelta


@celery_app.task(name="app.tasks.notification_tasks.check_compliance_deadlines")
def check_compliance_deadlines():
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.knowledge_entry import KnowledgeEntry, KnowledgeType
    from app.models.notification import Notification, NotificationType
    from app.models.user import User
    from sqlalchemy import select, and_
    
    async def check():
        async with AsyncSessionLocal() as db:
            deadline_threshold = datetime.utcnow() + timedelta(days=7)
            
            result = await db.execute(
                select(KnowledgeEntry).where(
                    and_(
                        KnowledgeEntry.knowledge_type == KnowledgeType.DEADLINE,
                        KnowledgeEntry.deadline <= deadline_threshold,
                        KnowledgeEntry.deadline >= datetime.utcnow(),
                        KnowledgeEntry.is_active == True
                    )
                )
            )
            
            upcoming_deadlines = result.scalars().all()
            
            for deadline in upcoming_deadlines:
                users_result = await db.execute(
                    select(User).where(User.company_id == deadline.company_id)
                )
                users = users_result.scalars().all()
                
                for user in users:
                    notification = Notification(
                        user_id=user.id,
                        notification_type=NotificationType.DEADLINE,
                        title=f"Upcoming Deadline: {deadline.title}",
                        message=f"Deadline on {deadline.deadline.strftime('%Y-%m-%d')}: {deadline.content}"
                    )
                    db.add(notification)
            
            await db.commit()
    
    asyncio.run(check())


@celery_app.task(name="app.tasks.notification_tasks.check_expiring_contracts")
def check_expiring_contracts():
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.document import Document, DocumentType
    from app.models.notification import Notification, NotificationType
    from app.models.user import User
    from sqlalchemy import select
    
    async def check():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Document).where(Document.document_type == DocumentType.CONTRACT)
            )
            contracts = result.scalars().all()
            
            for contract in contracts:
                if contract.metadata.get("expiry_date"):
                    expiry = datetime.fromisoformat(contract.metadata["expiry_date"])
                    if expiry <= datetime.utcnow() + timedelta(days=30):
                        users_result = await db.execute(
                            select(User).where(User.company_id == contract.company_id)
                        )
                        users = users_result.scalars().all()
                        
                        for user in users:
                            notification = Notification(
                                user_id=user.id,
                                notification_type=NotificationType.EXPIRING_CONTRACT,
                                title=f"Contract Expiring: {contract.original_filename}",
                                message=f"Contract expires on {expiry.strftime('%Y-%m-%d')}"
                            )
                            db.add(notification)
            
            await db.commit()
    
    asyncio.run(check())
