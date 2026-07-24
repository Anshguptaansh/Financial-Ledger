import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

function formatCurrency(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loan form
  const [loanModal, setLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({ amount: '', interestRate: 3, interestType: 'simple', date: '' });

  // Payment form
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', note: '' });

  // Expanded loan
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [custRes, loansRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/loans/customer/${id}`),
      ]);
      setCustomer(custRes.data);
      setLoans(loansRes.data);
      setLoanForm((f) => ({ ...f, interestRate: custRes.data.interestRate }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', {
        customerId: id,
        amount: parseFloat(loanForm.amount),
        interestRate: parseFloat(loanForm.interestRate),
        interestType: loanForm.interestType,
        date: loanForm.date || undefined,
      });
      setLoanModal(false);
      setLoanForm({ amount: '', interestRate: customer.interestRate, interestType: 'simple', date: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding loan');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        loanId: paymentLoanId,
        amount: parseFloat(paymentForm.amount),
        date: paymentForm.date || undefined,
        note: paymentForm.note,
      });
      setPaymentModal(false);
      setPaymentForm({ amount: '', date: '', note: '' });
      fetchData();
      if (expandedLoan === paymentLoanId) {
        fetchLoanDetail(paymentLoanId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding payment');
    }
  };

  const fetchLoanDetail = async (loanId) => {
    try {
      const { data } = await api.get(`/loans/${loanId}`);
      setLoanDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLoanDetail = (loanId) => {
    if (expandedLoan === loanId) {
      setExpandedLoan(null);
      setLoanDetail(null);
    } else {
      setExpandedLoan(loanId);
      fetchLoanDetail(loanId);
    }
  };

  const handleCloseLoan = async (loanId) => {
    if (!confirm('Mark this loan as closed?')) return;
    try {
      await api.patch(`/loans/${loanId}/close`);
      fetchData();
    } catch (err) {
      alert('Error closing loan');
    }
  };

  const downloadBill = async (loanId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/bill/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to generate bill');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${customer?.name || 'bill'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading bill: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return <div className="card text-center py-12">Customer not found.</div>;
  }

  const totalGiven = loans.reduce((s, l) => s + l.amount, 0);
  const totalPayable = loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.totalPayable || 0), 0);
  const totalPaid = loans.reduce((s, l) => s + (l.totalPaid || 0), 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/customers" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          ← Back to Customers
        </Link>
      </div>

      {/* Customer Header */}
      <div className="card mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-600/25">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">{customer.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-surface-500 dark:text-surface-400 mt-1">
                {customer.phone && <span>📱 {customer.phone}</span>}
                {customer.address && <span>📍 {customer.address}</span>}
                {customer.accountNumber && <span>🏦 {customer.accountNumber}</span>}
                <span className="badge-active">{customer.interestRate}% / month</span>
              </div>
              {customer.note && (
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">📝 {customer.note}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-surface-200 dark:border-surface-700">
          <div className="text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400">Given</p>
            <p className="font-bold text-lg text-surface-900 dark:text-white">{formatCurrency(totalGiven)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400">Paid</p>
            <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400">Pending</p>
            <p className="font-bold text-lg text-rose-600 dark:text-rose-400">{formatCurrency(totalPayable - totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Loans section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Loans ({loans.length})</h2>
        <button onClick={() => setLoanModal(true)} className="btn-primary !py-2 !text-xs" id="add-loan-btn">
          + Add Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">📄</p>
          <p className="text-surface-500 dark:text-surface-400">No loans yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan, i) => (
            <div
              key={loan._id}
              className="card animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                onClick={() => toggleLoanDetail(loan._id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-surface-900 dark:text-white">
                      {formatCurrency(loan.amount)}
                    </span>
                    <span className={loan.status === 'active' ? 'badge-active' : 'badge-closed'}>
                      {loan.status}
                    </span>
                    <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {loan.interestType === 'simple' ? 'Simple' : 'Compound'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-surface-500 dark:text-surface-400">
                    <span>📅 {new Date(loan.date).toLocaleDateString('en-IN')}</span>
                    <span>📊 {loan.interestRate}% / month</span>
                    <span>⏱️ {loan.months} months</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Interest: {formatCurrency(loan.interest)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-right mr-2">
                    <p className="text-xs text-surface-400">Balance</p>
                    <p className={`font-bold ${loan.remainingBalance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(loan.remainingBalance)}
                    </p>
                  </div>
                  {loan.status === 'active' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPaymentLoanId(loan._id); setPaymentModal(true); }}
                        className="btn-success !py-2 !px-3 !text-xs"
                      >
                        💵 Pay
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadBill(loan._id); }}
                        className="btn-secondary !py-2 !px-3 !text-xs"
                      >
                        📄 Bill
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCloseLoan(loan._id); }}
                        className="btn-secondary !py-2 !px-3 !text-xs"
                      >
                        ✅ Close
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded: Payment History */}
              {expandedLoan === loan._id && loanDetail && (
                <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 animate-fade-in">
                  <h4 className="text-sm font-semibold mb-3 text-surface-700 dark:text-surface-300">
                    Payment History ({loanDetail.payments?.length || 0})
                  </h4>
                  {loanDetail.payments && loanDetail.payments.length > 0 ? (
                    <div className="space-y-2">
                      {loanDetail.payments.map((p) => (
                        <div key={p._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-50 dark:bg-surface-900/50 text-sm">
                          <div>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.amount)}
                            </span>
                            {p.note && <span className="text-surface-400 ml-2">— {p.note}</span>}
                          </div>
                          <span className="text-xs text-surface-400">
                            {new Date(p.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-surface-400">No payments recorded yet.</p>
                  )}
                  <div className="mt-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-surface-500">Principal</p>
                        <p className="font-bold">{formatCurrency(loanDetail.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Interest</p>
                        <p className="font-bold text-amber-600">{formatCurrency(loanDetail.interest)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Paid</p>
                        <p className="font-bold text-emerald-600">{formatCurrency(loanDetail.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Due</p>
                        <p className="font-bold text-rose-600">{formatCurrency(loanDetail.remainingBalance)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Loan Modal */}
      <Modal open={loanModal} onClose={() => setLoanModal(false)} title="Add Loan">
        <form onSubmit={handleAddLoan} className="space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input
              className="input"
              type="number"
              min="1"
              value={loanForm.amount}
              onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
              required
              id="loan-amount"
            />
          </div>
          <div>
            <label className="label">Interest Rate (% per month)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              value={loanForm.interestRate}
              onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
              id="loan-rate"
            />
          </div>
          <div>
            <label className="label">Interest Type</label>
            <select
              className="input"
              value={loanForm.interestType}
              onChange={(e) => setLoanForm({ ...loanForm, interestType: e.target.value })}
              id="loan-type"
            >
              <option value="simple">Simple Interest</option>
              <option value="compound">Monthly Compound Interest</option>
            </select>
          </div>
          <div>
            <label className="label">Date (optional — defaults to today)</label>
            <input
              className="input"
              type="date"
              value={loanForm.date}
              onChange={(e) => setLoanForm({ ...loanForm, date: e.target.value })}
              id="loan-date"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" id="save-loan-btn">Add Loan</button>
            <button type="button" onClick={() => setLoanModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Add Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input
              className="input"
              type="number"
              min="1"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
              id="payment-amount"
            />
          </div>
          <div>
            <label className="label">Date (optional)</label>
            <input
              className="input"
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              id="payment-date"
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              className="input"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
              placeholder="e.g. Cash payment"
              id="payment-note"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-success flex-1" id="save-payment-btn">Add Payment</button>
            <button type="button" onClick={() => setPaymentModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
