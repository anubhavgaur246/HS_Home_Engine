from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from sqlalchemy.orm import Session

from core.database import get_db
from shared.utils import generic_json_response

from .schemas import AnnouncementCreate, AnnouncementUpdate
from .services import (
    create_announcement,
    delete_announcement,
    get_announcement_for_editor,
    get_public_announcement,
    list_public_announcements,
    require_announcement_publisher,
    update_announcement,
)
from .storage import download_announcement_file, upload_announcement_file
from modules.users.models import User


router = APIRouter(prefix="/announcements")


@router.get("")
def list_announcements(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    tool_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    data = list_public_announcements(db, offset=offset, limit=limit, tool_id=tool_id)
    return generic_json_response(True, 200, "Announcements retrieved", data, None)


@router.post("/media", status_code=201)
async def upload_announcement_media(
    file: UploadFile = File(...),
    kind: str = Form(...),
    actor: User = Depends(require_announcement_publisher),
):
    media_ref = await upload_announcement_file(file, kind)
    return generic_json_response(
        True,
        201,
        "Announcement attachment uploaded",
        {"object_ref": media_ref},
        None,
    )


@router.get("/media/{object_name:path}")
def get_announcement_media(object_name: str):
    content, content_type = download_announcement_file(object_name)
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=300",
            "Content-Disposition": "inline",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/{announcement_id}")
def get_announcement(announcement_id: int, db: Session = Depends(get_db)):
    data = get_public_announcement(db, announcement_id)
    return generic_json_response(True, 200, "Announcement retrieved", data, None)


@router.get("/{announcement_id}/manage")
def get_announcement_for_edit(
    announcement_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_announcement_publisher),
):
    data = get_announcement_for_editor(db, announcement_id, actor)
    return generic_json_response(True, 200, "Announcement retrieved", data, None)


@router.post("", status_code=201)
def post_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_announcement_publisher),
):
    data = create_announcement(db, payload, actor)
    return generic_json_response(True, 201, "Announcement created", data, None)


@router.patch("/{announcement_id}")
def patch_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_announcement_publisher),
):
    data = update_announcement(db, announcement_id, payload, actor)
    return generic_json_response(True, 200, "Announcement updated", data, None)


@router.delete("/{announcement_id}")
def remove_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_announcement_publisher),
):
    data = delete_announcement(db, announcement_id, actor)
    return generic_json_response(True, 200, "Announcement deleted", data, None)