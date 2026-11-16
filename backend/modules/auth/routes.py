from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import hash_password
from modules.users.models import User
from shared.constants import ResponseMessageConstants
from shared.utils import generic_json_response
from .schemas import LoginPayload, ResetPasswordPayload
from .services import authenticate, create_access_token, decode_access_token, ensure_super_admin


router = APIRouter(prefix="/auth")


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    try:
        ensure_super_admin(db)
        user = authenticate(db, payload.email, payload.password)

        if user.is_password_reset_required:
            return generic_json_response(
                success=True,
                status_code=200,
                message=ResponseMessageConstants.PASSWORD_RESET_REQUIRED,
                data={
                    "requires_password_reset": True,
                    "reset_token": create_access_token(user, reset_password=True),
                    "email": user.hs_email_id,
                    "role": user.role.value,
                    "level": user.level,
                    "team": user.team,
                    "programme_name": user.programme_name,
                    "projectname": user.projectname,
                    "manager": user.manager,
                    "lead": user.lead,
                },
                error=None,
            )

        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.LOGIN_SUCCESSFULL,
            data={
                "access_token": create_access_token(user),
                "email": user.hs_email_id,
                "role": user.role.value,
                "level": user.level,
                "team": user.team,
                "programme_name": user.programme_name,
                "projectname": user.projectname,
                "manager": user.manager,
                "lead": user.lead,
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
            message=ResponseMessageConstants.PASSWORD_RESET_SUCCESSFULLY,
            data={
                "email": user.hs_email_id,
                "role": user.role.value,
                "level": user.level,
                "team": user.team,
                "programme_name": user.programme_name,
                "projectname": user.projectname,
                "manager": user.manager,
                "lead": user.lead,
                "requires_password_reset": False,
            },
            error=None,
        )
    except HTTPException as exc:
        return generic_json_response(
            success=False,
            status_code=exc.status_code,
            message=ResponseMessageConstants.INTERNAL_SERVER_ERROR,
            data=None,
            error=str(exc.detail),
        )
