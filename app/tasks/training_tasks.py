"""
Celery tasks for asynchronous ML model training.

Triggered via the admin API or directly via the CLI training script.
Each task:
  1. Marks the ModelVersion row as RUNNING
  2. Trains the model (CPU-bound, may take 10-60 s)
  3. Persists the .pkl file to /app/models/
  4. Updates ModelVersion to COMPLETED with accuracy metrics
  5. Auto-activates the new version if requested

Queued on the "training" Celery queue so training jobs don't block
regular document processing.
"""

import asyncio
import logging
from typing import Dict, List, Optional

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper: run an async training function inside a synchronous Celery task
# ---------------------------------------------------------------------------

def _run_async(coro):
    """Execute an async coroutine from a sync Celery task."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError("closed")
        return loop.run_until_complete(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()


# ---------------------------------------------------------------------------
# Task: train document classifier
# ---------------------------------------------------------------------------

@celery_app.task(
    name="app.tasks.training_tasks.train_document_classifier_task",
    bind=True,
    queue="training",
    max_retries=1,
    soft_time_limit=1800,   # 30 min
    time_limit=2100,        # 35 min hard kill
    acks_late=True,
)
def train_document_classifier_task(
    self,
    training_samples: List[Dict[str, str]],
    company_id: Optional[str] = None,
    trained_by: Optional[str] = None,
    notes: Optional[str] = None,
    auto_activate: bool = True,
    use_default_samples: bool = False,
) -> Dict:
    """
    Train (or fine-tune) the document classifier asynchronously.

    Parameters
    ----------
    training_samples : list of {"text": "...", "label": "..."}
        Custom samples. If empty and use_default_samples=True the built-in
        dataset is used.
    company_id : str | None
        Company UUID for per-tenant models; None = global model.
    trained_by : str | None
        UUID of the user who triggered the job.
    notes : str | None
        Optional comment stored in ModelVersion.
    auto_activate : bool
        Promote new version to active after successful training.
    use_default_samples : bool
        Merge the built-in 120-sample dataset with supplied samples.

    Returns
    -------
    dict with keys: version_id, version, accuracy, cv_accuracy, sample_count, file_path
    """
    async def _train():
        from app.core.database import AsyncSessionLocal
        from app.services.training_service import (
            train_document_classifier,
            DEFAULT_DOCUMENT_SAMPLES,
        )

        samples = list(training_samples)
        if use_default_samples:
            samples = DEFAULT_DOCUMENT_SAMPLES + samples

        if not samples:
            raise ValueError("No training samples provided and use_default_samples=False")

        async with AsyncSessionLocal() as db:
            mv = await train_document_classifier(
                db=db,
                training_samples=samples,
                company_id=company_id,
                trained_by=trained_by,
                notes=notes,
                auto_activate=auto_activate,
            )
            return {
                "version_id":   str(mv.id),
                "version":      mv.version,
                "accuracy":     mv.accuracy,
                "cv_accuracy":  mv.cv_accuracy,
                "sample_count": mv.sample_count,
                "file_path":    mv.file_path,
                "is_active":    mv.is_active,
                "status":       mv.status.value,
            }

    logger.info(
        "training_tasks: document classifier task started — samples=%d company=%s",
        len(training_samples),
        company_id,
    )
    try:
        result = _run_async(_train())
        logger.info(
            "training_tasks: document classifier v%s completed — accuracy=%.3f",
            result.get("version"),
            result.get("accuracy") or 0,
        )
        return result
    except Exception as exc:
        logger.exception("training_tasks: document classifier failed: %s", exc)
        raise self.retry(exc=exc, countdown=30) if self.request.retries < self.max_retries else exc


# ---------------------------------------------------------------------------
# Task: train risk scorer
# ---------------------------------------------------------------------------

@celery_app.task(
    name="app.tasks.training_tasks.train_risk_scorer_task",
    bind=True,
    queue="training",
    max_retries=1,
    soft_time_limit=1800,
    time_limit=2100,
    acks_late=True,
)
def train_risk_scorer_task(
    self,
    training_samples: List[Dict[str, str]],
    company_id: Optional[str] = None,
    trained_by: Optional[str] = None,
    notes: Optional[str] = None,
    auto_activate: bool = True,
    use_default_samples: bool = False,
) -> Dict:
    """
    Train (or fine-tune) the risk scorer asynchronously.

    Parameters
    ----------
    training_samples : list of {"text": "...", "label": "critical|high|medium|low"}
    company_id : str | None
    trained_by : str | None
    notes : str | None
    auto_activate : bool
    use_default_samples : bool
        Merge the built-in 40-sample dataset with supplied samples.
    """
    async def _train():
        from app.core.database import AsyncSessionLocal
        from app.services.training_service import (
            train_risk_scorer,
            DEFAULT_RISK_SAMPLES,
        )

        samples = list(training_samples)
        if use_default_samples:
            samples = DEFAULT_RISK_SAMPLES + samples

        if not samples:
            raise ValueError("No training samples provided and use_default_samples=False")

        async with AsyncSessionLocal() as db:
            mv = await train_risk_scorer(
                db=db,
                training_samples=samples,
                company_id=company_id,
                trained_by=trained_by,
                notes=notes,
                auto_activate=auto_activate,
            )
            return {
                "version_id":   str(mv.id),
                "version":      mv.version,
                "accuracy":     mv.accuracy,
                "cv_accuracy":  mv.cv_accuracy,
                "sample_count": mv.sample_count,
                "file_path":    mv.file_path,
                "is_active":    mv.is_active,
                "status":       mv.status.value,
            }

    logger.info(
        "training_tasks: risk scorer task started — samples=%d company=%s",
        len(training_samples),
        company_id,
    )
    try:
        result = _run_async(_train())
        logger.info(
            "training_tasks: risk scorer v%s completed — accuracy=%.3f",
            result.get("version"),
            result.get("accuracy") or 0,
        )
        return result
    except Exception as exc:
        logger.exception("training_tasks: risk scorer failed: %s", exc)
        raise self.retry(exc=exc, countdown=30) if self.request.retries < self.max_retries else exc


# ---------------------------------------------------------------------------
# Task: train both models with defaults (convenience one-shot bootstrap)
# ---------------------------------------------------------------------------

@celery_app.task(
    name="app.tasks.training_tasks.train_both_defaults_task",
    bind=True,
    queue="training",
    max_retries=0,
    soft_time_limit=3600,
    time_limit=3900,
    acks_late=True,
)
def train_both_defaults_task(
    self,
    extra_doc_samples: Optional[List[Dict[str, str]]] = None,
    extra_risk_samples: Optional[List[Dict[str, str]]] = None,
    trained_by: Optional[str] = None,
) -> Dict:
    """
    Bootstrap training: train both models using the built-in datasets.
    Optionally merge in extra custom samples on top.
    """
    async def _train():
        from app.core.database import AsyncSessionLocal
        from app.services.training_service import train_both_defaults

        async with AsyncSessionLocal() as db:
            doc_mv, risk_mv = await train_both_defaults(
                db=db,
                extra_doc_samples=extra_doc_samples or [],
                extra_risk_samples=extra_risk_samples or [],
                trained_by=trained_by,
            )
            return {
                "document_classifier": {
                    "version_id":   str(doc_mv.id),
                    "version":      doc_mv.version,
                    "accuracy":     doc_mv.accuracy,
                    "sample_count": doc_mv.sample_count,
                    "is_active":    doc_mv.is_active,
                },
                "risk_scorer": {
                    "version_id":   str(risk_mv.id),
                    "version":      risk_mv.version,
                    "accuracy":     risk_mv.accuracy,
                    "sample_count": risk_mv.sample_count,
                    "is_active":    risk_mv.is_active,
                },
            }

    logger.info("training_tasks: bootstrapping both default models")
    return _run_async(_train())
