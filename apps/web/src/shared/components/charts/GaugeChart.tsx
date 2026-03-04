interface GaugeChartProps {
  label: string;
  value: number;
  size?: number;
}

export function GaugeChart({ label, value, size = 160 }: GaugeChartProps) {
  const capped = Math.min(Math.max(value, 0), 200);
  const angle = (capped / 200) * 180; // 0-180 degrees
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Arc path helper
  function arcPath(startAngle: number, endAngle: number, radius: number): string {
    const startRad = ((180 + startAngle) * Math.PI) / 180;
    const endRad = ((180 + endAngle) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  }

  // Color bands: green (0-80%), yellow (80-100%), red (100%+)
  const bands = [
    { start: 0, end: 72, color: '#22c55e' },   // green: 0-80%
    { start: 72, end: 90, color: '#eab308' },   // yellow: 80-100%
    { start: 90, end: 180, color: '#ef4444' },  // red: 100%+
  ];

  // Needle
  const needleAngle = ((180 + angle) * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  // Color for value text
  let valueColor = '#22c55e';
  if (capped > 100) valueColor = '#ef4444';
  else if (capped > 80) valueColor = '#eab308';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background bands */}
        {bands.map((band) => (
          <path
            key={band.start}
            d={arcPath(band.start, band.end, r)}
            fill="none"
            stroke={band.color}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.2}
          />
        ))}

        {/* Active arc */}
        {angle > 0 && (
          <path
            d={arcPath(0, angle, r)}
            fill="none"
            stroke={valueColor}
            strokeWidth={10}
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#374151" />
      </svg>

      {/* Value + label */}
      <p className="mt-1 text-2xl font-bold" style={{ color: valueColor }}>
        {Math.round(value)}%
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}
