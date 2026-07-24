import { useState } from 'react';
import api from '../api';

function formatCurrency(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/monthly');
      setReport(data);
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = report?.report?.reduce((s, r) => s + r.pending, 0) || 0;
  const totalInterest = report?.report?.reduce((s, r) => s + r.totalInterest, 0) || 0;
  const totalThisMonthPaid = report?.report?.reduce((s, r) => s + r.thisMonthPaid, 0) || 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="page-title">Monthly Report</h1>
        <button onClick={generateReport} className="btn-primary" disabled={loading} id="generate-report-btn">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              Generating...
            </span>
          ) : (
            '📋 Generate Monthly Report'
          )}
        </button>
      </div>

      {!report && !loading && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-lg font-medium text-surface-600 dark:text-surface-300">Generate Monthly Report</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-2">
            Click the button above to generate a report of all customers, interest, and payments for this month.
          </p>
        </div>
      )}

      {report && (
        <div className="animate-fade-in">
          {/* Summary */}
          <div className="card mb-6">
            <h2 className="section-title mb-4">📅 {report.month}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-surface-500 mb-1">Total Interest</p>
                <p className="font-bold text-lg text-amber-600 dark:text-amber-400">{formatCurrency(totalInterest)}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-xs text-surface-500 mb-1">Payments (This Month)</p>
                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(totalThisMonthPaid)}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                <p className="text-xs text-surface-500 mb-1">Total Pending</p>
                <p className="font-bold text-lg text-rose-600 dark:text-rose-400">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <h2 className="section-title mb-4">Customer Breakdown</h2>
            {report.report.length === 0 ? (
              <p className="text-surface-500 text-center py-6">No active loans this month.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left py-3 px-2 font-semibold text-surface-600 dark:text-surface-300">Customer</th>
                    <th className="text-right py-3 px-2 font-semibold text-surface-600 dark:text-surface-300">Amount</th>
                    <th className="text-right py-3 px-2 font-semibold text-surface-600 dark:text-surface-300 hidden sm:table-cell">Interest</th>
                    <th className="text-right py-3 px-2 font-semibold text-surface-600 dark:text-surface-300">Paid (Month)</th>
                    <th className="text-right py-3 px-2 font-semibold text-surface-600 dark:text-surface-300">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {report.report.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{r.name}</p>
                          {r.phone && <p className="text-xs text-surface-400">{r.phone}</p>}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{formatCurrency(r.totalAmount)}</td>
                      <td className="text-right py-3 px-2 text-amber-600 dark:text-amber-400 hidden sm:table-cell">{formatCurrency(r.totalInterest)}</td>
                      <td className="text-right py-3 px-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(r.thisMonthPaid)}</td>
                      <td className="text-right py-3 px-2 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(r.pending)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-surface-300 dark:border-surface-600">
                    <td className="py-3 px-2 font-bold">Total</td>
                    <td className="text-right py-3 px-2 font-bold">
                      {formatCurrency(report.report.reduce((s, r) => s + r.totalAmount, 0))}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-amber-600 hidden sm:table-cell">
                      {formatCurrency(totalInterest)}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-emerald-600">
                      {formatCurrency(totalThisMonthPaid)}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-rose-600">
                      {formatCurrency(totalPending)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
