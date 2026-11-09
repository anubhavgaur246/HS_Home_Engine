from fastapi import FastAPI
from sqlalchemy import inspect

from core.database import SessionLocal
from modules.auth.routes import router as auth_router
from modules.auth.services import ensure_super_admin
from modules.data_upload.routes import router as data_upload_router
from shared.utils import generic_json_response


app = FastAPI()
app.include_router(data_upload_router, prefix="/data-upload", tags=["Data upload"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])


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
        message="Success",
        data={"status": "healthy"},
        error=None,
    )
