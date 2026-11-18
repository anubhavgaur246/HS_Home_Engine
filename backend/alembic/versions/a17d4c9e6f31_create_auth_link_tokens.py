"""Create single-use auth link tokens.

Revision ID: a17d4c9e6f31
Revises: baa691bc3bac
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a17d4c9e6f31"
down_revision: Union[str, Sequence[str], None] = "baa691bc3bac"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_link_tokens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_link_tokens_user_id", "auth_link_tokens", ["user_id"])
    op.create_index("ix_auth_link_tokens_token_hash", "auth_link_tokens", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_auth_link_tokens_token_hash", table_name="auth_link_tokens")
    op.drop_index("ix_auth_link_tokens_user_id", table_name="auth_link_tokens")
    op.drop_table("auth_link_tokens")