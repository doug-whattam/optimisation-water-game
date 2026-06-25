import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NetworkDesign(Base):
    __tablename__ = "network_designs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False
    )
    plan_number: Mapped[int] = mapped_column(Integer, nullable=False)
    grid_state: Mapped[dict] = mapped_column(JSONB, nullable=False)
    total_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    asset_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    installation_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    player = relationship("Player", back_populates="designs")
    session = relationship("GameSession", back_populates="designs")
    result = relationship("SimulationResult", back_populates="design", uselist=False, lazy="selectin")

    __table_args__ = (
        UniqueConstraint("player_id", "session_id", "plan_number", name="uq_player_session_plan"),
    )
