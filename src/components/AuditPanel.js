import React, { useCallback, useEffect, useState } from 'react';
import { fetchAudit, submitOutcome } from '../api/client';

function StatCard({ label, value, tone = 'clinical' }) {
  const toneMap = {
    clinical: 'bg-clinical-50 text-clinical-700 border-clinical-200',
    econ: 'bg-econ-50 text-econ-700 border-econ-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function OutcomeForm({ patientId, onSubmitted }) {
  const [months, setMonths] = useState('');
  const [event, setEvent] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async () => {
    const m = parseFloat(months);
    if (isNaN(m) || m < 0) {
      setErr('Enter valid months');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await submitOutcome(patientId, m, event);
      setMonths('');
      onSubmitted?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        step="0.5"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
        placeholder="months"
        className="w-20 px-2 py-1 text-xs border border-clinical-200 rounded focus:ring-1 focus:ring-clinical-500"
      />
      <select
        value={event}
        onChange={(e) => setEvent(parseInt(e.target.value, 10))}
        className="px-2 py-1 text-xs border border-clinical-200 rounded focus:ring-1 focus:ring-clinical-500"
      >
        <option value={1}>Event</option>
        <option value={0}>Censored</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={busy}
        className="px-2 py-1 text-xs font-medium bg-clinical-600 text-white rounded hover:bg-clinical-700 disabled:bg-slate-300"
      >
        {busy ? '…' : 'Log'}
      </button>
      {err && <span className="text-[10px] text-red-600">{err}</span>}
    </div>
  );
}

export default function AuditPanel({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchAudit();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return <div className="text-sm text-clinical-500 animate-pulse">Loading audit…</div>;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>;
  if (!data) return null;

  const fmtCurrency = (v) => v == null ? '—' : `$${Math.round(v).toLocaleString()}`;
  const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(0)}%`;
  const fmtDate = (v) => v ? new Date(v).toLocaleString() : '—';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Audit & Continuous Learning</h2>
        <p className="text-sm text-slate-500">
          Registry of saved cases. Log real-world outcomes to refit the Kaplan-Meier survival model.
          Last refit: <span className="font-semibold text-clinical-700">{fmtDate(data.last_refit_at)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total cases" value={data.total_cases} />
        <StatCard label="Outcomes logged" value={data.outcomes_recorded} />
        <StatCard label="Mean 5-yr survival" value={fmtPct(data.mean_five_year_survival)} />
        <StatCard label="Mean total cost" value={fmtCurrency(data.mean_total_cost)} tone="econ" />
      </div>

      {Object.keys(data.stage_distribution).length > 0 && (
        <div className="bg-white rounded-xl border border-clinical-200 p-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Stage Distribution</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.stage_distribution).map(([stage, n]) => (
              <span key={stage} className="px-3 py-1.5 bg-clinical-50 border border-clinical-200 rounded-lg text-xs font-semibold text-clinical-700">
                Stage {stage}: {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-clinical-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-clinical-200">
          <h3 className="text-sm font-bold text-slate-800">Recent Cases</h3>
        </div>
        {data.recent_cases.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No saved cases yet. Go to Assessment and click Save Case.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-clinical-50 text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Stage</th>
                  <th className="px-3 py-2 text-left font-semibold">Risk</th>
                  <th className="px-3 py-2 text-left font-semibold">3y / 5y</th>
                  <th className="px-3 py-2 text-left font-semibold text-econ-700">Cost</th>
                  <th className="px-3 py-2 text-left font-semibold">Outcomes</th>
                  <th className="px-3 py-2 text-left font-semibold">Log Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-100">
                {data.recent_cases.map((c) => (
                  <tr key={c.id} className="hover:bg-clinical-50/50">
                    <td className="px-3 py-2 font-mono text-slate-500">#{c.id}</td>
                    <td className="px-3 py-2 text-slate-600">{fmtDate(c.created_at)}</td>
                    <td className="px-3 py-2 font-semibold text-clinical-700">{c.stage}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-clinical-100 text-clinical-700 font-semibold">{c.risk_level}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {fmtPct(c.three_year_survival)} / {fmtPct(c.five_year_survival)}
                    </td>
                    <td className="px-3 py-2 font-semibold text-econ-700">{fmtCurrency(c.total_cost)}</td>
                    <td className="px-3 py-2 text-slate-500">{c.outcomes_count}</td>
                    <td className="px-3 py-2">
                      <OutcomeForm patientId={c.id} onSubmitted={load} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
