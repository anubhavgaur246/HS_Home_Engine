import math

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.security import hash_password
from modules.users.models import Tools, User
from shared.enums import RoleType
from .schemas import (
    AdminCreatePayload,
    HomeUserCreatePayload,
    ToolCreatePayload,
    ToolUpdatePayload,
    UserUpdatePayload,
)

security = HTTPBearer()
USER_PAGE_SIZE = 20
TEMPORARY_PASSWORD = "temporary_password"


def require_super_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    token = credentials.credentials
    from modules.auth.services import decode_access_token

    claims = decode_access_token(token)
    if claims.get("reset_password"):
        raise HTTPException(status_code=403, detail="Password reset token cannot manage users")

    role = claims.get("role")
    if role != RoleType.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Super admin access required")

    try:
        user_id = int(claims.get("sub"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc

    return User(id=user_id, role=RoleType.SUPER_ADMIN)


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "hs_email_id": user.hs_email_id,
        "role": user.role.value,
        "level": user.level,
        "team": user.team,
        "programme_name": user.programme_name,
        "projectname": user.projectname,
        "manager": user.manager,
        "lead": user.lead,
        "from_teamsphere": bool(user.from_teamsphere),
        "status": "Inactive" if user.deleted_at else "Active",
        "created_at": user.created_at,
    }


def serialize_tool(tool: Tools) -> dict:
    return {
        "id": tool.id,
        "name": tool.name,
        "link": tool.link,
        "video_url": tool.video_url,
        "user_guide_url": tool.user_guide_url,
        "poc_id": tool.poc_id,
        "description": tool.description,
        "is_product_live": tool.is_product_live,
        "is_upcoming": tool.is_upcoming,
    }


def _user_search_filters(search: str):
    search_term = search.strip()
    if not search_term:
        return []

    pattern = f"%{search_term}%"
    full_name = func.concat(User.first_name, " ", func.coalesce(User.last_name, ""))
    return [
        or_(
            User.first_name.ilike(pattern),
            User.last_name.ilike(pattern),
            full_name.ilike(pattern),
            User.hs_email_id.ilike(pattern),
        )
    ]


def list_users_service(db: Session, search: str, page: int):
    filters = _user_search_filters(search)

    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    users = db.scalars(
        select(User)
        .where(*filters)
        .order_by(User.id)
        .offset((page - 1) * USER_PAGE_SIZE)
        .limit(USER_PAGE_SIZE)
    ).all()
    return {
        "users": [serialize_user(user) for user in users],
        "total": total,
        "page": page,
        "page_size": USER_PAGE_SIZE,
    }


def list_teamsphere_users_service(db: Session, search: str, page: int):
    filters = [User.from_teamsphere.is_(True), *_user_search_filters(search)]

    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    users = db.scalars(
        select(User)
        .where(*filters)
        .order_by(User.id)
        .offset((page - 1) * USER_PAGE_SIZE)
        .limit(USER_PAGE_SIZE)
    ).all()
    return {
        "users": [serialize_user(user) for user in users],
        "total": total,
        "page": page,
        "page_size": USER_PAGE_SIZE,
        "total_pages": max(1, math.ceil(total / USER_PAGE_SIZE)),
    }


def list_non_teamsphere_users_service(db: Session):
    users = db.scalars(
        select(User)
        .where(User.from_teamsphere.is_(False))
        .order_by(User.id)
    ).all()
    return {
        "users": [serialize_user(user) for user in users],
        "total": len(users),
    }


def create_home_user_service(db: Session, payload: HomeUserCreatePayload):
    if payload.role == RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot assign the super admin role")
    if db.scalar(select(User.id).where(User.hs_email_id == payload.email)):
        raise HTTPException(status_code=409, detail="A user with that email already exists")

    user = User(
        hs_email_id=payload.email,
        password=hash_password(TEMPORARY_PASSWORD),
        first_name=payload.email.split("@", 1)[0][:100] or "User",
        role=payload.role,
        from_teamsphere=False,
        is_password_reset_required=True,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A user with that email already exists") from exc

    return serialize_user(user)


def create_admin_service(db: Session, payload: AdminCreatePayload):
    admin = User(
        hs_email_id=payload.hs_email_id,
        password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name or None,
        role=RoleType.ADMIN,
        is_password_reset_required=True,
    )
    db.add(admin)
    try:
        db.commit()
        db.refresh(admin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A user with that email already exists") from exc

    return serialize_user(admin)


def update_user_service(db: Session, user_id: int, payload: UserUpdatePayload):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin accounts cannot be edited here")

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("role") == RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot assign the super admin role")

    for field, value in changes.items():
        setattr(user, field, value)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A user with that email already exists") from exc

    return serialize_user(user)


def delete_user_service(db: Session, user_id: int, actor_id: int):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == actor_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if user.role == RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin accounts cannot be deleted here")

    db.delete(user)
    db.commit()
    return {"id": user_id}


def list_tools_service(db: Session):
    tools = db.scalars(select(Tools).order_by(Tools.id)).all()
    return {
        "tools": [serialize_tool(tool) for tool in tools],
        "total": len(tools),
    }


def update_tool_service(db: Session, tool_id: int, payload: ToolUpdatePayload):
    tool = db.get(Tools, tool_id)
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tool, field, value)

    db.commit()
    db.refresh(tool)
    return serialize_tool(tool)


def replace_tool_service(db: Session, tool_id: int, payload: ToolCreatePayload):
    tool = db.get(Tools, tool_id)
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")

    for field, value in payload.model_dump().items():
        setattr(tool, field, value)

    db.commit()
    db.refresh(tool)
    return serialize_tool(tool)


def create_tool_service(db: Session, payload: ToolCreatePayload):
    tool = Tools(**payload.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)

    return serialize_tool(tool)
