"""Add employee profile columns to users

Revision ID: 9d6d5004c8be
Revises: f246ec47cf4c
Create Date: 2026-11-16 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d6d5004c8be"
down_revision: Union[str, Sequence[str], None] = "f246ec47cf4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("level", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("team", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("programme_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("projectname", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("manager", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("lead", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "lead")
    op.drop_column("users", "manager")
    op.drop_column("users", "projectname")
    op.drop_column("users", "programme_name")
    op.drop_column("users", "team")
    op.drop_column("users", "level")
