from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import json

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.security import hash_password, verify_password
from modules.data_upload.models import User
from shared.enums import RoleType


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
        "role": user.role.value,
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
