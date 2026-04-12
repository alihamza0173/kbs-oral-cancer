import React from 'react';

const INPUT_LABEL = "block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide";
const INPUT_BASE = "w-full px-3 py-2.5 bg-white border border-clinical-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 transition-colors";

const T_OPTIONS = ['T1', 'T2', 'T3', 'T4a', 'T4b'];
const N_OPTIONS = ['N0', 'N1', 'N2a', 'N2b', 'N2c', 'N3a', 'N3b'];
const M_OPTIONS = ['M0', 'M1'];

export default function PatientInputForm({ formData, onChange, derivedStage, rulesFired }) {
  const handleChange = (field) => (e) => {
    onChange({ ...formData, [field]: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-clinical-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-clinical-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-clinical-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Patient Clinical Data</h2>
          <p className="text-xs text-slate-500">Live inference as you type</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={INPUT_LABEL}>Tumor Size (cm)</label>
          <input
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={formData.tumor_size_cm}
            onChange={handleChange('tumor_size_cm')}
            className={INPUT_BASE}
            placeholder="e.g., 3.0"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={INPUT_LABEL}>T</label>
            <select value={formData.T} onChange={handleChange('T')} className={INPUT_BASE}>
              {T_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={INPUT_LABEL}>N</label>
            <select value={formData.N} onChange={handleChange('N')} className={INPUT_BASE}>
              {N_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={INPUT_LABEL}>M</label>
            <select value={formData.M} onChange={handleChange('M')} className={INPUT_BASE}>
              {M_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {derivedStage && (
          <div className="px-3 py-2 bg-clinical-50 border border-clinical-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-clinical-700 uppercase tracking-wide">Derived Stage</span>
              <span className="text-lg font-bold text-clinical-700">{derivedStage}</span>
            </div>
            {rulesFired && rulesFired.length > 0 && (
              <p className="mt-1 text-[10px] text-clinical-600 leading-tight">
                {rulesFired.length} rules fired · forward chaining
              </p>
            )}
          </div>
        )}

        <div>
          <label className={INPUT_LABEL}>Depth of Invasion (mm)</label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={formData.doi_mm}
            onChange={handleChange('doi_mm')}
            className={INPUT_BASE}
            placeholder="e.g., 5.0"
          />
          <p className="mt-1 text-[11px] text-slate-400">Threshold: 4mm for elective neck dissection</p>
        </div>

        <div>
          <label className={INPUT_LABEL}>Margin Status</label>
          <select value={formData.margin_status} onChange={handleChange('margin_status')} className={INPUT_BASE}>
            <option value="negative">Negative (Clear)</option>
            <option value="close">Close (&lt;5mm)</option>
            <option value="positive">Positive (Involved)</option>
          </select>
        </div>

        <div>
          <label className={INPUT_LABEL}>Extranodal Extension (ENE)</label>
          <select value={formData.ene} onChange={handleChange('ene')} className={INPUT_BASE}>
            <option value="absent">Absent</option>
            <option value="present">Present</option>
          </select>
        </div>
      </div>
    </div>
  );
}
