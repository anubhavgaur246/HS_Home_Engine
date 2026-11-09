
"""Replace reset_password with is_password_reset_required

Revision ID: f246ec47cf4c
Revises: 210ec312591e
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'f246ec47cf4c'
down_revision: Union[str, Sequence[str], None] = '210ec312591e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove old column if it exists.
    op.drop_column('users', 'reset_password')

    # Add the new column with TRUE for all existing and future users.
    op.add_column(
        'users',
        sa.Column(
            'is_password_reset_required',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        )
    )

    op.alter_column(
        'users',
        'first_name',
        existing_type=sa.VARCHAR(length=100),
        nullable=False
    )

    op.alter_column(
        'users',
        'created_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        existing_server_default=sa.text('CURRENT_TIMESTAMP')
    )

    op.alter_column(
        'users',
        'updated_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        existing_server_default=sa.text('CURRENT_TIMESTAMP')
    )

    op.alter_column(
        'users',
        'deleted_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True
    )

    op.drop_constraint(
        op.f('users_hs_email_id_key'),
        'users',
        type_='unique'
    )

    op.create_index(
        op.f('ix_users_hs_email_id'),
        'users',
        ['hs_email_id'],
        unique=True
    )

    op.create_index(
        op.f('ix_users_id'),
        'users',
        ['id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_users_id'), table_name='users')

    op.drop_index(
        op.f('ix_users_hs_email_id'),
        table_name='users'
    )

    op.create_unique_constraint(
        op.f('users_hs_email_id_key'),
        'users',
        ['hs_email_id']
    )

    op.alter_column(
        'users',
        'deleted_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True
    )

    op.alter_column(
        'users',
        'updated_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True,
        existing_server_default=sa.text('CURRENT_TIMESTAMP')
    )

    op.alter_column(
        'users',
        'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True,
        existing_server_default=sa.text('CURRENT_TIMESTAMP')
    )

    op.alter_column(
        'users',
        'first_name',
        existing_type=sa.VARCHAR(length=100),
        nullable=True
    )

    op.drop_column('users', 'is_password_reset_required')

    # Restore old column with its original default.
    op.add_column(
        'users',
        sa.Column(
            'reset_password',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )
