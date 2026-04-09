"""
Task Status API - Track long-running async jobs

GET  /tasks/              - List tasks for current user/company
GET  /tasks/{task_id}    - Get status of specific task
DELETE /tasks/{task_id}  - Cancel a pending task
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.task import BackgroundTask, TaskStatus

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskResponse(BaseModel):
    task_id: str
    task_name: str
    status: str
    progress: int
    progress_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/", summary="List tasks", description="Get all tasks for the current user or company")
async def list_tasks(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tasks for the current user with optional status filter."""
    query = select(BackgroundTask).where(
        BackgroundTask.user_id == current_user.id
    )
    
    if status_filter:
        try:
            task_status = TaskStatus(status_filter)
            query = query.where(BackgroundTask.status == task_status)
        except ValueError:
            pass  # Ignore invalid status
    
    query = query.order_by(BackgroundTask.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return {
        "items": [
            {
                "task_id": t.task_id,
                "task_name": t.task_name,
                "status": t.status.value,
                "progress": t.progress,
                "progress_message": t.progress_message,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "started_at": t.started_at.isoformat() if t.started_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "error_message": t.error_message,
            }
            for t in tasks
        ],
        "total": len(tasks),
        "limit": limit,
        "offset": offset,
    }


@router.get("/{task_id}", summary="Get task status", description="Get detailed status of a specific task")
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed information about a specific task."""
    result = await db.execute(
        select(BackgroundTask).where(
            and_(
                BackgroundTask.task_id == task_id,
                BackgroundTask.user_id == current_user.id
            )
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return {
        "task_id": task.task_id,
        "task_name": task.task_name,
        "status": task.status.value,
        "priority": task.priority.value if task.priority else "normal",
        "progress": task.progress,
        "progress_message": task.progress_message,
        "input_data": task.input_data,
        "result_data": task.result_data,
        "error_message": task.error_message,
        "error_traceback": task.error_traceback,
        "retry_count": task.retry_count,
        "max_retries": task.max_retries,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "estimated_completion": task.estimated_completion.isoformat() if task.estimated_completion else None,
    }


@router.delete("/{task_id}", summary="Cancel task", description="Cancel a pending or in-progress task")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Attempt to cancel a task."""
    result = await db.execute(
        select(BackgroundTask).where(
            and_(
                BackgroundTask.task_id == task_id,
                BackgroundTask.user_id == current_user.id
            )
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Can only cancel pending or started tasks
    if task.status in [TaskStatus.PENDING, TaskStatus.STARTED]:
        task.status = TaskStatus.CANCELLED
        task.completed_at = datetime.utcnow()
        await db.commit()
        return {"status": "cancelled", "task_id": task_id}
    
    return {"status": "cannot_cancel", "message": f"Task is already {task.status.value}"}


@router.get("/types/available", summary="Available task types", description="List all available task types that can be created")
async def get_available_tasks():
    """Get list of available task types and their descriptions."""
    return {
        "task_types": [
            {"name": "process_document", "description": "Process and index a document", "estimated_time": "30-60s"},
            {"name": "export_user_data", "description": "Export user data (GDPR)", "estimated_time": "1-5min"},
            {"name": "bulk_document_upload", "description": "Process multiple documents", "estimated_time": "1-10min"},
            {"name": "compliance_scan", "description": "Scan documents for compliance", "estimated_time": "30s-5min"},
            {"name": "generate_report", "description": "Generate analytics report", "estimated_time": "10-60s"},
        ]
    }