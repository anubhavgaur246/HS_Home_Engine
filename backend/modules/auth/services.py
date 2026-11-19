from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
from html import escape
import json
import logging
import secrets
from urllib.parse import urlencode

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.security import hash_password, verify_password
from modules.users.models import User
from shared.utils import EmailUtils
from .models import AuthLinkToken
from shared.enums import RoleType

logger = logging.getLogger(__name__)
AUTH_LINK_TTL_HOURS = 1


def _token_part(value: dict) -> str:
    return base64.urlsafe_b64encode(
        json.dumps(value, separators=(",", ":")).encode()
    ).rstrip(b"=").decode()


def create_access_token(user: User, *, reset_password: bool = False) -> str:
    now = datetime.now(timezone.utc)
    expires_in = 15 if reset_password else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    header = _token_part({"alg": "HS256", "typ": "JWT"})
    payload = _token_part({
        "sub": str(user.id),
        "email": user.hs_email_id,
        "ldap": user.ldap,
        "role": user.role.value,
        "level": user.level,
        "team": user.team,
        "programme_name": user.programme_name,
        "projectname": user.projectname,
        "manager": user.manager,
        "lead": user.lead,
        "reset_password": reset_password,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_in)).timestamp()),
    })
    signing_input = f"{header}.{payload}".encode()
    signature = hmac.new(settings.SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    return f"{header}.{payload}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def decode_access_token(token: str) -> dict:
    try:
        header, body, signature = token.split(".")
        header_data = json.loads(base64.urlsafe_b64decode(header + "=" * (-len(header) % 4)))
        if header_data.get("alg") != "HS256":
            raise ValueError("Unsupported token algorithm")
        expected = hmac.new(settings.SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        supplied = base64.urlsafe_b64decode(signature + "=" * (-len(signature) % 4))
        claims = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc
    if not hmac.compare_digest(expected, supplied) or claims.get("exp", 0) <= datetime.now(timezone.utc).timestamp():
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    return claims


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.hs_email_id == email.strip().lower()))
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


def _send_auth_link(email: str, token: str, purpose: str) -> None:
    query = urlencode({"auth_token": token, "auth_action": purpose})
    link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/?{query}"
    action = "set up your account" if purpose == "setup" else "reset your password"
    link_label = "create password" if purpose == "setup" else "reset password"
    EmailUtils.send_email(
        to_email=email,
        subject="Highspring account password link",
        body=(
            f"Click this link to {action}. The link is valid for one hour and can only "
            "be used once. Please request a new link if it expires or has already "
            f"been used:\n\n{link}\n"
        ),
        html_body=(
            f"<p>Click below to {action}. This link is valid for one hour and can "
            "only be used once. Please request a new link if it expires or has "
            "already been used.</p>"
            f'<p><a href="{escape(link, quote=True)}">{link_label}</a></p>'
        ),
    )


def request_auth_link(db: Session, email: str, purpose: str) -> bool:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.hs_email_id == normalized_email))
    if user is None or (purpose == "setup" and not user.is_password_reset_required):
        return False

    raw_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    db.query(AuthLinkToken).filter(
        AuthLinkToken.user_id == user.id,
        AuthLinkToken.purpose == purpose,
        AuthLinkToken.consumed_at.is_(None),
    ).update({AuthLinkToken.consumed_at: now}, synchronize_session=False)
    token_record = AuthLinkToken(
        user_id=user.id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        purpose=purpose,
        expires_at=now + timedelta(hours=AUTH_LINK_TTL_HOURS),
    )
    db.add(token_record)
    db.commit()

    try:
        _send_auth_link(normalized_email, raw_token, purpose)
        return True
    except Exception:
        logger.exception("Unable to send %s link to account", purpose)
        token_record.consumed_at = datetime.now(timezone.utc)
        db.commit()
        return False


def complete_auth_link(db: Session, token: str, new_password: str) -> User:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    token_record = db.scalar(
        select(AuthLinkToken)
        .where(AuthLinkToken.token_hash == token_hash)
        .with_for_update()
    )
    now = datetime.now(timezone.utc)
    if token_record is None or token_record.consumed_at is not None:
        raise HTTPException(status_code=400, detail="Invalid or expired password link")
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise HTTPException(status_code=400, detail="Invalid or expired password link")

    user = db.get(User, token_record.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired password link")
    token_record.consumed_at = now
    user.password = hash_password(new_password)
    user.is_password_reset_required = False
    db.commit()
    return user


def ensure_super_admin(db: Session) -> None:
    email = (settings.SUPER_ADMIN_EMAIL or "").strip().lower()
    password = settings.SUPER_ADMIN_PASSWORD
    if not email or not password:
        return
    user = db.scalar(select(User).where(User.hs_email_id == email))
    if user is None:
        user = User(
            hs_email_id=email,
            google_email=email,
            password=hash_password(password),
            first_name="Super",
            last_name="Admin",
            role=RoleType.SUPER_ADMIN,
            is_password_reset_required=False,
        )
        db.add(user)
    else:
        user.password = hash_password(password)
        user.role = RoleType.SUPER_ADMIN
    db.commit()
