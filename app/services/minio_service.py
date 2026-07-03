from minio import Minio
from minio.error import S3Error
from datetime import timedelta
import uuid
import io
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        
    def ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error checking/creating MinIO bucket: {e}")

    def upload_image(self, user_id: str, file_bytes: bytes, session_id: str = None, content_type: str = "image/jpeg") -> str:
        """
        Uploads an image to MinIO and returns the object key.
        """
        object_name = f"users/{user_id}/"
        if session_id:
            object_name += f"sessions/{session_id}/"
        object_name += f"{uuid.uuid4()}.jpg"
        
        try:
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(file_bytes),
                length=len(file_bytes),
                content_type=content_type
            )
            return object_name
        except S3Error as e:
            logger.error(f"Failed to upload image to MinIO: {e}")
            raise

    def get_presigned_url(self, object_name: str) -> str:
        """
        Generates a presigned URL for downloading/viewing an image.
        """
        if not object_name:
            return None
            
        try:
            url = self.client.get_presigned_url(
                "GET",
                self.bucket_name,
                object_name,
                expires=timedelta(hours=settings.MINIO_PRESIGNED_URL_EXPIRE_HOURS)
            )
            return url
        except S3Error as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
            
    def get_object(self, object_name: str) -> bytes:
        """
        Downloads the raw object bytes. Useful if the backend needs to process the image again.
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            return response.read()
        except S3Error as e:
            logger.error(f"Failed to get object from MinIO: {e}")
            raise
        finally:
            if 'response' in locals() and response:
                response.close()
            
    def delete_object(self, object_name: str):
        try:
            self.client.remove_object(self.bucket_name, object_name)
        except S3Error as e:
            logger.error(f"Failed to delete object from MinIO: {e}")

minio_service = MinIOService()
