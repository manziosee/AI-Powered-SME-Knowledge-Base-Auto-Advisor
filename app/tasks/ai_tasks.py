from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.ai_tasks.generate_recommendations")
def generate_recommendations(company_id: str):
    pass
