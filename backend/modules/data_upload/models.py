
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

    is_password_reset_required = Column(Boolean, nullable=False, default=True)

    @property
    def is_reset_password_required(self):
        return self.is_password_reset_required

    @is_reset_password_required.setter
    def is_reset_password_required(self, value):
        self.is_password_reset_required = value

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
