"""Kaplan-Meier survival model fit from the seed CSV.

On startup we fit one KaplanMeierFitter per TNM stage. When outcomes arrive
via /api/outcomes, rows are appended to the CSV and `refit()` is called —
this is the 'continuous learning loop'. Patient-specific modifiers (margins,
ENE, DOI) are applied as a proportional-hazard scalar on the baseline curve.
"""
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from lifelines import KaplanMeierFitter

from data.seed_generator import generate as generate_seed


class SurvivalModel:
    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self.fitters: Dict[str, KaplanMeierFitter] = {}
        self.last_refit_at: Optional[datetime] = None
        self._ensure_csv()
        self._fit()

    def _ensure_csv(self) -> None:
        if not self.csv_path.exists():
            generate_seed(self.csv_path)

    def _fit(self) -> None:
        df = pd.read_csv(self.csv_path)
        self.fitters = {}
        for stage, group in df.groupby("stage"):
            if len(group) < 2:
                continue
            kmf = KaplanMeierFitter()
            kmf.fit(group["time_months"], group["event"], label=stage)
            self.fitters[stage] = kmf
        self.last_refit_at = datetime.utcnow()

    def refit(self) -> None:
        self._fit()

    def append_outcome(self, stage: str, time_months: float, event: int) -> None:
        with self.csv_path.open("a") as f:
            f.write(f"{stage},{time_months},{event}\n")
        self.refit()

    def curve(self, stage: str, hazard_ratio: float = 1.0) -> Dict[str, Any]:
        kmf = self.fitters.get(stage) or next(iter(self.fitters.values()))
        months = list(range(0, 61, 3))
        base = [float(kmf.predict(m)) for m in months]
        adjusted = [max(0.0, min(1.0, s ** hazard_ratio)) for s in base]
        points = [{"month": m, "survival": round(s, 3)} for m, s in zip(months, adjusted)]

        def at(month: int) -> float:
            try:
                v = float(kmf.predict(month))
                return max(0.0, min(1.0, v ** hazard_ratio))
            except Exception:
                return adjusted[-1]

        return {
            "curve": points,
            "threeYear": round(at(36), 3),
            "fiveYear": round(at(60), 3),
        }


def hazard_ratio(facts: Dict[str, Any]) -> float:
    hr = 1.0
    if facts.get("margin_status") == "positive":
        hr *= 1.35
    elif facts.get("margin_status") == "close":
        hr *= 1.10
    if facts.get("ene") == "present":
        hr *= 1.45
    doi = facts.get("doi_mm", 0) or 0
    if doi > 10:
        hr *= 1.20
    elif doi > 4:
        hr *= 1.08
    return hr
