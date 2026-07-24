export default function StatsCard({ icon, label, value, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'from-primary-500 to-primary-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
    rose: 'from-rose-500 to-rose-700',
    violet: 'from-violet-500 to-violet-700',
    blue: 'from-blue-500 to-blue-700',
  };

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 sm:p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl sm:text-3xl">{icon}</span>
          <span className="text-xs sm:text-sm font-medium opacity-80 text-right">{label}</span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
