export default function RiskGauge({ score = 0, size = 200 }) {
  // score: 0 to 1 (probability of default)
  // Gauge is a semicircle from 180° (left) to 0° (right)
  const clampedScore = Math.max(0, Math.min(1, score));
  const rotation = -90 + clampedScore * 180; // -90° = left edge, 90° = right edge
  const percentage = Math.round(clampedScore * 100);

  // Color based on risk level
  const getColor = (s) => {
    if (s < 0.3) return { main: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Low Risk' };
    if (s < 0.6) return { main: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Medium Risk' };
    return { main: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'High Risk' };
  };

  const color = getColor(clampedScore);
  const radius = size / 2 - 16;
  const strokeWidth = 14;
  const center = size / 2;

  // SVG arc path for the background track (semicircle)
  const arcPath = (r) => {
    const startX = center - r;
    const endX = center + r;
    return `M ${startX} ${center} A ${r} ${r} 0 0 1 ${endX} ${center}`;
  };

  // Calculate the dash for the progress arc
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - clampedScore);

  return (
    <div className="flex flex-col items-center" id="risk-gauge">
      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + 16}
          viewBox={`0 0 ${size} ${size / 2 + 16}`}
          className="overflow-visible"
        >
          {/* Background track */}
          <path
            d={arcPath(radius)}
            fill="none"
            stroke="currentColor"
            className="text-surface-200 dark:text-surface-700"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          <path
            d={arcPath(radius)}
            fill="none"
            stroke={color.main}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            }}
          />

          {/* Needle */}
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius + strokeWidth + 4}
            stroke={color.main}
            strokeWidth={3}
            strokeLinecap="round"
            style={{
              transformOrigin: `${center}px ${center}px`,
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 4px ${color.glow})`,
            }}
          />

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={6}
            fill={color.main}
            style={{
              filter: `drop-shadow(0 0 6px ${color.glow})`,
              transition: 'fill 0.5s ease',
            }}
          />

          {/* Labels: 0% and 100% */}
          <text
            x={center - radius - 4}
            y={center + 20}
            textAnchor="middle"
            className="fill-surface-400 dark:fill-surface-500 text-xs"
            style={{ fontSize: '11px' }}
          >
            0%
          </text>
          <text
            x={center + radius + 4}
            y={center + 20}
            textAnchor="middle"
            className="fill-surface-400 dark:fill-surface-500 text-xs"
            style={{ fontSize: '11px' }}
          >
            100%
          </text>
        </svg>

        {/* Center percentage text */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: '0px' }}
        >
          <span
            className="text-4xl font-bold tabular-nums"
            style={{ color: color.main, transition: 'color 0.5s ease' }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Risk level badge */}
      <div
        className="mt-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{
          backgroundColor: color.main,
          boxShadow: `0 4px 14px ${color.glow}`,
          transition: 'background-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {color.label}
      </div>
    </div>
  );
}
