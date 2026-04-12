import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-econ-200 shadow-lg rounded-lg px-3 py-2">
      <p className="text-xs font-semibold text-econ-800">{d.phase}</p>
      <p className="text-sm font-bold text-econ-700">
        ${d.cost.toLocaleString()}
      </p>
    </div>
  );
}

export default function CostChart({ costData, totalCost }) {
  if (!costData || costData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-econ-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-econ-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-econ-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-econ-900">Cost Analysis</h2>
            <p className="text-xs text-econ-600">Phase-based economic evaluation</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-econ-800">${totalCost.toLocaleString()}</p>
          <p className="text-xs text-econ-500">Estimated Total</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={costData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="phase" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={48}>
            {costData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {costData.map((item, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-econ-50 border border-econ-100">
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
            <p className="text-xs font-semibold text-econ-800">${item.cost.toLocaleString()}</p>
            <p className="text-[10px] text-econ-600">{item.phase}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
