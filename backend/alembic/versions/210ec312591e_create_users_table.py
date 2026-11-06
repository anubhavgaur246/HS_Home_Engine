"""create users table

Revision ID: 210ec312591e
Revises:
Create Date: 2026-11-05 08:27:58.425001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "210ec312591e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("hs_email_id", sa.String(length=255), nullable=False),
        sa.Column("google_email", sa.String(length=255), nullable=True),
        sa.Column("ldap", sa.String(length=100), nullable=True),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "USER",
                "ADMIN",
                "SUPER_ADMIN",
                "LEAD",
                "MANAGER",
                "HR",
                "TA",
                "CO_LEAD",
                name="role_type",
            ),
            nullable=False,
        ),
        sa.Column("reset_password", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("google_email"),
        sa.UniqueConstraint("ldap"),
    )
    op.create_index(
        op.f("ix_users_hs_email_id"),
        "users",
        ["hs_email_id"],
        unique=True,
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_hs_email_id"), table_name="users")
    op.drop_table("users")
    if op.get_bind().dialect.name == "postgresql":
        sa.Enum(name="role_type").drop(op.get_bind(), checkfirst=True)
