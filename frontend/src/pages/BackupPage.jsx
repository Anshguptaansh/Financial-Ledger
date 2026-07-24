import { useState, useRef } from 'react';
import api from '../api';

export default function BackupPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Backup exported successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to export backup.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('This will REPLACE all existing data. Are you sure?')) {
      fileRef.current.value = '';
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { data: result } = await api.post('/reports/import', data);
      setStatus({
        type: 'success',
        message: `Restored: ${result.counts.customers} customers, ${result.counts.loans} loans, ${result.counts.payments} payments`,
      });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to import. Check file format.' });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Backup & Restore</h1>

      {status && (
        <div
          className={`card mb-6 animate-fade-in ${
            status.type === 'success'
              ? '!border-emerald-300 !bg-emerald-50 dark:!bg-emerald-900/20 dark:!border-emerald-800'
              : '!border-red-300 !bg-red-50 dark:!bg-red-900/20 dark:!border-red-800'
          }`}
        >
          <p className={`font-medium ${status.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {status.type === 'success' ? '✅' : '❌'} {status.message}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Export */}
        <div className="card text-center">
          <div className="text-5xl mb-4">📤</div>
          <h2 className="section-title mb-2">Export Backup</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            Download all your data as a JSON file. Save it securely for backup.
          </p>
          <button
            onClick={handleExport}
            className="btn-primary w-full"
            disabled={loading}
            id="export-btn"
          >
            {loading ? 'Exporting...' : '💾 Export Data'}
          </button>
        </div>

        {/* Import */}
        <div className="card text-center">
          <div className="text-5xl mb-4">📥</div>
          <h2 className="section-title mb-2">Restore Backup</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            Import a previously exported JSON backup. This will <strong className="text-rose-600 dark:text-rose-400">replace all existing data</strong>.
          </p>
          <label
            className="btn-secondary w-full cursor-pointer"
            id="import-btn"
          >
            📂 Select Backup File
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
