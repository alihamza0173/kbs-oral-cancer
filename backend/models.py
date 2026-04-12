from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from db import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    stage = Column(String, index=True, nullable=False)
    risk_level = Column(String, nullable=False)
    total_cost = Column(Float, nullable=False)
    three_year_survival = Column(Float, nullable=False)
    five_year_survival = Column(Float, nullable=False)
    input_json = Column(JSON, nullable=False)
    result_json = Column(JSON, nullable=False)

    outcomes = relationship("Outcome", back_populates="patient", cascade="all, delete-orphan")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    time_months = Column(Float, nullable=False)
    event = Column(Integer, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="outcomes")
