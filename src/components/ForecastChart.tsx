import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface ForecastChartProps {
  title: string;
  subtitle?: string;
  data: any[];
  xKey: string;
  series: ChartSeries[];
  chartType?: 'line' | 'area';
  yDomain?: [number, number] | ['auto', 'auto'];
  unit?: string;
}

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-slate-700">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-[11px] font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {unit ? ` ${unit}` : ''}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ForecastChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  chartType = 'line',
  yDomain,
  unit,
}: ForecastChartProps) {
  const commonProps = {
    data,
    margin: { top: 10, right: 12, left: 0, bottom: 0 },
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart {...commonProps}>
              <defs>
                {series.map((item) => (
                  <linearGradient key={`grad-${item.key}`} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={item.color} stopOpacity={0.55} />
                    <stop offset="95%" stopColor={item.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e5e7eb" opacity={0.35} />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={36}
                domain={yDomain}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {series.map((item) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2.2}
                  fill={`url(#grad-${item.key})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e5e7eb" opacity={0.35} />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={36}
                domain={yDomain}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
