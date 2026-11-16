from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import hash_password
from modules.users.models import Tools, User
from shared.constants import ResponseMessageConstants
from shared.enums import RoleType
from shared.utils import generic_json_response
from .schemas import AdminCreatePayload, ToolCreatePayload, UserUpdatePayload


router = APIRouter()
security = HTTPBearer()


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


@router.get("/users")
def list_users(
    search: str = Query(default="", max_length=255),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    filters = []
    search_term = search.strip()
    if search_term:
        pattern = f"%{search_term}%"
        full_name = func.concat(User.first_name, " ", func.coalesce(User.last_name, ""))
        filters.append(or_(
            User.first_name.ilike(pattern),
            User.last_name.ilike(pattern),
            full_name.ilike(pattern),
            User.hs_email_id.ilike(pattern),
        ))

    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    page_size = 100
    users = db.scalars(
        select(User)
        .where(*filters)
        .order_by(User.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return generic_json_response(
        success=True,
        status_code=200,
        message=ResponseMessageConstants.USERS_RETRIEVED,
        data={
            "users": [serialize_user(user) for user in users],
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    )


@router.post("/users/admin")
def create_admin(
    payload: AdminCreatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
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

    return generic_json_response(
        success=True,
        status_code=201,
        message=ResponseMessageConstants.ADMIN_CREATED,
        data=serialize_user(admin),
    )


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
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

    return generic_json_response(
        success=True,
        status_code=200,
        message=ResponseMessageConstants.USER_UPDATED,
        data=serialize_user(user),
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_super_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if user.role == RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin accounts cannot be deleted here")

    db.delete(user)
    db.commit()
    return generic_json_response(
        success=True,
        status_code=200,
        message=ResponseMessageConstants.USER_DELETED,
        data={"id": user_id},
    )


@router.get("/tools")
def list_tools(
    db: Session = Depends(get_db),
):
    tools = db.scalars(select(Tools).order_by(Tools.id)).all()
    return generic_json_response(
        success=True,
        status_code=200,
        message=ResponseMessageConstants.TOOLS_RETRIEVED,
        data={
            "tools": [serialize_tool(tool) for tool in tools],
            "total": len(tools),
        },
    )


@router.post("/tools")
def create_tool(
    payload: ToolCreatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    tool = Tools(**payload.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)

    return generic_json_response(
        success=True,
        status_code=201,
        message=ResponseMessageConstants.TOOL_CREATED,
        data=serialize_tool(tool),
    )
