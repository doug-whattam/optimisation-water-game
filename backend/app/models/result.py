import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    design_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("network_designs.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    tank_levels: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    hydraulic_penalty: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    individual_penalties: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    stopping_tank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sim_duration_seconds: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    inp_file_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    design = relationship("NetworkDesign", back_populates="result")

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed')", name="check_sim_status"
        ),
    )
