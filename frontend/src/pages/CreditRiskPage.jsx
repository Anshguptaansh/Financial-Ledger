import { useState } from 'react';
import api from '../api';
import RiskGauge from '../components/RiskGauge';

const PURPOSE_OPTIONS = [
  'car', 'furniture/equipment', 'radio/TV', 'education',
  'business', 'domestic appliances', 'repairs', 'vacation/others',
];

const SAVING_OPTIONS = ['little', 'moderate', 'quite rich', 'rich'];
const CHECKING_OPTIONS = ['little', 'moderate', 'rich'];

const defaultForm = {
  age: '',
  sex: 'male',
  job: '2',
  housing: 'own',
  saving_accounts: 'little',
  checking_account: 'little',
  credit_amount: '',
  duration: '',
  purpose: 'car',
};

export default function CreditRiskPage() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/credit-risk', {
        age: Number(form.age),
        sex: form.sex,
        job: Number(form.job),
        housing: form.housing,
        saving_accounts: form.saving_accounts,
        checking_account: form.checking_account,
        credit_amount: Number(form.credit_amount),
        duration: Number(form.duration),
        purpose: form.purpose,
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to get prediction. Make sure the ML service is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setResult(null);
    setError('');
  };

  const riskColors = {
    Low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="page-title">Credit Risk Assessment</h1>
        <span className="text-sm text-surface-400 dark:text-surface-500">
          AI-Powered Prediction
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Form ────────────────────────────────── */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="card" id="credit-risk-form">
            <h2 className="section-title mb-5">Applicant Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="label" htmlFor="cr-age">Age</label>
                <input
                  id="cr-age"
                  type="number"
                  name="age"
                  className="input"
                  placeholder="e.g. 35"
                  value={form.age}
                  onChange={handleChange}
                  min={18}
                  max={100}
                  required
                />
              </div>

              {/* Sex */}
              <div>
                <label className="label" htmlFor="cr-sex">Sex</label>
                <select id="cr-sex" name="sex" className="input" value={form.sex} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Job */}
              <div>
                <label className="label" htmlFor="cr-job">Job Category</label>
                <select id="cr-job" name="job" className="input" value={form.job} onChange={handleChange}>
                  <option value="0">0 — Unskilled (non-resident)</option>
                  <option value="1">1 — Unskilled (resident)</option>
                  <option value="2">2 — Skilled</option>
                  <option value="3">3 — Highly skilled</option>
                </select>
              </div>

              {/* Housing */}
              <div>
                <label className="label" htmlFor="cr-housing">Housing</label>
                <select id="cr-housing" name="housing" className="input" value={form.housing} onChange={handleChange}>
                  <option value="own">Own</option>
                  <option value="rent">Rent</option>
                  <option value="free">Free</option>
                </select>
              </div>

              {/* Saving Accounts */}
              <div>
                <label className="label" htmlFor="cr-saving">Saving Accounts</label>
                <select id="cr-saving" name="saving_accounts" className="input" value={form.saving_accounts} onChange={handleChange}>
                  {SAVING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Checking Account */}
              <div>
                <label className="label" htmlFor="cr-checking">Checking Account</label>
                <select id="cr-checking" name="checking_account" className="input" value={form.checking_account} onChange={handleChange}>
                  {CHECKING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Credit Amount */}
              <div>
                <label className="label" htmlFor="cr-amount">Credit Amount (₹)</label>
                <input
                  id="cr-amount"
                  type="number"
                  name="credit_amount"
                  className="input"
                  placeholder="e.g. 5000"
                  value={form.credit_amount}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="label" htmlFor="cr-duration">Duration (months)</label>
                <input
                  id="cr-duration"
                  type="number"
                  name="duration"
                  className="input"
                  placeholder="e.g. 24"
                  value={form.duration}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>

              {/* Purpose — full width */}
              <div className="sm:col-span-2">
                <label className="label" htmlFor="cr-purpose">Loan Purpose</label>
                <select id="cr-purpose" name="purpose" className="input" value={form.purpose} onChange={handleChange}>
                  {PURPOSE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' / ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm" id="cr-error">
                ⚠️ {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
                id="cr-submit"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>🎯 Assess Risk</>
                )}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                id="cr-reset"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Results ─────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Gauge Card */}
          <div className="card flex flex-col items-center py-8" id="risk-gauge-card">
            {result ? (
              <div className="animate-scale-in">
                <RiskGauge score={result.risk_score} size={220} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-surface-400 dark:text-surface-500">
                <span className="text-5xl mb-3">🎯</span>
                <p className="text-sm">Fill the form and click <strong>Assess Risk</strong></p>
              </div>
            )}
          </div>

          {/* Result Details Card */}
          {result && (
            <div className="card animate-slide-up" id="risk-result-card">
              <h2 className="section-title mb-4">Analysis Result</h2>

              <div className="space-y-3">
                {/* Risk Level */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Risk Level</span>
                  <span className={`badge ${riskColors[result.risk_level] || riskColors.Medium}`}>
                    {result.risk_level}
                  </span>
                </div>

                {/* Risk Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Default Probability</span>
                  <span className="text-sm font-bold text-surface-900 dark:text-white">
                    {(result.risk_score * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Prediction */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Prediction</span>
                  <span className={`text-sm font-semibold ${
                    result.prediction === 'good'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.prediction === 'good' ? '✅ Good (Approve)' : '⚠️ Bad (Risky)'}
                  </span>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Confidence</span>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Model */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
                  <span className="text-xs text-surface-400 dark:text-surface-500">Model</span>
                  <span className="text-xs text-surface-400 dark:text-surface-500">
                    {result.model_used}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`mt-4 p-4 rounded-xl text-sm ${
                result.prediction === 'good'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {result.prediction === 'good' ? (
                  <>
                    <strong>✅ Recommendation:</strong> This applicant has a low default probability.
                    The loan can likely be approved with standard terms.
                  </>
                ) : (
                  <>
                    <strong>⚠️ Recommendation:</strong> This applicant shows elevated default risk.
                    Consider requiring additional collateral, a co-signer, or adjusting loan terms.
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
