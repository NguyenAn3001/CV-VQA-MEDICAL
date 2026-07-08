"""add is_pinned to chat_sessions

Revision ID: 8b469f808fd1
Revises: 1e451916435f
Create Date: 2026-07-08 11:27:16.501012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b469f808fd1'
down_revision: Union[str, Sequence[str], None] = '1e451916435f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('chat_sessions', sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chat_sessions', 'is_pinned')
