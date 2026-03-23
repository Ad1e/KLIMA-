import { AlertCircle, Droplets } from 'lucide-react';
import { type CampusWeather } from './services/weather';

const metricItems = [
  { key: 'mslp', label: 'MSLP', unit: '' },
  { key: 'dewpoint', label: 'Dew Point', unit: 'degC' },
  { key: 'heatIndex', label: 'Heat Index', unit: 'degC' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'windDirection', label: 'Wind Dir', unit: '' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h' },
  { key: 'windGust', label: 'Wind Gust', unit: 'km/h' },
  { key: 'visibility', label: 'Visibility', unit: 'km' },
  { key: 'cloudCover', label: 'Cloud Cover', unit: '%' },
] as const;

interface CampusSummaryProps {
  campusData: CampusWeather[];
  dataSource: 'fallback' | 'live';
}

const CampusSummary = ({ campusData, dataSource }: CampusSummaryProps) => {

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#414042]/80">
          Campus Parameters
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            dataSource === 'live'
              ? 'border-[#d2232a]/45 bg-[#d2232a]/14 text-[#911d1f]'
              : 'border-[#d2232a]/25 bg-white text-[#414042]/80'
          }`}
        >
          {dataSource === 'live' ? 'Live API Data' : 'Fallback Data'}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {campusData.map((campus) => (
          <div
            key={campus.name}
            className="group rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/96 to-[#d2232a]/8 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d2232a]/45 hover:shadow-[0_20px_48px_rgba(210,35,42,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-[#d2232a]/20 bg-gradient-to-r from-[#d2232a]/10 to-transparent px-5 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-[#414042]">{campus.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {campus.warning ? (
                    <AlertCircle size={12} className="shrink-0 text-[#d2232a]" />
                  ) : (
                    <Droplets size={12} className="shrink-0 text-[#007e42]" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#911d1f]">
                    {campus.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#414042]/80">Rain</p>
                <p className="text-2xl font-black text-[#414042]">
                  {campus.rain}{' '}
                  <span className="text-xs font-bold text-[#414042]/80">mm</span>
                </p>
                <p className="text-[10px] text-[#414042]/75">Possibility: {campus.rainPossibility}</p>
              </div>

              <div className="h-px bg-gradient-to-r from-[#d2232a]/30 to-transparent" />

              <div className="grid grid-cols-2 gap-2">
                {metricItems.map((metric) => {
                  const value = campus[metric.key];
                  const cellClass =
                    metric.key === 'cloudCover'
                      ? 'col-span-2 rounded-xl border border-[#d2232a]/20 bg-white/92 p-2'
                      : 'rounded-xl border border-[#d2232a]/20 bg-white/92 p-2';
                  return (
                    <div key={`${campus.name}-${metric.key}`} className={cellClass}>
                      <p className="text-[9px] font-bold uppercase text-[#414042]/80">{metric.label}</p>
                      <p className="text-sm font-black text-[#414042]">
                        {value}
                        {metric.unit ? <span className="ml-1 text-[10px] font-semibold">{metric.unit}</span> : null}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className={`mt-3 rounded-xl border px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                campus.warning
                  ? 'border-[#d2232a]/35 bg-gradient-to-r from-[#d2232a]/22 to-[#d2232a]/18 text-[#911d1f]'
                  : 'border-[#009748]/35 bg-gradient-to-r from-[#009748]/20 to-[#007e42]/16 text-[#007e42]'
              }`}>
                {campus.warning ? 'Monitoring Required' : 'No Warning'}
              </div>

              <span className="block text-center text-[8px] font-medium text-[#414042]/60">
                Live update cycle: 30 seconds
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampusSummary;

