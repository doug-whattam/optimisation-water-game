import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False
    )
    session_token: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    is_connected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    session = relationship("GameSession", back_populates="players")
    designs = relationship("NetworkDesign", back_populates="player", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("username", "session_id", name="uq_username_session"),
    )
