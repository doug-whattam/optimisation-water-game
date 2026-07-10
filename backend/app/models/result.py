import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    design_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("network_designs.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    tank_levels: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    hydraulic_penalty: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    individual_penalties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    stopping_tank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sim_duration_seconds: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    inp_file_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    design = relationship("NetworkDesign", back_populates="result")
