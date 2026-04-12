import React from 'react';

const STATUS_STYLES = {
  completed: {
    dot: 'bg-clinical-600',
    line: 'bg-clinical-300',
    badge: 'bg-clinical-100 text-clinical-700',
    label: 'Completed',
  },
  active: {
    dot: 'bg-clinical-500 ring-4 ring-clinical-100',
    line: 'bg-clinical-300',
    badge: 'bg-clinical-100 text-clinical-700',
    label: 'Active',
  },
  recommended: {
    dot: 'bg-amber-500 ring-4 ring-amber-100',
    line: 'bg-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Recommended',
  },
  conditional: {
    dot: 'bg-clinical-400',
    line: 'bg-clinical-200',
    badge: 'bg-clinical-100 text-clinical-600',
    label: 'Conditional',
  },
  pending: {
    dot: 'bg-slate-300',
    line: 'bg-slate-200',
    badge: 'bg-slate-100 text-slate-500',
    label: 'Pending',
  },
};

export default function TreatmentPathway({ pathway }) {
  if (!pathway || pathway.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-clinical-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-clinical-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-clinical-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Treatment Pathway</h2>
          <p className="text-xs text-slate-500">Evidence-based care roadmap</p>
        </div>
      </div>

      <div className="relative">
        {pathway.map((step, i) => {
          const style = STATUS_STYLES[step.status] || STATUS_STYLES.pending;
          const isLast = i === pathway.length - 1;

          return (
            <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full shrink-0 ${style.dot}`} />
                {!isLast && <div className={`w-0.5 flex-1 mt-1 ${style.line}`} />}
              </div>
              <div className="flex-1 -mt-0.5 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800">{step.phase}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
