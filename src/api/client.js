const BASE = process.env.REACT_APP_API_URL || (
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://kbs-oral-cancer.onrender.com'
);

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export function evaluatePatient(input) {
  return request('/api/evaluate', { method: 'POST', body: JSON.stringify(input) });
}

export function savePatient(input, result) {
  return request('/api/patients', { method: 'POST', body: JSON.stringify({ input, result }) });
}

export function listPatients() {
  return request('/api/patients');
}

export function fetchAudit() {
  return request('/api/audit');
}

export function submitOutcome(patientId, timeMonths, event) {
  return request('/api/outcomes', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, time_months: timeMonths, event }),
  });
}
