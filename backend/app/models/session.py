import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="lobby")
    grid_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    players = relationship("Player", back_populates="session", lazy="selectin")
    designs = relationship("NetworkDesign", back_populates="session", lazy="selectin")

    __table_args__ = (
        CheckConstraint("max_players BETWEEN 2 AND 50", name="check_max_players"),
        CheckConstraint("status IN ('lobby', 'active', 'completed')", name="check_status"),
    )
