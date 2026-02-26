from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "sme_kb_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.document_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.ai_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
)

celery_app.conf.beat_schedule = {
    "check-compliance-deadlines": {
        "task": "app.tasks.notification_tasks.check_compliance_deadlines",
        "schedule": 3600.0,
    },
    "check-expiring-contracts": {
        "task": "app.tasks.notification_tasks.check_expiring_contracts",
        "schedule": 86400.0,
    },
}
