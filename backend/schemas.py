from datetime import datetime
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field


T_CATEGORIES = Literal["T1", "T2", "T3", "T4a", "T4b"]
N_CATEGORIES = Literal["N0", "N1", "N2a", "N2b", "N2c", "N3a", "N3b"]
M_CATEGORIES = Literal["M0", "M1"]
MARGIN_STATUS = Literal["negative", "close", "positive"]
ENE_STATUS = Literal["absent", "present"]


class PatientInput(BaseModel):
    T: T_CATEGORIES = "T2"
    N: N_CATEGORIES = "N0"
    M: M_CATEGORIES = "M0"
    tumor_size_cm: float = Field(2.5, ge=0, le=20)
    doi_mm: float = Field(5.0, ge=0, le=60)
    margin_status: MARGIN_STATUS = "negative"
    ene: ENE_STATUS = "absent"


class Recommendation(BaseModel):
    type: Literal["critical", "primary", "warning", "info"]
    title: str
    description: str
    evidence: str


class PathwayStep(BaseModel):
    phase: str
    description: str
    status: Literal["completed", "active", "recommended", "conditional", "pending"]


class Alert(BaseModel):
    severity: Literal["high", "medium", "low"]
    message: str


class SurvivalSummary(BaseModel):
    threeYear: float
    fiveYear: float


class SurvivalPoint(BaseModel):
    month: int
    survival: float


class CostItem(BaseModel):
    phase: str
    cost: float
    color: str


class EvaluationResult(BaseModel):
    stage: str
    riskLevel: str
    recommendations: List[Recommendation]
    pathway: List[PathwayStep]
    alerts: List[Alert]
    survival: SurvivalSummary
    survivalCurve: List[SurvivalPoint]
    costData: List[CostItem]
    totalCost: float
    derivedFacts: Dict[str, Any]


class PatientCreate(BaseModel):
    input: PatientInput
    result: EvaluationResult


class PatientRecord(BaseModel):
    id: int
    created_at: datetime
    stage: str
    risk_level: str
    total_cost: float
    three_year_survival: float
    five_year_survival: float
    input: Dict[str, Any]
    result: Dict[str, Any]
    outcomes_count: int

    class Config:
        from_attributes = True


class OutcomeCreate(BaseModel):
    patient_id: int
    time_months: float = Field(..., ge=0, le=240)
    event: Literal[0, 1]


class AuditReport(BaseModel):
    total_cases: int
    stage_distribution: Dict[str, int]
    mean_five_year_survival: Optional[float]
    mean_total_cost: Optional[float]
    outcomes_recorded: int
    last_refit_at: Optional[datetime]
    recent_cases: List[PatientRecord]
