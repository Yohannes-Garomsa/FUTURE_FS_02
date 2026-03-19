"""Shared utility functions for the CRM system."""
import uuid
import os
from django.utils import timezone


def generate_uuid():
    """Generate a new UUID4."""
    return uuid.uuid4()


def get_file_upload_path(instance, filename):
    """
    Generate upload path for file attachments.
    Files are organized by date: uploads/YYYY/MM/DD/<uuid>_<filename>
    """
    now = timezone.now()
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    return os.path.join(
        'uploads',
        str(now.year),
        str(now.month).zfill(2),
        str(now.day).zfill(2),
        unique_filename,
    )


# Allowed file extensions and max size for uploads
ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.png', '.jpg', '.jpeg', '.gif',
    '.txt', '.csv',
]
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_file_extension(filename):
    """Validate that the file extension is allowed."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_FILE_EXTENSIONS:
        from rest_framework.exceptions import ValidationError
        raise ValidationError(
            f"File type '{ext}' is not allowed. "
            f"Allowed types: {', '.join(ALLOWED_FILE_EXTENSIONS)}"
        )


def validate_file_size(file):
    """Validate that the file size is within limits."""
    if file.size > MAX_FILE_SIZE_BYTES:
        from rest_framework.exceptions import ValidationError
        raise ValidationError(
            f"File size {file.size / (1024*1024):.1f}MB exceeds "
            f"the maximum allowed size of {MAX_FILE_SIZE_MB}MB."
        )
