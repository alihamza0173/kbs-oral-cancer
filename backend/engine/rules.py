"""Clinical rules for the oral-cancer KBS.

Rules are defined as plain functions wrapped in `Rule` objects and executed by
the ForwardChainer. Each rule is idempotent — it fires at most once per
evaluation — but the order they fire in is data-driven: a rule that depends on
`facts['stage']` waits until the staging rule has added that fact.
"""
from typing import Any, Dict, List

from .forward_chaining import Rule
from .knowledge_base import COST_BASE, EARTH_TONES, EVIDENCE


# ---------- AJCC 8 oral-cavity staging ----------

def _derive_stage(t: str, n: str, m: str) -> str:
    if m == "M1":
        return "IVC"
    if t == "T4b" or n in ("N3a", "N3b"):
        return "IVB"
    if t == "T4a" or n in ("N2a", "N2b", "N2c"):
        return "IVA"
    if n == "N1":
        return "III"
    if t == "T3":
        return "III"
    if t == "T2":
        return "II"
    if t == "T1":
        return "I"
    return "III"


def rule_tnm_staging() -> Rule:
    def condition(f): return "stage" not in f and all(k in f for k in ("T", "N", "M"))
    def action(f):
        stage = _derive_stage(f["T"], f["N"], f["M"])
        return {
            "stage": stage,
            "pathway": f["pathway"] + [
                {"phase": "Diagnosis", "description": "Clinical exam, biopsy, imaging (CT/MRI/PET)", "status": "completed"},
                {"phase": "Pathology", "description": f"TNM staging: {f['T']} {f['N']} {f['M']} → Stage {stage}", "status": "completed"},
                {"phase": "MDT Decision", "description": "Multidisciplinary team case review", "status": "active"},
            ],
        }
    return Rule("R_TNM_Staging", condition, action, priority=10)


def rule_primary_surgery() -> Rule:
    def condition(f): return f.get("stage") in ("I", "II", "III", "IVA", "IVB") and not f.get("primary_treatment")
    def action(f):
        stage = f["stage"]
        if stage in ("IVB",):
            title = "Primary Concurrent Chemoradiation"
            desc = f"Stage {stage} (T4b or N3) — surgery generally not feasible; definitive CRT is standard of care."
            rec_type = "primary"
            phase = {"phase": "Primary CRT", "description": "Concurrent cisplatin-based chemoradiation", "status": "recommended"}
        else:
            title = "Primary Surgical Resection"
            desc = f"Wide local excision of primary tumor with adequate margins (Stage {stage})."
            rec_type = "primary"
            phase = {"phase": "Primary Surgery", "description": "Wide local excision with adequate margins", "status": "recommended"}
        return {
            "primary_treatment": "CRT" if stage == "IVB" else "Surgery",
            "recommendations": f["recommendations"] + [
                {"type": rec_type, "title": title, "description": desc, "evidence": EVIDENCE["nccn"]}
            ],
            "pathway": f["pathway"] + [phase],
        }
    return Rule("R_Primary_Treatment", condition, action, priority=20)


def rule_palliative_m1() -> Rule:
    def condition(f): return f.get("stage") == "IVC" and not f.get("primary_treatment")
    def action(f):
        return {
            "primary_treatment": "Palliative",
            "recommendations": f["recommendations"] + [{
                "type": "critical",
                "title": "Palliative / Systemic Therapy",
                "description": "Distant metastasis (M1) present. Goals-of-care discussion; systemic therapy and best supportive care.",
                "evidence": EVIDENCE["nccn"],
            }],
            "pathway": f["pathway"] + [
                {"phase": "Systemic Therapy", "description": "Palliative chemotherapy / immunotherapy", "status": "recommended"},
            ],
            "alerts": f["alerts"] + [{"severity": "high", "message": "M1 disease — treatment intent is palliative"}],
        }
    return Rule("R_Palliative_M1", condition, action, priority=15)


def rule_doi_neck_dissection() -> Rule:
    def condition(f):
        return (
            f.get("stage") in ("I", "II")
            and f.get("N") == "N0"
            and f.get("doi_mm", 0) > 4
            and "elective_nd" not in f
        )
    def action(f):
        doi = f["doi_mm"]
        return {
            "elective_nd": True,
            "recommendations": f["recommendations"] + [{
                "type": "critical",
                "title": "Perform Elective Neck Dissection",
                "description": f"DOI = {doi}mm (>4mm threshold). Elective neck dissection is strongly recommended to address occult nodal metastasis risk.",
                "evidence": EVIDENCE["dcruz"],
            }],
            "pathway": f["pathway"] + [
                {"phase": "Neck Dissection", "description": f"Elective neck dissection (DOI {doi}mm > 4mm)", "status": "recommended"},
            ],
            "alerts": f["alerts"] + [{
                "severity": "high",
                "message": f"DOI of {doi}mm exceeds 4mm threshold — elective neck dissection indicated",
            }],
        }
    return Rule("R_DOI_Neck_Dissection", condition, action, priority=30)


