from uuid import uuid4

from fastapi import HTTPException, UploadFile

from core.config import settings

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".txt",
    ".md",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_DOCUMENT_SIZE = 25 * 1024 * 1024

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".md": "text/markdown",
}


def _bucket():
    if not settings.ANNOUNCEMENT_MEDIA_BUCKET:
        raise HTTPException(status_code=503, detail="Announcement media storage is not configured")
    try:
        from google.cloud import storage

        return storage.Client().bucket(settings.ANNOUNCEMENT_MEDIA_BUCKET)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Google Cloud Storage support is unavailable") from exc


def _validate_file_signature(extension: str, content: bytes) -> None:
    signatures = {
        ".jpg": content.startswith(b"\xff\xd8\xff"),
        ".jpeg": content.startswith(b"\xff\xd8\xff"),
        ".png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        ".webp": len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP",
        ".pdf": content.startswith(b"%PDF-"),
        ".doc": content.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"),
        ".ppt": content.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"),
        ".xls": content.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"),
        ".docx": content.startswith(b"PK\x03\x04"),
        ".pptx": content.startswith(b"PK\x03\x04"),
        ".xlsx": content.startswith(b"PK\x03\x04"),
        ".txt": b"\x00" not in content,
        ".md": b"\x00" not in content,
    }
    if not signatures.get(extension, False):
        raise HTTPException(status_code=400, detail="File content does not match its file type")


async def upload_announcement_file(file: UploadFile, kind: str) -> str:
    extension = (file.filename or "").rsplit(".", 1)
    extension = f".{extension[-1].lower()}" if len(extension) == 2 else ""
    allowed_extensions = IMAGE_EXTENSIONS if kind == "image" else DOCUMENT_EXTENSIONS if kind == "document" else set()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=415, detail="Unsupported announcement attachment type")

    maximum_size = MAX_IMAGE_SIZE if kind == "image" else MAX_DOCUMENT_SIZE
    content = await file.read(maximum_size + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > maximum_size:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the size limit")
    _validate_file_signature(extension, content)

    bucket = _bucket()
    object_name = f"announcements/{kind}/{uuid4().hex}{extension}"
    try:
        bucket.blob(object_name).upload_from_string(
            content,
            content_type=CONTENT_TYPES[extension],
            if_generation_match=0,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not store announcement attachment") from exc
    return f"gs://{bucket.name}/{object_name}"


def parse_announcement_media_ref(media_ref: str) -> str:
    prefix = f"gs://{settings.ANNOUNCEMENT_MEDIA_BUCKET}/announcements/"
    if not settings.ANNOUNCEMENT_MEDIA_BUCKET or not media_ref.startswith(prefix):
        raise HTTPException(status_code=404, detail="Announcement media not found")
    object_name = media_ref.removeprefix(f"gs://{settings.ANNOUNCEMENT_MEDIA_BUCKET}/")
    if ".." in object_name.split("/") or "\\" in object_name:
        raise HTTPException(status_code=404, detail="Announcement media not found")
    return object_name


def announcement_media_url(media_ref: str | None) -> str | None:
    if not media_ref or not media_ref.startswith("gs://"):
        return media_ref
    object_name = parse_announcement_media_ref(media_ref)
    from urllib.parse import quote

    return f"/api/announcements/media/{quote(object_name, safe='/')}"


def download_announcement_file(object_name: str) -> tuple[bytes, str]:
    if not object_name.startswith("announcements/") or ".." in object_name.split("/") or "\\" in object_name:
        raise HTTPException(status_code=404, detail="Announcement media not found")
    blob = _bucket().blob(object_name)
    try:
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Announcement media not found")
        if blob.size and blob.size > MAX_DOCUMENT_SIZE:
            raise HTTPException(status_code=413, detail="Announcement media exceeds the size limit")
        content = blob.download_as_bytes()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not retrieve announcement attachment") from exc
    return content, blob.content_type or "application/octet-stream"