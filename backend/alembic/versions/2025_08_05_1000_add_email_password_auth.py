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
    """Add email and password_hash columns; make phone_number nullable.

    Uses PostgreSQL native IF NOT EXISTS syntax throughout so this migration
    is fully idempotent and safe to re-run after any previous partial failure.
    No op.get_bind() — works with SQLAlchemy 2.x and Alembic 1.16+.
    """
    # Add email column — PostgreSQL 9.6+ supports ADD COLUMN IF NOT EXISTS
    op.execute(sa.text(
        "ALTER TABLE user_profiles "
        "ADD COLUMN IF NOT EXISTS email VARCHAR"
    ))

    # Add password_hash column
    op.execute(sa.text(
        "ALTER TABLE user_profiles "
        "ADD COLUMN IF NOT EXISTS password_hash VARCHAR"
    ))

    # Make phone_number nullable (safe to run even if already nullable)
    op.execute(sa.text(
        "ALTER TABLE user_profiles "
        "ALTER COLUMN phone_number DROP NOT NULL"
    ))

    # Unique constraint on email — use a unique index (CREATE UNIQUE INDEX IF NOT EXISTS)
    op.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_profile_email "
        "ON user_profiles (email) WHERE email IS NOT NULL"
    ))

    # Regular index for fast email lookups
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS idx_user_profile_email "
        "ON user_profiles (email)"
    ))


def downgrade() -> None:
    """Remove email and password_hash columns; restore phone_number NOT NULL."""
    op.execute(sa.text("DROP INDEX IF EXISTS idx_user_profile_email"))
    op.execute(sa.text("DROP INDEX IF EXISTS uq_user_profile_email"))
    op.execute(sa.text("ALTER TABLE user_profiles DROP COLUMN IF EXISTS email"))
    op.execute(sa.text("ALTER TABLE user_profiles DROP COLUMN IF EXISTS password_hash"))
    # Only safe to restore NOT NULL if all rows have a phone_number value
    op.execute(sa.text(
        "ALTER TABLE user_profiles ALTER COLUMN phone_number SET NOT NULL"
    ))
