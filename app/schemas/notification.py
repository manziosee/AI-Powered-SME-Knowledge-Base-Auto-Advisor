from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True
