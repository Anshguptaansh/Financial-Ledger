import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '', accountNumber: '', interestRate: 3 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', address: '', note: '', accountNumber: '', interestRate: 3 });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingCustomer(c);
    setForm({ name: c.name, phone: c.phone, address: c.address, note: c.note, accountNumber: c.accountNumber || '', interestRate: c.interestRate });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, form);
      } else {
        await api.post('/customers', form);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer and all related loans/payments?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert('Error deleting customer');
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="page-title">Customers</h1>
        <button onClick={openAdd} className="btn-primary" id="add-customer-btn">
          <span className="text-lg">+</span> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          className="input max-w-md"
          placeholder="🔍 Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="customer-search"
        />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-surface-500 dark:text-surface-400">
            {search ? 'No customers match your search' : 'No customers yet. Add your first customer!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.map((c, i) => (
            <div
              key={c._id}
              className="card-hover animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Link to={`/customers/${c._id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-surface-900 dark:text-white truncate">{c.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                      {c.phone && <span>📱 {c.phone}</span>}
                      <span className="badge-active !text-[10px]">{c.interestRate}% / month</span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <button
                  onClick={(e) => { e.preventDefault(); openEdit(c); }}
                  className="btn-secondary !py-2 !px-3 !text-xs"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(c._id); }}
                  className="btn-danger !py-2 !px-3 !text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required id="customer-name" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} id="customer-phone" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} id="customer-address" />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input !py-2" rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} id="customer-note" />
          </div>
          <div>
            <label className="label">Bank Account Number</label>
            <input className="input" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="e.g. 1234567890" id="customer-account" />
          </div>
          <div>
            <label className="label">Default Interest Rate (% per month)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: parseFloat(e.target.value) || 0 })}
              id="customer-rate"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" id="save-customer-btn">
              {editingCustomer ? 'Update' : 'Add Customer'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
