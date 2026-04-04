"""add_email_password_auth

Revision ID: add_email_password_auth
Revises: bf454a893619
Create Date: 2025-08-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_email_password_auth'
down_revision: Union[str, Sequence[str], None] = 'bf454a893619'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add email and password_hash columns; make phone_number nullable."""
    # Add email column (nullable, unique)
    op.add_column(
        'user_profiles',
        sa.Column('email', sa.String(), nullable=True)
    )
    op.create_unique_constraint('uq_user_profile_email', 'user_profiles', ['email'])
    op.create_index('idx_user_profile_email', 'user_profiles', ['email'])

    # Add password_hash column (nullable)
    op.add_column(
        'user_profiles',
        sa.Column('password_hash', sa.String(), nullable=True)
    )

    # Make phone_number nullable (was NOT NULL before)
    op.alter_column(
        'user_profiles',
        'phone_number',
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    """Remove email and password_hash columns; restore phone_number NOT NULL."""
    op.drop_index('idx_user_profile_email', table_name='user_profiles')
    op.drop_constraint('uq_user_profile_email', 'user_profiles', type_='unique')
    op.drop_column('user_profiles', 'email')
    op.drop_column('user_profiles', 'password_hash')

    # Restore phone_number NOT NULL (only safe if all rows have a value)
    op.alter_column(
        'user_profiles',
        'phone_number',
        existing_type=sa.String(),
        nullable=False,
    )
