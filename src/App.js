import { useCallback, useEffect, useRef, useState } from 'react';
import PatientInputForm from './components/PatientInputForm';
import RecommendationCards from './components/RecommendationCards';
import TreatmentPathway from './components/TreatmentPathway';
import SurvivalChart from './components/SurvivalChart';
import CostChart from './components/CostChart';
import RiskBadge from './components/RiskBadge';
import AuditPanel from './components/AuditPanel';
import { evaluatePatient, savePatient } from './api/client';

const DEFAULT_FORM = {
  T: 'T2',
  N: 'N0',
  M: 'M0',
  tumor_size_cm: '3.0',
  doi_mm: '5',
  margin_status: 'negative',
  ene: 'absent',
};

function toPayload(formData) {
  return {
    T: formData.T,
    N: formData.N,
    M: formData.M,
    tumor_size_cm: parseFloat(formData.tumor_size_cm) || 0,
    doi_mm: parseFloat(formData.doi_mm) || 0,
    margin_status: formData.margin_status,
    ene: formData.ene,
  };
}

export default function App() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [view, setView] = useState('assessment');
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    setError(null);
    timerRef.current = setTimeout(async () => {
      try {
        const payload = toPayload(formData);
        const data = await evaluatePatient(payload);
        setResult(data);
      } catch (err) {
        setError(err.message || 'Evaluation failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const saved = await savePatient(toPayload(formData), result);
      setSaveMsg(`Case #${saved.id} saved to registry`);
      setAuditRefreshKey((k) => k + 1);
    } catch (err) {
      setSaveMsg(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }, [formData, result]);

  return (
    <div className="min-h-screen bg-clinical-50">
      <header className="bg-white border-b border-clinical-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-clinical-500 to-clinical-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Oral Cancer KBS</h1>
              <p className="text-xs text-slate-500">Real-Time Clinical Decision Support · Forward-Chaining Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading && <span className="text-xs text-clinical-500 animate-pulse">Evaluating…</span>}
            {result && <RiskBadge level={result.riskLevel} />}
            <nav className="flex items-center gap-1 bg-clinical-50 rounded-lg p-1">
              <button
                onClick={() => setView('assessment')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${view === 'assessment' ? 'bg-white text-clinical-700 shadow-sm' : 'text-slate-500 hover:text-clinical-700'}`}
              >
                Assessment
              </button>
              <button
                onClick={() => setView('audit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${view === 'audit' ? 'bg-white text-clinical-700 shadow-sm' : 'text-slate-500 hover:text-clinical-700'}`}
              >
                Audit & Learning
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'audit' ? (
          <AuditPanel refreshKey={auditRefreshKey} />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Stage {result?.stage || '—'} · DOI {formData.doi_mm}mm · {formData.T}/{formData.N}/{formData.M}
                </h2>
                <p className="text-sm text-slate-500">
                  Margins: {formData.margin_status} · ENE: {formData.ene}
                  {result?.derivedFacts?.hazard_ratio && ` · HR ${result.derivedFacts.hazard_ratio}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saveMsg && <span className="text-xs text-clinical-700 bg-clinical-50 px-3 py-1.5 rounded-lg">{saveMsg}</span>}
                <button
                  onClick={handleSave}
                  disabled={!result || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-clinical-600 rounded-lg hover:bg-clinical-700 active:bg-clinical-800 disabled:bg-slate-300 transition-colors shadow-sm"
                >
                  {saving ? 'Saving…' : 'Save Case'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error} — is the backend running at <code>{process.env.REACT_APP_API_URL || 'http://localhost:8000'}</code>?
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <PatientInputForm
                  formData={formData}
                  onChange={setFormData}
                  derivedStage={result?.stage}
                  rulesFired={result?.derivedFacts?.rules_fired}
                />
                {result && <TreatmentPathway pathway={result.pathway} />}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {result && <RecommendationCards recommendations={result.recommendations} alerts={result.alerts} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result && <SurvivalChart survivalCurve={result.survivalCurve} survival={result.survival} />}
                  {result && <CostChart costData={result.costData} totalCost={result.totalCost} />}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-clinical-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Oral Cancer KBS · Forward-Chaining Inference Engine · Kaplan-Meier survival grounded in clinical dataset.
          For educational and research purposes only. Not a substitute for clinical judgement.
        </div>
      </footer>
    </div>
  );
}
