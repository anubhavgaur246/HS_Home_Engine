
"""Replace reset_password with is_password_reset_required

Revision ID: f246ec47cf4c
Revises: 210ec312591e
"""

from typing import Sequence, Union

from alembic import op

revision: str = 'f246ec47cf4c'
down_revision: Union[str, Sequence[str], None] = '210ec312591e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        'users',
        'reset_password',
        new_column_name='is_password_reset_required',
    )


def downgrade() -> None:
    op.alter_column(
        'users',
        'is_password_reset_required',
        new_column_name='reset_password',
    )
