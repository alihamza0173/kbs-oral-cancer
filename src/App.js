import { useState, useCallback } from 'react';
import PatientInputForm from './components/PatientInputForm';
import RecommendationCards from './components/RecommendationCards';
import TreatmentPathway from './components/TreatmentPathway';
import SurvivalChart from './components/SurvivalChart';
import CostChart from './components/CostChart';
import RiskBadge from './components/RiskBadge';
import { evaluatePatient } from './engine/kbsEngine';

const DEFAULT_FORM = {
  tnmStage: 'II',
  doi: '5',
  marginStatus: 'negative',
  ene: 'absent',
};

export default function App() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  const handleSubmit = useCallback(() => {
    const input = {
      tnmStage: formData.tnmStage,
      doi: parseFloat(formData.doi) || 0,
      marginStatus: formData.marginStatus,
      ene: formData.ene,
    };
    setResult(evaluatePatient(input));
  }, [formData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Oral Cancer KBS</h1>
              <p className="text-xs text-slate-500">MDT Clinical Decision Support System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {result && <RiskBadge level={result.riskLevel} />}
            <span className="text-xs text-slate-400 hidden sm:block">v1.0 — Evidence-Based Protocol Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!result ? (
          <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Patient Assessment</h2>
              <p className="text-sm text-slate-500">
                Enter clinical parameters to generate evidence-based MDT treatment recommendations,
                survival projections, and cost analysis.
              </p>
            </div>
            <PatientInputForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Stage {formData.tnmStage} — DOI {formData.doi}mm
                </h2>
                <p className="text-sm text-slate-500">
                  Margins: {formData.marginStatus} | ENE: {formData.ene}
                </p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                New Assessment
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <PatientInputForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} />
                <TreatmentPathway pathway={result.pathway} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <RecommendationCards recommendations={result.recommendations} alerts={result.alerts} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SurvivalChart survivalCurve={result.survivalCurve} survival={result.survival} />
                  <CostChart costData={result.costData} totalCost={result.totalCost} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Oral Cancer KBS — Knowledge-Based Clinical Decision Support for MDT Review.
          For educational and research purposes only. Not a substitute for clinical judgement.
        </div>
      </footer>
    </div>
  );
}
