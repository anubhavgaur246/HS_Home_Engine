from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import hash_password
from modules.data_upload.models import User
from shared.enums import RoleType
from shared.utils import generic_json_response
from .schemas import AdminCreatePayload, LoginPayload, ResetPasswordPayload, UserUpdatePayload
from .services import authenticate, create_access_token, decode_access_token, ensure_super_admin


router = APIRouter()


def require_super_admin(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    claims = decode_access_token(authorization.split(" ", 1)[1])
    if claims.get("reset_password"):
        raise HTTPException(status_code=403, detail="Password reset token cannot manage users")

    try:
        user_id = int(claims.get("sub"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc

    user = db.get(User, user_id)
    if user is None or user.role != RoleType.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "hs_email_id": user.hs_email_id,
        "role": user.role.value,
        "created_at": user.created_at,
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
        message="Users retrieved.",
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
        message="Admin created. They must reset their password at first login.",
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
        message="User updated.",
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
        message="User deleted.",
        data={"id": user_id},
    )


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    try:
        ensure_super_admin(db)
        user = authenticate(db, payload.email, payload.password)

        if user.is_password_reset_required:
            return generic_json_response(
                success=True,
                status_code=200,
                message="Password reset required.",
                data={
                    "requires_password_reset": True,
                    "reset_token": create_access_token(user, reset_password=True),
                    "email": user.hs_email_id,
                    "role": user.role.value,
                },
                error=None,
            )

        return generic_json_response(
            success=True,
            status_code=200,
            message="Login successful.",
            data={
                "access_token": create_access_token(user),
                "email": user.hs_email_id,
                "role": user.role.value,
                "requires_password_reset": False,
            },
            error=None,
        )
    except HTTPException as exc:
        return generic_json_response(
            success=False,
            status_code=exc.status_code,
            message=str(exc.detail),
            data=None,
            error=str(exc.detail),
        )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    try:
        claims = decode_access_token(payload.token)
        if not claims.get("reset_password"):
            raise HTTPException(status_code=401, detail="Invalid reset token")

        user = db.scalar(select(User).where(User.id == int(claims.get("sub"))))
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        user.password = hash_password(payload.new_password)
        user.is_password_reset_required = False
        db.commit()

        return generic_json_response(
            success=True,
            status_code=200,
            message="Password reset successful.",
            data={
                "email": user.hs_email_id,
                "requires_password_reset": False,
            },
            error=None,
        )
    except HTTPException as exc:
        return generic_json_response(
            success=False,
            status_code=exc.status_code,
            message=str(exc.detail),
            data=None,
            error=str(exc.detail),
        )
