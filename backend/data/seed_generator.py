"""Deterministic synthetic seed dataset for oral-cancer survival.

Generates per-stage time-to-event rows that match published SEER 5-year
overall-survival medians for oral cavity SCC. This is NOT real patient data —
it is a seed that produces plausible Kaplan-Meier curves per stage so the
KBS can demonstrate real-dataset-driven survival estimation until real data
is plugged in via the `/api/outcomes` learning loop.

Columns: stage, time_months, event  (event=1 death, 0 censored)
"""
from pathlib import Path
import csv
import math
import random

# Target approximate 5-year OS per stage (matches SEER/NCCN literature)
STAGE_5YR_OS = {
    "I":   0.82,
    "II":  0.65,
    "III": 0.50,
    "IVA": 0.35,
    "IVB": 0.22,
    "IVC": 0.08,
}

PER_STAGE_N = 120
CENSOR_RATE = 0.25  # fraction lost to follow-up
MAX_FOLLOWUP = 72   # months


def _generate_stage(stage: str, five_yr_os: float, rng: random.Random):
    # Exponential time-to-event with rate chosen so S(60) = five_yr_os
    # S(t) = exp(-lambda t) ⇒ lambda = -ln(os)/60
    lam = -math.log(max(five_yr_os, 0.01)) / 60.0
    rows = []
    for _ in range(PER_STAGE_N):
        u = rng.random()
        t_event = -math.log(1 - u) / lam
        t_censor = rng.uniform(12, MAX_FOLLOWUP)
        if rng.random() < CENSOR_RATE or t_censor < t_event:
            rows.append((stage, round(min(t_censor, MAX_FOLLOWUP), 1), 0))
        else:
            rows.append((stage, round(min(t_event, MAX_FOLLOWUP), 1), 1 if t_event <= MAX_FOLLOWUP else 0))
    return rows


def generate(path: Path) -> Path:
    rng = random.Random(20240101)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["stage", "time_months", "event"])
        for stage, os5 in STAGE_5YR_OS.items():
            for row in _generate_stage(stage, os5, rng):
                w.writerow(row)
    return path


if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "oral_cancer_seed.csv"
    generate(out)
    print(f"Wrote {out}")
