"""
Team Management endpoints - invitations, members, activity

POST   /team/invites           - Invite team member
GET    /team/invites           - List pending invitations
GET    /team/invites/{id}      - Get invitation details
PUT    /team/invites/{id}      - Update invitation
DELETE /team/invites/{id}      - Cancel invitation
POST   /team/invites/{token}/accept - Accept invitation

GET    /team/members           - List team members
GET    /team/members/{id}      - Get member details
PUT    /team/members/{id}      - Update member (role, permissions)
DELETE /team/members/{id}     - Remove member

GET    /team/activity          - Get activity feed
GET    /team/activity/export   - Export activity log

POST   /team/bulk              - Bulk operations on documents
GET    /team/bulk/{id}          - Get bulk operation status
"""

import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_active_user, require_role
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.team import (
    TeamInvitation, InvitationStatus, InvitationRole,
    TeamMember, ActivityLog, BulkOperation, OnlineUser, DocumentTag
)

router = APIRouter(prefix="/team", tags=["Team Management"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: InvitationRole = InvitationRole.MEMBER
    message: Optional[str] = None
    permissions: Optional[dict] = None


class UpdateInvitationRequest(BaseModel):
    role: Optional[InvitationRole] = None
    message: Optional[str] = None
    permissions: Optional[dict] = None


class UpdateMemberRequest(BaseModel):
    role: Optional[InvitationRole] = None
    permissions: Optional[dict] = None
    is_active: Optional[bool] = None


class BulkOperationRequest(BaseModel):
    operation_type: str  # "delete", "move", "archive", "tag", "untag"
    document_ids: List[str]
    parameters: Optional[dict] = None


class AcceptInvitationRequest(BaseModel):
    token: str


# ---------------------------------------------------------------------------
# Invitations
# ---------------------------------------------------------------------------

@router.post("/invites", status_code=201, summary="Invite team member")
async def invite_member(
    payload: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Invite a new team member via email."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company")
    
    # Check if email already in company
    result = await db.execute(
        select(User).where(
            and_(
                User.email == payload.email,
                User.company_id == current_user.company_id
            )
        )
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this company"
        )
    
    # Check for pending invitation
    result = await db.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.email == payload.email,
                TeamInvitation.company_id == current_user.company_id,
                TeamInvitation.status == InvitationStatus.PENDING
            )
        )
    )
    existing_invite = result.scalar_one_or_none()
    if existing_invite:
        raise HTTPException(
            status_code=400,
            detail="Invitation already pending for this email"
        )
    
    # Create invitation
    token = secrets.token_urlsafe(32)
    invitation = TeamInvitation(
        email=payload.email,
        company_id=current_user.company_id,
        role=payload.role,
        permissions=payload.permissions,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        invited_by_id=current_user.id,
        message=payload.message,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    
    # TODO: Send invitation email
    
    return {
        "id": str(invitation.id),
        "email": invitation.email,
        "role": invitation.role.value,
        "status": invitation.status.value,
        "expires_at": invitation.expires_at.isoformat(),
        "message": invitation.message,
    }


@router.get("/invites", summary="List pending invitations")
async def list_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """List all pending invitations for the company."""
    result = await db.execute(
        select(TeamInvitation)
        .where(
            and_(
                TeamInvitation.company_id == current_user.company_id,
                TeamInvitation.status == InvitationStatus.PENDING
            )
        )
        .options(selectinload(TeamInvitation.invited_by))
        .order_by(desc(TeamInvitation.created_at))
    )
    invitations = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(i.id),
                "email": i.email,
                "role": i.role.value,
                "status": i.status.value,
                "message": i.message,
                "expires_at": i.expires_at.isoformat(),
                "created_at": i.created_at.isoformat(),
                "invited_by": {
                    "name": i.invited_by.full_name,
                    "email": i.invited_by.email,
                } if i.invited_by else None,
            }
            for i in invitations
        ]
    }


