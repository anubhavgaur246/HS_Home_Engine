from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from core.security import hash_password
from modules.users.models import User
from shared.constants import ResponseMessageConstants
from shared.utils import generic_json_response
from .schemas import EmailLinkCompletion, EmailLinkRequest, LoginPayload, ResetPasswordPayload
from .services import (
    authenticate,
    complete_auth_link,
    create_access_token,
    decode_access_token,
    ensure_super_admin,
    request_auth_link,
)


router = APIRouter(prefix="/auth")


def _request_link(payload: EmailLinkRequest, db: Session, purpose: str):
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        return generic_json_response(
            success=False,
            status_code=503,
            message="Email delivery is not configured. Contact your administrator.",
            data=None,
            error="Email delivery is not configured.",
        )

    request_auth_link(db, payload.email, purpose)
    return generic_json_response(
        success=True,
        status_code=200,
        message="If an eligible account exists, a password link has been sent to that email address.",
        data=None,
        error=None,
    )


@router.post("/signup")
def request_account_setup(payload: EmailLinkRequest, db: Session = Depends(get_db)):
    return _request_link(payload, db, "setup")


@router.post("/forgot-password")
def request_password_reset(payload: EmailLinkRequest, db: Session = Depends(get_db)):
    return _request_link(payload, db, "recovery")


@router.post("/complete-password-link")
def complete_password_link(payload: EmailLinkCompletion, db: Session = Depends(get_db)):
    try:
        user = complete_auth_link(db, payload.token, payload.new_password)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.PASSWORD_RESET_SUCCESSFULLY,
            data={"email": user.hs_email_id},
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


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    try:
        ensure_super_admin(db)
        user = authenticate(db, payload.email, payload.password)

        if user.is_password_reset_required:
            setup_link_sent = request_auth_link(db, user.hs_email_id, "setup")
            return generic_json_response(
                success=True,
                status_code=200,
                message=(
                    "A password setup link was sent to your work email."
                    if setup_link_sent
                    else "Your account needs setup, but the email link could not be sent. Contact your administrator."
                ),
                data={
                    "requires_password_reset": True,
                    "setup_link_sent": setup_link_sent,
                    "email": user.hs_email_id,
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
                "ldap": user.ldap,
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
                "ldap": user.ldap,
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
