from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from modules.users.models import User
from shared.constants import ResponseMessageConstants
from shared.utils import generic_json_response
from .schemas import AdminCreatePayload, ToolCreatePayload, UserUpdatePayload
from .services import (
    create_admin_service,
    create_tool_service,
    delete_user_service,
    list_tools_service,
    list_users_service,
    require_super_admin,
    update_user_service,
)


router = APIRouter()


@router.get("/users")
def list_users(
    search: str = Query(default="", max_length=255),
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    try:
        data = list_users_service(db, search, page)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.USERS_RETRIEVED,
            data=data,
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


@router.post("/users/admin")
def create_admin(
    payload: AdminCreatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    try:
        data = create_admin_service(db, payload)
        return generic_json_response(
            success=True,
            status_code=201,
            message=ResponseMessageConstants.ADMIN_CREATED,
            data=data,
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


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    try:
        data = update_user_service(db, user_id, payload)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.USER_UPDATED,
            data=data,
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


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_super_admin),
):
    try:
        data = delete_user_service(db, user_id, actor.id)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.USER_DELETED,
            data=data,
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


@router.get("/tools")
def list_tools(
    db: Session = Depends(get_db),
):
    try:
        data = list_tools_service(db)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.TOOLS_RETRIEVED,
            data=data,
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


@router.post("/tools")
def create_tool(
    payload: ToolCreatePayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    try:
        data = create_tool_service(db, payload)
        return generic_json_response(
            success=True,
            status_code=201,
            message=ResponseMessageConstants.TOOL_CREATED,
            data=data,
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
