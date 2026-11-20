from datetime import date, datetime, timezone
import logging

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from modules.auth.services import decode_access_token
from modules.users.models import Tools, User
from shared.enums import RoleType

from .models import Announcement
from .schemas import AnnouncementCreate, AnnouncementUpdate
from .storage import announcement_media_url
from shared.utils import EmailUtils

security = HTTPBearer()
PUBLISHER_ROLES = {RoleType.MANAGER, RoleType.LEAD}
logger = logging.getLogger(__name__)


def _send_announcement_notification(announcement: Announcement, actor: User) -> None:
    recipients = announcement.cc or []
    if not recipients:
        return

    subject = announcement.email_subject or announcement.title
    body = (
        f"{announcement.title}\n\n"
        f"{announcement.summary}\n\n"
        f"{announcement.description}\n\n"
        f"Publish date: {announcement.publish_date.isoformat()}"
    )
    try:
        EmailUtils.send_email(
            to_email=actor.hs_email_id,
            subject=subject,
            body=body,
            cc=recipients,
        )
    except Exception:
        logger.exception(
            "Could not send announcement %s notification to CC recipients",
            announcement.id,
        )


def require_announcement_publisher(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    claims = decode_access_token(credentials.credentials)
    if claims.get("reset_password"):
        raise HTTPException(status_code=403, detail="Password reset token cannot publish announcements")
    try:
        user_id = int(claims.get("sub"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc

    user = db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise HTTPException(status_code=401, detail="User account is unavailable")
    if user.role not in PUBLISHER_ROLES:
        raise HTTPException(status_code=403, detail="Manager or lead access required")
    return user


def _validate_tool(db: Session, tool_id: int | None) -> None:
    if tool_id is not None and db.get(Tools, tool_id) is None:
        raise HTTPException(status_code=404, detail="Tool not found")


def _announcement_query():
    return select(Announcement).options(
        joinedload(Announcement.tool),
        joinedload(Announcement.posted_by),
    )


def serialize_announcement(announcement: Announcement, *, include_private: bool = False) -> dict:
    poster = announcement.posted_by
    tool = announcement.tool
    data = {
        "id": announcement.id,
        "type": announcement.type.value,
        "email_subject": announcement.email_subject,
        "tool": {"id": tool.id, "name": tool.name} if tool else None,
        "publish_date": announcement.publish_date,
        "title": announcement.title,
        "summary": announcement.summary,
        "description": announcement.description,
        "image_url": announcement_media_url(announcement.image_url),
        "document_url": announcement_media_url(announcement.document_url),
        "posted_by": {
            "id": poster.id,
            "name": " ".join(part for part in (poster.first_name, poster.last_name) if part),
        },
        "created_at": announcement.created_at,
        "updated_at": announcement.updated_at,
    }
    if include_private:
        data["cc"] = announcement.cc
    return data


def list_public_announcements(
    db: Session,
    *,
    offset: int,
    limit: int,
    tool_id: int | None = None,
):
    filters = [
        Announcement.deleted_at.is_(None),
        Announcement.publish_date <= date.today(),
    ]
    if tool_id is not None:
        filters.append(Announcement.tool_id == tool_id)

    total = db.scalar(select(func.count()).select_from(Announcement).where(*filters)) or 0
    announcements = db.scalars(
        _announcement_query()
        .where(*filters)
        .order_by(Announcement.publish_date.desc(), Announcement.id.desc())
        .offset(offset)
        .limit(limit)
    ).unique().all()
    return {
        "announcements": [serialize_announcement(item) for item in announcements],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


def get_public_announcement(db: Session, announcement_id: int):
    announcement = db.scalar(
        _announcement_query().where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None),
            Announcement.publish_date <= date.today(),
        )
    )
    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return serialize_announcement(announcement)


def create_announcement(db: Session, payload: AnnouncementCreate, actor: User):
    _validate_tool(db, payload.tool_id)
    announcement = Announcement(
        **payload.model_dump(),
        posted_by_id=actor.id,
    )
    db.add(announcement)
    db.commit()
    _send_announcement_notification(announcement, actor)
    return get_announcement_for_publisher(db, announcement.id)


def _get_active_announcement(db: Session, announcement_id: int) -> Announcement:
    announcement = db.scalar(
        _announcement_query().where(
            Announcement.id == announcement_id,
            Announcement.deleted_at.is_(None),
        )
    )
    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement


def _require_owner(announcement: Announcement, actor: User) -> None:
    if announcement.posted_by_id != actor.id:
        raise HTTPException(status_code=403, detail="Only the original poster can change this announcement")


def get_announcement_for_publisher(db: Session, announcement_id: int):
    return serialize_announcement(
        _get_active_announcement(db, announcement_id),
        include_private=True,
    )


def get_announcement_for_editor(db: Session, announcement_id: int, actor: User):
    announcement = _get_active_announcement(db, announcement_id)
    _require_owner(announcement, actor)
    return serialize_announcement(announcement, include_private=True)


def update_announcement(
    db: Session,
    announcement_id: int,
    payload: AnnouncementUpdate,
    actor: User,
):
    announcement = _get_active_announcement(db, announcement_id)
    _require_owner(announcement, actor)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Provide at least one field to update")
    required_fields = {"type", "cc", "publish_date", "title", "summary", "description"}
    if any(field in changes and changes[field] is None for field in required_fields):
        raise HTTPException(status_code=422, detail="Required announcement fields cannot be null")
    if "tool_id" in changes:
        _validate_tool(db, changes["tool_id"])
    for field, value in changes.items():
        setattr(announcement, field, value)
    db.commit()
    _send_announcement_notification(announcement, actor)
    return get_announcement_for_publisher(db, announcement_id)


def delete_announcement(db: Session, announcement_id: int, actor: User):
    announcement = _get_active_announcement(db, announcement_id)
    _require_owner(announcement, actor)
    announcement.deleted_at = datetime.now(timezone.utc)
    announcement.deleted_by_id = actor.id
    db.commit()
    return {"id": announcement.id, "deleted": True}