from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from core.database import Base
from shared.enums import AnnouncementType


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(
        Enum(
            AnnouncementType,
            name="announcement_type",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
    )
    email_subject = Column(String(255), nullable=True)
    cc = Column(JSON, nullable=False, default=list)
    tool_id = Column(Integer, ForeignKey("tools.id", ondelete="SET NULL"), nullable=True, index=True)
    publish_date = Column(Date, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(2048), nullable=True)
    document_url = Column(String(2048), nullable=True)
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    tool = relationship("Tools")
    posted_by = relationship("User", foreign_keys=[posted_by_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])