def rule_watchful_waiting_neck() -> Rule:
    def condition(f):
        return (
            f.get("stage") in ("I", "II")
            and f.get("N") == "N0"
            and f.get("doi_mm", 0) <= 4
            and "elective_nd" not in f
            and "neck_decision_noted" not in f
        )
    def action(f):
        return {
            "neck_decision_noted": True,
            "recommendations": f["recommendations"] + [{
                "type": "info",
                "title": "Neck Dissection Not Indicated",
                "description": f"DOI = {f.get('doi_mm', 0)}mm (≤4mm). Watchful waiting with regular follow-up imaging recommended.",
                "evidence": EVIDENCE["nccn"],
            }],
        }
    return Rule("R_Watchful_Waiting_Neck", condition, action, priority=35)


def rule_margins_ene_crt() -> Rule:
    def condition(f):
        triggered = f.get("margin_status") == "positive" or f.get("ene") == "present"
        return triggered and "adjuvant_crt" not in f and f.get("stage") != "IVC"
    def action(f):
        reasons: List[str] = []
        if f.get("margin_status") == "positive":
            reasons.append("positive surgical margins")
        if f.get("ene") == "present":
            reasons.append("extranodal extension (ENE)")
        return {
            "adjuvant_crt": True,
            "recommendations": f["recommendations"] + [{
                "type": "critical",
                "title": "Escalate to Adjuvant Chemoradiation",
                "description": f"Concurrent cisplatin-based chemoradiation is indicated due to: {' and '.join(reasons)}. These are high-risk pathologic features.",
                "evidence": EVIDENCE["cooper_bernier"],
            }],
            "pathway": f["pathway"] + [
                {"phase": "Adjuvant CRT", "description": f"Concurrent chemoradiation ({', '.join(reasons)})", "status": "recommended"},
            ],
            "alerts": f["alerts"] + [{
                "severity": "high",
                "message": f"Adjuvant chemoradiation indicated due to {' and '.join(reasons)}",
            }],
        }
    return Rule("R_Margins_ENE_CRT", condition, action, priority=40)


def rule_adjuvant_rt_advanced() -> Rule:
    def condition(f):
        return (
            f.get("stage") in ("III", "IVA")
            and not f.get("adjuvant_crt")
            and "adjuvant_rt" not in f
        )
    def action(f):
        return {
            "adjuvant_rt": True,
            "recommendations": f["recommendations"] + [{
                "type": "warning",
                "title": "Consider Adjuvant Radiation Therapy",
                "description": "Adjuvant radiation therapy should be considered based on advanced stage. Final decision per MDT review of final pathology.",
                "evidence": EVIDENCE["nccn"],
            }],
            "pathway": f["pathway"] + [
                {"phase": "Adjuvant RT", "description": "Adjuvant radiation therapy (advanced stage)", "status": "conditional"},
            ],
        }
    return Rule("R_Adjuvant_RT_Advanced", condition, action, priority=50)


def rule_followup_phase() -> Rule:
    def condition(f): return "stage" in f and "followup_added" not in f
    def action(f):
        return {
            "followup_added": True,
            "pathway": f["pathway"] + [
                {"phase": "Follow-up", "description": "Surveillance: clinical exam + imaging q3-6 months for 2 years", "status": "pending"},
            ],
        }
    return Rule("R_Followup_Phase", condition, action, priority=80)


def rule_cost_builder() -> Rule:
    def condition(f): return "stage" in f and "cost_built" not in f
    def action(f):
        stage = f["stage"]
        base = dict(COST_BASE.get(stage, COST_BASE["III"]))
        if f.get("elective_nd"):
            base["surgery"] += 8000
        if f.get("adjuvant_crt"):
            base["adjuvantRT"] = max(base["adjuvantRT"], 22000)
        if not f.get("adjuvant_rt") and not f.get("adjuvant_crt") and stage in ("I",):
            base["adjuvantRT"] = 0
        base = {k: round(v) for k, v in base.items()}
        cost_data = [
            {"phase": "Diagnosis",  "cost": base["diagnosis"],  "color": EARTH_TONES[0]},
            {"phase": "Surgery",    "cost": base["surgery"],    "color": EARTH_TONES[1]},
            {"phase": "Adjuvant",   "cost": base["adjuvantRT"], "color": EARTH_TONES[2]},
            {"phase": "Follow-up",  "cost": base["followUp"],   "color": EARTH_TONES[3]},
        ]
        return {
            "cost_built": True,
            "cost_data": cost_data,
            "total_cost": sum(item["cost"] for item in cost_data),
        }
    return Rule("R_Cost_Builder", condition, action, priority=90)


def rule_risk_level() -> Rule:
    def condition(f): return "stage" in f and "risk_level" not in f
    def action(f):
        high = f.get("adjuvant_crt") or f.get("stage") in ("IVB", "IVC")
        moderate = f.get("elective_nd") or f.get("stage") in ("III", "IVA") or f.get("margin_status") == "close"
        level = "High" if high else ("Moderate" if moderate else "Standard")
        return {"risk_level": level}
    return Rule("R_Risk_Level", condition, action, priority=95)


def all_rules() -> List[Rule]:
    return [
        rule_tnm_staging(),
        rule_palliative_m1(),
        rule_primary_surgery(),
        rule_doi_neck_dissection(),
        rule_watchful_waiting_neck(),
        rule_margins_ene_crt(),
        rule_adjuvant_rt_advanced(),
        rule_followup_phase(),
        rule_cost_builder(),
        rule_risk_level(),
    ]
