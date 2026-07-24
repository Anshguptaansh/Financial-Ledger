import { useState, useEffect } from 'react';
import api from '../api';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-sm text-surface-400 dark:text-surface-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            icon="👥"
            label="Total Customers"
            value={stats.totalCustomers}
            color="violet"
            delay={0}
          />
          <StatsCard
            icon="💸"
            label="Total Money Given"
            value={formatCurrency(stats.totalGiven)}
            color="blue"
            delay={50}
          />
          <StatsCard
            icon="📈"
            label="Interest Earned"
            value={formatCurrency(stats.totalInterest)}
            color="emerald"
            delay={100}
          />
          <StatsCard
            icon="💰"
            label="Total Payable"
            value={formatCurrency(stats.totalPayable)}
            color="amber"
            delay={150}
          />
          <StatsCard
            icon="✅"
            label="Total Received"
            value={formatCurrency(stats.totalPaid)}
            color="primary"
            delay={200}
          />
          <StatsCard
            icon="⏳"
            label="Pending Amount"
            value={formatCurrency(stats.totalPending)}
            color="rose"
            delay={250}
          />
        </div>
      )}
    </div>
  );
}
