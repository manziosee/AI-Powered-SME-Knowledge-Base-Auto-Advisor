"""
Seed the super-admin account.

Usage:
    python scripts/seed_admin.py

Creates admin@admin.com / 123456789 with role=super_admin and no company
(super_admin is platform-wide and does not belong to any company).
"""

import asyncio
import sys
import os

# Make sure the project root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole


ADMIN_EMAIL    = "admin@admin.com"
ADMIN_PASSWORD = "123456789"
ADMIN_NAME     = "System Administrator"


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            # Ensure role is super_admin even if account already exists
            existing.role = UserRole.SUPER_ADMIN
            existing.is_active = True
            existing.is_verified = True
            existing.hashed_password = get_password_hash(ADMIN_PASSWORD)
            await db.commit()
            print(f"[seed_admin] Updated existing account → {ADMIN_EMAIL} (super_admin)")
            return

        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            full_name=ADMIN_NAME,
            role=UserRole.SUPER_ADMIN,
            company_id=None,   # super_admin is platform-wide, no company
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        await db.commit()
        print(f"[seed_admin] Created super_admin → {ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed())
