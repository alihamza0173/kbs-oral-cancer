"""Static clinical knowledge: cost base, palette, evidence strings.

Sources: NCCN Head & Neck Cancer Guidelines v2.2024; Cooper/Bernier NEJM 2004;
D'Cruz et al. NEJM 2015; AJCC 8th ed. Oral Cavity staging.
"""

COST_BASE = {
    "I":   {"diagnosis": 1500, "surgery": 15000, "adjuvantRT": 0,     "followUp": 4800},
    "II":  {"diagnosis": 1500, "surgery": 15000, "adjuvantRT": 8000,  "followUp": 6200},
    "III": {"diagnosis": 1500, "surgery": 18000, "adjuvantRT": 8000,  "followUp": 8500},
    "IVA": {"diagnosis": 1500, "surgery": 22000, "adjuvantRT": 22000, "followUp": 11000},
    "IVB": {"diagnosis": 1500, "surgery": 24000, "adjuvantRT": 22000, "followUp": 14000},
    "IVC": {"diagnosis": 1500, "surgery": 0,     "adjuvantRT": 22000, "followUp": 16000},
}

CLINICAL_PALETTE = "#0d9488"
CLINICAL_SECONDARY = "#0284c7"
EARTH_TONES = ["#8c6f4a", "#a98467", "#c9a87c", "#5a4632"]

EVIDENCE = {
    "nccn": "NCCN Head & Neck Cancer Guidelines v2.2024",
    "dcruz": "D'Cruz et al., NEJM 2015 (elective neck dissection in early oral cancer)",
    "cooper_bernier": "Cooper et al. NEJM 2004; Bernier et al. NEJM 2004",
    "ajcc": "AJCC Cancer Staging Manual, 8th Edition — Oral Cavity",
    "esmo": "ESMO Clinical Practice Guidelines — Squamous Cell Carcinoma of the Oral Cavity",
}
