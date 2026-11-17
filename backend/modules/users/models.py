from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY

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

    level = Column(String(100), nullable=True)
    team = Column(String(255), nullable=True)
    programme_name = Column(String(255), nullable=True)
    projectname = Column(String(255), nullable=True)
    manager = Column(String(100), nullable=True)
    lead = Column(String(100), nullable=True)
    from_teamsphere = Column(Boolean, nullable=False, default=True, server_default="true")

    role = Column(
        Enum(RoleType, name="role_type"),
        nullable=False,
        default=RoleType.USER,
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
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class Bugs(Base):
    __tablename__ = "Bugs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requestor_email = Column(String(255), nullable=True)
    subject = Column(Text, nullable=True)
    issue_details = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime, nullable=True)


class DemoQueries(Base):
    __tablename__ = "DemoQueries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requestor_name = Column(String(255), nullable=True)
    email_id = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    demo_request_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime, nullable=True)


class EmailQueries(Base):
    __tablename__ = "EmailQueries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    send_by = Column(String(255), nullable=True)
    sent_to = Column(String(255), nullable=True)
    cc = Column(String(255), nullable=True)
    bcc = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)
    deleted_at = Column(DateTime, nullable=True)


class AccessControl(Base):
    __tablename__ = "access_control"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(100), nullable=True)
    ldap = Column(String(255), nullable=True)
    hs_email = Column(String(255), nullable=True)
    access_list = Column(ARRAY(String), nullable=True)


class Tools(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    link = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    user_guide_url = Column(String(255), nullable=True)
    poc_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    is_product_live = Column(Boolean, nullable=True, default=False)
    is_upcoming = Column(Boolean, nullable=True, default=False)


__all__ = [
    "User",
    "Bugs",
    "DemoQueries",
    "EmailQueries",
    "AccessControl",
    "Tools",
]
