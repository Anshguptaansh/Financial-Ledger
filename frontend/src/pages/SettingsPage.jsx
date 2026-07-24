import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, login: setAuth } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '', accountNumber: user?.accountNumber || '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!form.currentPassword) {
      return setStatus({ type: 'error', message: 'Current password is required.' });
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      return setStatus({ type: 'error', message: 'New passwords do not match.' });
    }

    if (!form.newUsername && !form.newPassword && form.accountNumber === (user?.accountNumber || '')) {
      return setStatus({ type: 'error', message: 'Make at least one change to update.' });
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newUsername: form.newUsername || undefined,
        newPassword: form.newPassword || undefined,
        accountNumber: form.accountNumber,
      });

      setAuth(data.token, data.user);
      setForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '', accountNumber: data.user.accountNumber || '' });
      setStatus({ type: 'success', message: data.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Settings</h1>

      <div className="max-w-lg">
        <div className="card animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-600/25">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="section-title">Account Settings</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Logged in as <span className="font-medium text-surface-700 dark:text-surface-300">{user?.username}</span>
              </p>
            </div>
          </div>

          {status && (
            <div
              className={`p-3 rounded-xl mb-5 text-sm animate-fade-in ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}
            >
              {status.type === 'success' ? '✅' : '❌'} {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Current Password *</label>
              <input
                className="input"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
                id="current-password"
              />
            </div>

            <hr className="border-surface-200 dark:border-surface-700" />

            <div>
              <label className="label">Account Number</label>
              <input
                className="input"
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="Enter bank account number"
                id="account-number"
              />
            </div>

            <hr className="border-surface-200 dark:border-surface-700" />

            <div>
              <label className="label">New Username (optional)</label>
              <input
                className="input"
                type="text"
                value={form.newUsername}
                onChange={(e) => setForm({ ...form, newUsername: e.target.value })}
                placeholder={user?.username}
                id="new-username"
              />
            </div>

            <div>
              <label className="label">New Password (optional)</label>
              <input
                className="input"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password"
                id="new-password"
              />
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                className="input"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                id="confirm-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-3.5" disabled={loading} id="save-settings-btn">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Updating...
                </span>
              ) : (
                '💾 Update Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
