import boto3
from botocore.exceptions import ClientError
from typing import Optional
from app.core.config import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)


async def upload_file(file_content: bytes, file_key: str, content_type: str) -> bool:
    try:
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key,
            Body=file_content,
            ContentType=content_type
        )
        return True
    except ClientError:
        return False


async def download_file(file_key: str) -> Optional[bytes]:
    try:
        response = s3_client.get_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key
        )
        return response['Body'].read()
    except ClientError:
        return None


async def delete_file(file_key: str) -> bool:
    try:
        s3_client.delete_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key
        )
        return True
    except ClientError:
        return False


async def generate_presigned_url(file_key: str, expiration: int = 3600) -> Optional[str]:
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_BUCKET_NAME, 'Key': file_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError:
        return None
