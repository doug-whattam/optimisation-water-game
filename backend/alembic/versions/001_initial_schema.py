"""Initial schema

Revision ID: 001
Revises: None
Create Date: 2026-06-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'game_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('max_players', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('status', sa.String(20), nullable=False, server_default='lobby'),
        sa.Column('grid_config', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.CheckConstraint('max_players BETWEEN 2 AND 50', name='check_max_players'),
        sa.CheckConstraint("status IN ('lobby', 'active', 'completed')", name='check_status'),
    )

    op.create_table(
        'players',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('game_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_token', sa.String(128), nullable=False, unique=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('is_connected', sa.Boolean(), nullable=False, server_default='true'),
        sa.UniqueConstraint('username', 'session_id', name='uq_username_session'),
    )

    op.create_table(
        'network_designs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('player_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('players.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('game_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan_number', sa.Integer(), nullable=False),
        sa.Column('grid_state', postgresql.JSONB(), nullable=False),
        sa.Column('total_cost', sa.Integer(), nullable=False),
        sa.Column('asset_cost', sa.Integer(), nullable=False),
        sa.Column('installation_cost', sa.Integer(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('player_id', 'session_id', 'plan_number', name='uq_player_session_plan'),
    )

    op.create_table(
        'simulation_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('design_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('network_designs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('tank_levels', postgresql.JSONB(), nullable=True),
        sa.Column('hydraulic_penalty', sa.Numeric(10, 4), nullable=True),
        sa.Column('individual_penalties', postgresql.JSONB(), nullable=True),
        sa.Column('stopping_tank', sa.String(50), nullable=True),
        sa.Column('sim_duration_seconds', sa.Numeric(10, 2), nullable=True),
        sa.Column('inp_file_content', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.CheckConstraint("status IN ('pending', 'running', 'completed', 'failed')", name='check_sim_status'),
    )


def downgrade() -> None:
    op.drop_table('simulation_results')
    op.drop_table('network_designs')
    op.drop_table('players')
    op.drop_table('game_sessions')
