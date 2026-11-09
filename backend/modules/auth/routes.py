from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from .schemas import LoginPayload, LoginResult
from .services import authenticate, create_access_token, ensure_super_admin


router = APIRouter()


@router.post("/login", response_model=LoginResult)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    ensure_super_admin(db)
    user = authenticate(db, payload.email, payload.password)
    return LoginResult(
        access_token=create_access_token(user),
        email=user.hs_email_id,
        role=user.role,
    )
