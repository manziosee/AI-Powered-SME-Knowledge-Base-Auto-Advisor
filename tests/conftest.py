"""
Pytest configuration — sets required environment variables before any app
module is imported, so Settings can be instantiated without a .env file.
"""

import os

os.environ.setdefault("SECRET_KEY",            "test-secret-key")
os.environ.setdefault("DATABASE_URL",          "postgresql+asyncpg://u:p@localhost/test")
os.environ.setdefault("REDIS_URL",             "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL",     "redis://localhost:6379/1")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
os.environ.setdefault("AWS_ACCESS_KEY_ID",     "testkey")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testsecret")
os.environ.setdefault("S3_BUCKET_NAME",        "test-bucket")
