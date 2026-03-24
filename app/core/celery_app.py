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
        "app.tasks.training_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=35 * 60,       # 35 min hard limit (training can be slow)
    task_soft_time_limit=30 * 60,  # 30 min soft limit
    # Route training tasks to a dedicated queue so they don't block
    # document processing or notification workers
    task_routes={
        "app.tasks.training_tasks.*": {"queue": "training"},
        "app.tasks.document_tasks.*": {"queue": "documents"},
        "app.tasks.notification_tasks.*": {"queue": "default"},
        "app.tasks.ai_tasks.*": {"queue": "default"},
    },
    # Keep training task results for 24 hours (they're big)
    result_expires=86400,
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
