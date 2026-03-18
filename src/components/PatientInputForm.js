import React from 'react';
import { TNM_STAGES } from '../engine/kbsEngine';

const INPUT_LABEL = "block text-sm font-semibold text-slate-700 mb-1.5";
const INPUT_BASE = "w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

export default function PatientInputForm({ formData, onChange, onSubmit }) {
  const handleChange = (field) => (e) => {
    onChange({ ...formData, [field]: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Patient Clinical Data</h2>
          <p className="text-xs text-slate-500">Enter staging and pathologic parameters</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={INPUT_LABEL}>TNM Stage</label>
          <select value={formData.tnmStage} onChange={handleChange('tnmStage')} className={INPUT_BASE}>
            {TNM_STAGES.map(s => (
              <option key={s} value={s}>Stage {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={INPUT_LABEL}>Depth of Invasion (DOI) — mm</label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={formData.doi}
            onChange={handleChange('doi')}
            className={INPUT_BASE}
            placeholder="e.g., 5.0"
          />
          <p className="mt-1 text-xs text-slate-400">Threshold: 4mm for elective neck dissection</p>
        </div>

        <div>
          <label className={INPUT_LABEL}>Margin Status</label>
          <select value={formData.marginStatus} onChange={handleChange('marginStatus')} className={INPUT_BASE}>
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

        <button
          onClick={onSubmit}
          className="w-full mt-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
        >
          Generate MDT Recommendations
        </button>
      </div>
    </div>
  );
}
