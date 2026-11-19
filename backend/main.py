from fastapi import FastAPI
from sqlalchemy import inspect

from core.database import SessionLocal
from modules.auth.routes import router as auth_router
from modules.auth.services import ensure_super_admin
from modules.announcement.routes import router as announcement_router
from modules.data_upload.routes import router as data_upload_router
from modules.users.routes import router as user_router
from shared.constants import ResponseMessageConstants
from shared.utils import generic_json_response


app = FastAPI()
app.include_router(data_upload_router, tags=["Data upload"])
app.include_router(auth_router, tags=["Authentication"])
app.include_router(user_router, tags=["Users"])
app.include_router(announcement_router, tags=["Announcements"])


@app.on_event("startup")
def bootstrap_super_admin():
    db = SessionLocal()
    try:
        if inspect(db.bind).has_table("users"):
            ensure_super_admin(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return generic_json_response(
        success=True,
        status_code=200,
        message=ResponseMessageConstants.HEALTH_SUCCESS,
        data={"status": "healthy"},
        error=None,
    )
