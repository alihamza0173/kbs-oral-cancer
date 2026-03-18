import React from 'react';

const TYPE_STYLES = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  primary: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    border: 'border-l-slate-400',
    bg: 'bg-slate-50',
    icon: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
  },
};

export default function RecommendationCards({ recommendations, alerts }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">MDT Recommendations</h2>
          <p className="text-xs text-slate-500">Evidence-based treatment decisions</p>
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-red-700 font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const style = TYPE_STYLES[rec.type] || TYPE_STYLES.info;
          return (
            <div key={i} className={`border-l-4 ${style.border} ${style.bg} rounded-r-lg p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-800">{rec.title}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                  {rec.type.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{rec.description}</p>
              <p className="text-[10px] text-slate-400 italic">Evidence: {rec.evidence}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
