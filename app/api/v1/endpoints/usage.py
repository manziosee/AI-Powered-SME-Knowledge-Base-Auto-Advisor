"""
Usage & API Quota endpoints

GET    /usage/stats      - Get usage statistics
GET    /usage/plan      - Get subscription plan details  
GET    /usage/history   - Get API call history
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.api.dependencies import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.api_usage import APIUsage, APISubscriptionPlan

router = APIRouter(prefix="/usage", tags=["Usage & API Quotas"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class UsageStatsResponse(BaseModel):
    requests_this_month: int
    requests_limit: int
    tokens_this_month: int
    tokens_limit: int
    requests_today: int
    tokens_today: int
    period_start: str
    period_end: str


class PlanResponse(BaseModel):
    name: str
    monthly_requests_limit: int
    monthly_tokens_limit: int
    daily_requests_limit: int
    daily_tokens_limit: int
    requests_used_this_month: int
    tokens_used_this_month: int
    requests_used_today: int
    tokens_used_today: int
    current_period_start: str
    current_period_end: str


class UsageHistoryItem(BaseModel):
    id: str
    endpoint: str
    method: str
    status_code: int
    tokens_used: int
    latency_ms: Optional[int]
    created_at: str


class UsageHistoryResponse(BaseModel):
    items: list[UsageHistoryItem]
    total: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=UsageStatsResponse, summary="Get usage statistics")
async def get_usage_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current usage statistics for the company."""
    if not current_user.company_id:
        return UsageStatsResponse(
            requests_this_month=0, requests_limit=0,
            tokens_this_month=0, tokens_limit=0,
            requests_today=0, tokens_today=0,
            period_start=datetime.utcnow().isoformat(),
            period_end=datetime.utcnow().isoformat(),
        )
    
    # Get subscription plan
    plan_result = await db.execute(
        select(APISubscriptionPlan).where(
            APISubscriptionPlan.company_id == current_user.company_id
        )
    )
    plan = plan_result.scalar_one_or_none()
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # This month's usage
    month_result = await db.execute(
        select(
            func.count(APIUsage.id).label('requests'),
            func.coalesce(func.sum(APIUsage.tokens_used), 0).label('tokens')
        ).where(
            APIUsage.company_id == current_user.company_id,
            APIUsage.created_at >= month_start
        )
    )
    month_row = month_result.first()
    
    # Today's usage  
    today_result = await db.execute(
        select(
            func.count(APIUsage.id).label('requests'),
            func.coalesce(func.sum(APIUsage.tokens_used), 0).label('tokens')
        ).where(
            APIUsage.company_id == current_user.company_id,
            APIUsage.created_at >= today_start
        )
    )
    today_row = today_result.first()
    
    requests_limit = plan.monthly_requests_limit if plan and plan.monthly_requests_limit else 10000
    tokens_limit = plan.monthly_tokens_limit if plan and plan.monthly_tokens_limit else 100000
    
    period_start = plan.current_period_start if plan else month_start
    period_end = plan.current_period_end if plan else (month_start + timedelta(days=30))
    
    return UsageStatsResponse(
        requests_this_month=month_row.requests if month_row else 0,
        requests_limit=requests_limit,
        tokens_this_month=int(month_row.tokens) if month_row else 0,
        tokens_limit=tokens_limit,
        requests_today=today_row.requests if today_row else 0,
        tokens_today=int(today_row.tokens) if today_row else 0,
        period_start=period_start.isoformat() if period_start else month_start.isoformat(),
        period_end=period_end.isoformat() if period_end else (month_start + timedelta(days=30)).isoformat(),
    )


@router.get("/plan", response_model=PlanResponse, summary="Get subscription plan")
async def get_plan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the current subscription plan details."""
    if not current_user.company_id:
        return PlanResponse(
            name="Free",
            monthly_requests_limit=1000,
            monthly_tokens_limit=100000,
            daily_requests_limit=100,
            daily_tokens_limit=10000,
            requests_used_this_month=0,
            tokens_used_this_month=0,
            requests_used_today=0,
            tokens_used_today=0,
            current_period_start=datetime.utcnow().replace(day=1).isoformat(),
            current_period_end=(datetime.utcnow() + timedelta(days=30)).isoformat(),
        )
    
    result = await db.execute(
        select(APISubscriptionPlan).where(
            APISubscriptionPlan.company_id == current_user.company_id
        )
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        return PlanResponse(
            name="Free",
            monthly_requests_limit=1000,
            monthly_tokens_limit=100000,
            daily_requests_limit=100,
            daily_tokens_limit=10000,
            requests_used_this_month=0,
            tokens_used_this_month=0,
            requests_used_today=0,
            tokens_used_today=0,
            current_period_start=datetime.utcnow().replace(day=1).isoformat(),
            current_period_end=(datetime.utcnow() + timedelta(days=30)).isoformat(),
        )
    
    return PlanResponse(
        name=plan.name,
        monthly_requests_limit=plan.monthly_requests_limit or -1,
        monthly_tokens_limit=plan.monthly_tokens_limit or -1,
        daily_requests_limit=plan.daily_requests_limit or -1,
        daily_tokens_limit=plan.daily_tokens_limit or -1,
        requests_used_this_month=plan.requests_used_this_month,
        tokens_used_this_month=plan.tokens_used_this_month,
        requests_used_today=plan.requests_used_today,
        tokens_used_today=plan.tokens_used_today,
        current_period_start=plan.current_period_start.isoformat(),
        current_period_end=plan.current_period_end.isoformat(),
    )


@router.get("/history", response_model=UsageHistoryResponse, summary="Get API call history")
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recent API call history."""
    if not current_user.company_id:
        return UsageHistoryResponse(items=[], total=0)
    
    query = select(APIUsage).where(
        APIUsage.company_id == current_user.company_id
    ).order_by(desc(APIUsage.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(func.count(APIUsage.id)).where(
            APIUsage.company_id == current_user.company_id
        )
    )
    total = count_result.scalar() or 0
    
    items = [
        UsageHistoryItem(
            id=str(r.id),
            endpoint=r.endpoint,
            method=r.method,
            status_code=r.status_code or 0,
            tokens_used=r.tokens_used or 0,
            latency_ms=r.latency_ms,
            created_at=r.created_at.isoformat(),
        )
        for r in records
    ]
    
    return UsageHistoryResponse(items=items, total=total)