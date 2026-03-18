import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2">
      <p className="text-xs font-semibold text-slate-700">Month {d.month}</p>
      <p className="text-sm font-bold text-indigo-600">{(d.survival * 100).toFixed(1)}% survival</p>
    </div>
  );
}

export default function SurvivalChart({ survivalCurve, survival }) {
  if (!survivalCurve || survivalCurve.length === 0) return null;

  const data = survivalCurve.map(p => ({
    ...p,
    survivalPct: Math.round(p.survival * 100 * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Kaplan-Meier Survival Projection</h2>
          <p className="text-xs text-slate-500">Patient-level estimated survival probability</p>
        </div>
      </div>

      <div className="flex gap-6 mb-4">
        <div className="flex-1 bg-indigo-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{(survival.threeYear * 100).toFixed(0)}%</p>
          <p className="text-xs text-indigo-500 font-medium">3-Year Survival</p>
        </div>
        <div className="flex-1 bg-violet-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-violet-600">{(survival.fiveYear * 100).toFixed(0)}%</p>
          <p className="text-xs text-violet-500 font-medium">5-Year Survival</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <defs>
            <linearGradient id="survivalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Survival %', angle: -90, position: 'insideLeft', offset: 20, fontSize: 11, fill: '#64748b' }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={36} stroke="#6366f1" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine x={60} stroke="#8b5cf6" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area
            type="stepAfter"
            dataKey="survivalPct"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#survivalGrad)"
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-[10px] text-slate-400">
        <span>--- 36-month mark</span>
        <span>--- 60-month mark</span>
      </div>
    </div>
  );
}
