import React from 'react';

const RISK_STYLES = {
  Standard: { bg: 'bg-clinical-100', text: 'text-clinical-700', dot: 'bg-clinical-500' },
  Moderate: { bg: 'bg-amber-100',    text: 'text-amber-700',    dot: 'bg-amber-500' },
  High:     { bg: 'bg-econ-200',     text: 'text-econ-900',     dot: 'bg-red-500' },
};

export default function RiskBadge({ level }) {
  const style = RISK_STYLES[level] || RISK_STYLES.Standard;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {level} Risk
    </span>
  );
}
