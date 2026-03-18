const TNM_STAGES = ['I', 'II', 'III', 'IVA', 'IVB'];

const STAGE_SURVIVAL = {
  'I':   { threeYear: 0.85, fiveYear: 0.78 },
  'II':  { threeYear: 0.72, fiveYear: 0.62 },
  'III': { threeYear: 0.55, fiveYear: 0.42 },
  'IVA': { threeYear: 0.38, fiveYear: 0.28 },
  'IVB': { threeYear: 0.22, fiveYear: 0.15 },
};

const COST_BASE = {
  'I':   { diagnosis: 3200, surgery: 18000, adjuvantRT: 0,     followUp: 4800 },
  'II':  { diagnosis: 4100, surgery: 24000, adjuvantRT: 12000, followUp: 6200 },
  'III': { diagnosis: 5500, surgery: 32000, adjuvantRT: 22000, followUp: 8500 },
  'IVA': { diagnosis: 6800, surgery: 42000, adjuvantRT: 35000, followUp: 11000 },
  'IVB': { diagnosis: 7500, surgery: 48000, adjuvantRT: 42000, followUp: 14000 },
};

function generateSurvivalCurve(threeYear, fiveYear) {
  const points = [];
  for (let month = 0; month <= 60; month += 6) {
    let survival;
    if (month === 0) {
      survival = 1.0;
    } else if (month <= 36) {
      const rate = -Math.log(threeYear) / 36;
      survival = Math.exp(-rate * month);
    } else {
      const rate = -Math.log(fiveYear / threeYear) / 24;
      survival = threeYear * Math.exp(-rate * (month - 36));
    }
    points.push({ month, survival: Math.round(survival * 1000) / 1000 });
  }
  return points;
}

export function evaluatePatient(input) {
  const { tnmStage, doi, marginStatus, ene } = input;

  const recommendations = [];
  const pathway = [];
  const alerts = [];

  pathway.push({
    phase: 'Diagnosis',
    description: 'Clinical exam, biopsy, imaging (CT/MRI/PET)',
    status: 'completed',
  });

  pathway.push({
    phase: 'MDT Review',
    description: 'Multidisciplinary team case presentation',
    status: 'completed',
  });

  recommendations.push({
    type: 'primary',
    title: 'Primary Surgical Resection',
    description: `Wide local excision of primary tumor (Stage ${tnmStage})`,
    evidence: 'NCCN Head & Neck Guidelines v2.2024',
  });

  pathway.push({
    phase: 'Primary Surgery',
    description: 'Wide local excision with adequate margins',
    status: 'active',
  });

  if (doi > 4) {
    recommendations.push({
      type: 'critical',
      title: 'Elective Neck Dissection (END)',
      description: `DOI = ${doi}mm (>4mm threshold). Elective neck dissection is strongly recommended to address occult nodal metastasis risk.`,
      evidence: 'D\'Cruz et al., NEJM 2015; NCCN Guidelines',
    });
    pathway.push({
      phase: 'Neck Dissection',
      description: `Elective neck dissection (DOI ${doi}mm > 4mm threshold)`,
      status: 'recommended',
    });
    alerts.push({
      severity: 'high',
      message: `DOI of ${doi}mm exceeds 4mm threshold — elective neck dissection indicated`,
    });
  } else {
    recommendations.push({
      type: 'info',
      title: 'Neck Dissection Not Indicated',
      description: `DOI = ${doi}mm (≤4mm). Watchful waiting with regular follow-up imaging recommended.`,
      evidence: 'NCCN Head & Neck Guidelines v2.2024',
    });
  }

  const needsAdjuvant = marginStatus === 'positive' || ene === 'present';

  if (needsAdjuvant) {
    const reasons = [];
    if (marginStatus === 'positive') reasons.push('positive surgical margins');
    if (ene === 'present') reasons.push('extranodal extension (ENE)');

    recommendations.push({
      type: 'critical',
      title: 'Adjuvant Chemoradiation',
      description: `Concurrent cisplatin-based chemoradiation recommended due to: ${reasons.join(' and ')}. These are high-risk pathologic features per NCCN criteria.`,
      evidence: 'Cooper et al., NEJM 2004; Bernier et al., NEJM 2004',
    });
    pathway.push({
      phase: 'Adjuvant CRT',
      description: `Concurrent chemoradiation (${reasons.join(', ')})`,
      status: 'recommended',
    });
    alerts.push({
      severity: 'high',
      message: `Adjuvant chemoradiation indicated due to ${reasons.join(' and ')}`,
    });
  } else if (['III', 'IVA', 'IVB'].includes(tnmStage)) {
    recommendations.push({
      type: 'warning',
      title: 'Adjuvant Radiation Therapy',
      description: 'Consider adjuvant radiation therapy based on advanced stage. Final decision per MDT review of pathology.',
      evidence: 'NCCN Head & Neck Guidelines v2.2024',
    });
    pathway.push({
      phase: 'Adjuvant RT',
      description: 'Adjuvant radiation therapy (advanced stage)',
      status: 'conditional',
    });
  }

  pathway.push({
    phase: 'Follow-up',
    description: 'Regular surveillance: clinical exam, imaging q3-6 months',
    status: 'pending',
  });

  const baseSurvival = STAGE_SURVIVAL[tnmStage] || STAGE_SURVIVAL['III'];
  let survivalModifier = 1.0;
  if (marginStatus === 'positive') survivalModifier *= 0.85;
  if (ene === 'present') survivalModifier *= 0.80;
  if (doi > 4 && doi <= 10) survivalModifier *= 0.92;
  if (doi > 10) survivalModifier *= 0.82;

  const adjustedSurvival = {
    threeYear: Math.round(baseSurvival.threeYear * survivalModifier * 100) / 100,
    fiveYear: Math.round(baseSurvival.fiveYear * survivalModifier * 100) / 100,
  };

  const survivalCurve = generateSurvivalCurve(adjustedSurvival.threeYear, adjustedSurvival.fiveYear);

  const baseCosts = COST_BASE[tnmStage] || COST_BASE['III'];
  const costs = { ...baseCosts };
  if (doi > 4) costs.surgery += 8000;
  if (needsAdjuvant) costs.adjuvantRT *= 1.4;
  else if (!['III', 'IVA', 'IVB'].includes(tnmStage)) costs.adjuvantRT = 0;

  Object.keys(costs).forEach(k => costs[k] = Math.round(costs[k]));

  const costData = [
    { phase: 'Diagnosis', cost: costs.diagnosis, color: '#6366f1' },
    { phase: 'Surgery', cost: costs.surgery, color: '#0ea5e9' },
    { phase: 'Adjuvant RT', cost: costs.adjuvantRT, color: '#f59e0b' },
    { phase: 'Follow-up', cost: costs.followUp, color: '#10b981' },
  ];

  const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);

  return {
    recommendations,
    pathway,
    alerts,
    survival: adjustedSurvival,
    survivalCurve,
    costData,
    totalCost,
    riskLevel: needsAdjuvant ? 'High' : (doi > 4 ? 'Moderate' : 'Standard'),
  };
}

export { TNM_STAGES };
