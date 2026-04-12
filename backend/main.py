from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from audit import build_audit
from db import Base, engine, get_db
from engine.forward_chaining import ForwardChainer
from engine.rules import all_rules
from models import Outcome, Patient
from schemas import (
    AuditReport,
    EvaluationResult,
    OutcomeCreate,
    PatientCreate,
    PatientInput,
    PatientRecord,
)
from survival import SurvivalModel, hazard_ratio

BASE_DIR = Path(__file__).resolve().parent
SEED_CSV = BASE_DIR / "data" / "oral_cancer_seed.csv"

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Oral Cancer KBS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chainer = ForwardChainer(all_rules())
survival_model = SurvivalModel(SEED_CSV)


def _run_evaluation(patient: PatientInput) -> EvaluationResult:
    initial_facts = {
        "T": patient.T,
        "N": patient.N,
        "M": patient.M,
        "tumor_size_cm": patient.tumor_size_cm,
        "doi_mm": patient.doi_mm,
        "margin_status": patient.margin_status,
        "ene": patient.ene,
    }
    facts = chainer.run(initial_facts)

    stage = facts["stage"]
    hr = hazard_ratio(facts)
    surv = survival_model.curve(stage, hazard_ratio=hr)

    derived = {
        "stage": stage,
        "rules_fired": facts.get("_fired", []),
        "hazard_ratio": round(hr, 3),
        "elective_nd": bool(facts.get("elective_nd")),
        "adjuvant_crt": bool(facts.get("adjuvant_crt")),
        "adjuvant_rt": bool(facts.get("adjuvant_rt")),
        "primary_treatment": facts.get("primary_treatment"),
    }

    return EvaluationResult(
        stage=stage,
        riskLevel=facts.get("risk_level", "Standard"),
        recommendations=facts.get("recommendations", []),
        pathway=facts.get("pathway", []),
        alerts=facts.get("alerts", []),
        survival={"threeYear": surv["threeYear"], "fiveYear": surv["fiveYear"]},
        survivalCurve=surv["curve"],
        costData=facts.get("cost_data", []),
        totalCost=facts.get("total_cost", 0),
        derivedFacts=derived,
    )


@app.get("/healthz")
def healthz():
    return {"status": "ok", "stages_fit": sorted(survival_model.fitters.keys())}


@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate(patient: PatientInput):
    return _run_evaluation(patient)


@app.post("/api/patients", response_model=PatientRecord)
def save_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    record = Patient(
        stage=payload.result.stage,
        risk_level=payload.result.riskLevel,
        total_cost=payload.result.totalCost,
        three_year_survival=payload.result.survival.threeYear,
        five_year_survival=payload.result.survival.fiveYear,
        input_json=payload.input.model_dump(),
        result_json=payload.result.model_dump(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize(record)


@app.get("/api/patients", response_model=List[PatientRecord])
def list_patients(db: Session = Depends(get_db)):
    rows = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return [_serialize(r) for r in rows]


@app.get("/api/audit", response_model=AuditReport)
def audit(db: Session = Depends(get_db)):
    return build_audit(db, survival_model.last_refit_at)


@app.post("/api/outcomes")
def add_outcome(payload: OutcomeCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    outcome = Outcome(
        patient_id=payload.patient_id,
        time_months=payload.time_months,
        event=payload.event,
    )
    db.add(outcome)
    db.commit()

    survival_model.append_outcome(patient.stage, payload.time_months, payload.event)

    return {
        "status": "ok",
        "refit_at": survival_model.last_refit_at.isoformat(),
        "outcome_id": outcome.id,
    }


def _serialize(p: Patient) -> dict:
    return {
        "id": p.id,
        "created_at": p.created_at,
        "stage": p.stage,
        "risk_level": p.risk_level,
        "total_cost": p.total_cost,
        "three_year_survival": p.three_year_survival,
        "five_year_survival": p.five_year_survival,
        "input": p.input_json,
        "result": p.result_json,
        "outcomes_count": len(p.outcomes),
    }
