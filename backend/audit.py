from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Outcome, Patient


def build_audit(db: Session, last_refit_at: Optional[datetime]) -> Dict[str, Any]:
    total = db.query(func.count(Patient.id)).scalar() or 0
    dist_rows = db.query(Patient.stage, func.count(Patient.id)).group_by(Patient.stage).all()
    stage_distribution = {stage: int(n) for stage, n in dist_rows}
    mean_five = db.query(func.avg(Patient.five_year_survival)).scalar()
    mean_cost = db.query(func.avg(Patient.total_cost)).scalar()
    outcomes_recorded = db.query(func.count(Outcome.id)).scalar() or 0
    recent = (
        db.query(Patient)
        .order_by(Patient.created_at.desc())
        .limit(25)
        .all()
    )
    return {
        "total_cases": int(total),
        "stage_distribution": stage_distribution,
        "mean_five_year_survival": round(float(mean_five), 3) if mean_five is not None else None,
        "mean_total_cost": round(float(mean_cost), 2) if mean_cost is not None else None,
        "outcomes_recorded": int(outcomes_recorded),
        "last_refit_at": last_refit_at,
        "recent_cases": [_serialize_patient(p) for p in recent],
    }


def _serialize_patient(p: Patient) -> Dict[str, Any]:
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
