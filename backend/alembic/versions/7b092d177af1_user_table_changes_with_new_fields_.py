"""user table changes with new fields added syncing teamsphere data

Revision ID: 7b092d177af1
Revises: 9d6d5004c8be
Create Date: 2026-11-16 03:51:00.962267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b092d177af1'
down_revision: Union[str, Sequence[str], None] = '9d6d5004c8be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "from_teamsphere",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
            default=True,
        ),
    )
    op.execute("UPDATE users SET from_teamsphere = true WHERE from_teamsphere IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "from_teamsphere")
