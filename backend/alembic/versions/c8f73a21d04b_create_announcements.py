"""Create public announcements."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8f73a21d04b"
down_revision: Union[str, Sequence[str], None] = "a17d4c9e6f31"
branch_labels = None
depends_on = None


announcement_type = sa.Enum(
    "FEATURE_LAUNCH",
    "UPDATE",
    "FIX",
    "ANNOUNCEMENT",
    name="announcement_type",
    native_enum=False,
    create_constraint=True,
)


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("type", announcement_type, nullable=False),
        sa.Column("email_subject", sa.String(length=255), nullable=True),
        sa.Column("cc", sa.JSON(), nullable=False),
        sa.Column("tool_id", sa.Integer(), nullable=True),
        sa.Column("publish_date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=True),
        sa.Column("document_url", sa.String(length=2048), nullable=True),
        sa.Column("posted_by_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["posted_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["deleted_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_announcements_tool_id", "announcements", ["tool_id"])
    op.create_index("ix_announcements_publish_date", "announcements", ["publish_date"])
    op.create_index("ix_announcements_posted_by_id", "announcements", ["posted_by_id"])


def downgrade() -> None:
    op.drop_index("ix_announcements_posted_by_id", table_name="announcements")
    op.drop_index("ix_announcements_publish_date", table_name="announcements")
    op.drop_index("ix_announcements_tool_id", table_name="announcements")
    op.drop_table("announcements")