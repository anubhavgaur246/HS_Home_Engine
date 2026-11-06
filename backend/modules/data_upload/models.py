
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum,
    func
)
from core.database import Base
from shared.enums import RoleType


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    hs_email_id = Column(String(255), unique=True, nullable=False, index=True)
    google_email = Column(String(255), unique=True, nullable=True)
    ldap = Column(String(100), unique=True, nullable=True)

    password = Column(String(255), nullable=False)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)

    role = Column(
        Enum(RoleType, name="role_type"),
        nullable=False,
        default=RoleType.USER
    )

    reset_password = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
