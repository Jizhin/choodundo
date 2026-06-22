"""initial reports table

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.has_table(bind, "reports"):
        return
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=10), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("place_name", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=50), nullable=False),
        sa.Column("pincode", sa.String(length=6), nullable=True),
        sa.Column("user_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_district", "reports", ["district"])
    op.create_index("ix_reports_created_at", "reports", ["created_at"])
    op.create_index(
        "ix_reports_district_created_at", "reports", ["district", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_reports_district_created_at", table_name="reports")
    op.drop_index("ix_reports_created_at", table_name="reports")
    op.drop_index("ix_reports_district", table_name="reports")
    op.drop_table("reports")