@router.delete("/invites/{invitation_id}", summary="Cancel invitation")
async def cancel_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Cancel a pending invitation."""
    result = await db.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.id == invitation_id,
                TeamInvitation.company_id == current_user.company_id
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invitation is not pending")
    
    invitation.status = InvitationStatus.CANCELLED
    await db.commit()
    
    return {"status": "cancelled", "id": invitation_id}


@router.post("/invites/accept", summary="Accept invitation")
async def accept_invitation(
    payload: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Accept a team invitation."""
    result = await db.execute(
        select(TeamInvitation).where(
            and_(
                TeamInvitation.token == payload.token,
                TeamInvitation.status == InvitationStatus.PENDING
            )
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or expired")
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = InvitationStatus.EXPIRED
        await db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    if invitation.email != current_user.email:
        raise HTTPException(status_code=403, detail="Invitation is not for your email")
    
    # Accept invitation
    invitation.status = InvitationStatus.ACCEPTED
    invitation.user_id = current_user.id
    invitation.accepted_at = datetime.utcnow()
    
    # Add to team members
    member = TeamMember(
        user_id=current_user.id,
        company_id=invitation.company_id,
        role=invitation.role,
        permissions=invitation.permissions,
    )
    db.add(member)
    await db.commit()
    
    return {"status": "accepted", "message": "You are now a team member"}


# ---------------------------------------------------------------------------
# Team Members
# ---------------------------------------------------------------------------

@router.get("/members", summary="List team members")
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all team members."""
    result = await db.execute(
        select(TeamMember)
        .where(
            and_(
                TeamMember.company_id == current_user.company_id,
                TeamMember.is_active == True
            )
        )
        .options(selectinload(TeamMember.user))
        .order_by(desc(TeamMember.is_owner), desc(TeamMember.created_at))
    )
    members = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(m.id),
                "user": {
                    "id": str(m.user.id),
                    "name": m.user.full_name,
                    "email": m.user.email,
                    "avatar": m.user.avatar_url,
                },
                "role": m.role.value,
                "is_owner": m.is_owner,
                "last_active": m.last_active_at.isoformat() if m.last_active_at else None,
                "joined_at": m.created_at.isoformat(),
            }
            for m in members
        ]
    }


@router.put("/members/{member_id}", summary="Update member")
async def update_member(
    member_id: str,
    payload: UpdateMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Update member role or permissions."""
    result = await db.execute(
        select(TeamMember).where(
            and_(
                TeamMember.id == member_id,
                TeamMember.company_id == current_user.company_id
            )
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.is_owner:
        raise HTTPException(status_code=400, detail="Cannot modify owner")
    
    if payload.role:
        member.role = payload.role
    if payload.permissions is not None:
        member.permissions = payload.permissions
    if payload.is_active is not None:
        member.is_active = payload.is_active
    
    await db.commit()
    
    return {"status": "updated", "id": member_id}


@router.delete("/members/{member_id}", summary="Remove member")
async def remove_member(
    member_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Remove a team member."""
    result = await db.execute(
        select(TeamMember).where(
            and_(
                TeamMember.id == member_id,
                TeamMember.company_id == current_user.company_id
            )
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.is_owner:
        raise HTTPException(status_code=400, detail="Cannot remove owner")
    
    if member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    
    member.is_active = False
    await db.commit()
    
    return {"status": "removed", "id": member_id}


# ---------------------------------------------------------------------------
# Activity Feed
# ---------------------------------------------------------------------------

@router.get("/activity", summary="Get activity feed")
async def get_activity(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    action_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get recent activity for the company."""
    query = select(ActivityLog).where(
        ActivityLog.company_id == current_user.company_id
    )
    
    if action_type:
        query = query.where(ActivityLog.action == action_type)
    
    query = query.order_by(desc(ActivityLog.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query.options(selectinload(ActivityLog.user)))
    activities = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(a.id),
                "action": a.action,
                "title": a.title,
                "description": a.description,
                "resource_type": a.resource_type,
                "resource_id": str(a.resource_id) if a.resource_id else None,
                "user": {
                    "id": str(a.user.id),
                    "name": a.user.full_name,
                    "avatar": a.user.avatar_url,
                } if a.user else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in activities
        ],
        "limit": limit,
        "offset": offset,
    }


@router.get("/activity/export", summary="Export activity log")
async def export_activity(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    action_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """Export activity log as CSV."""
    # TODO: Implement CSV export
    return {"message": "Export feature coming soon"}


# ---------------------------------------------------------------------------
# Bulk Operations
# ---------------------------------------------------------------------------

@router.post("/bulk", status_code=202, summary="Bulk operation on documents")
async def create_bulk_operation(
    payload: BulkOperationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a bulk operation on documents."""
    operation = BulkOperation(
        company_id=current_user.company_id,
        user_id=current_user.id,
        operation_type=payload.operation_type,
        document_ids=payload.document_ids,
        parameters=payload.parameters,
        total_count=len(payload.document_ids),
    )
    db.add(operation)
    await db.commit()
    await db.refresh(operation)
    
    # TODO: Queue the bulk operation to Celery
    
    return {
        "id": str(operation.id),
        "operation_type": operation.operation_type,
        "status": operation.status,
        "total_count": operation.total_count,
    }


@router.get("/bulk/{operation_id}", summary="Get bulk operation status")
async def get_bulk_operation(
    operation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the status of a bulk operation."""
    result = await db.execute(
        select(BulkOperation).where(
            and_(
                BulkOperation.id == operation_id,
                BulkOperation.company_id == current_user.company_id
            )
        )
    )
    operation = result.scalar_one_or_none()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    return {
        "id": str(operation.id),
        "operation_type": operation.operation_type,
        "status": operation.status,
        "total_count": operation.total_count,
        "processed_count": operation.processed_count,
        "failed_count": operation.failed_count,
        "errors": operation.errors,
        "created_at": operation.created_at.isoformat(),
        "completed_at": operation.completed_at.isoformat() if operation.completed_at else None,
    }


# ---------------------------------------------------------------------------
# Online Users (Real-time indicators)
# ---------------------------------------------------------------------------

@router.get("/online", summary="Get online team members")
async def get_online_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get currently online team members."""
    # Consider users online if they have activity in last 5 minutes
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    
    result = await db.execute(
        select(OnlineUser).where(
            and_(
                OnlineUser.company_id == current_user.company_id,
                OnlineUser.is_active == True,
                OnlineUser.last_heartbeat >= cutoff
            )
        )
        .options(selectinload(OnlineUser.user))
    )
    users = result.scalars().all()
    
    return {
        "items": [
            {
                "user": {
                    "id": str(u.user.id),
                    "name": u.user.full_name,
                    "avatar": u.user.avatar_url,
                },
                "current_page": u.current_page,
                "resource": {
                    "type": u.resource_type,
                    "id": str(u.resource_id),
                } if u.resource_type and u.resource_id else None,
                "last_seen": u.last_heartbeat.isoformat(),
            }
            for u in users
        ]
    }


@router.post("/heartbeat", summary="Update user heartbeat")
async def update_heartbeat(
    current_page: Optional[str] = None,
    resource_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update user's online status."""
    if not current_user.company_id:
        return {"status": "ignored"}
    
    result = await db.execute(
        select(OnlineUser).where(
            and_(
                OnlineUser.user_id == current_user.id,
                OnlineUser.company_id == current_user.company_id,
                OnlineUser.is_active == True
            )
        )
    )
    online = result.scalar_one_or_none()
    
    if online:
        online.last_heartbeat = datetime.utcnow()
        online.current_page = current_page
        if resource_id:
            online.resource_id = resource_id
        if resource_type:
            online.resource_type = resource_type
    else:
        online = OnlineUser(
            user_id=current_user.id,
            company_id=current_user.company_id,
            current_page=current_page,
            resource_id=resource_id,
            resource_type=resource_type,
        )
        db.add(online)
    
    await db.commit()
    
    return {"status": "ok"}