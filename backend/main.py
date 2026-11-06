from fastapi import FastAPI

from modules.data_upload.routes import router as data_upload_router


app = FastAPI()
app.include_router(data_upload_router, prefix="/data-upload", tags=["Data upload"])


@app.get("/health")
def health():
    return {"message": "Success"}
