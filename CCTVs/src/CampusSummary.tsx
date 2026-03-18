import { useEffect, useState } from 'react';
import { AlertCircle, Droplets } from 'lucide-react';
import {
  fetchCampusWeather,
  getFallbackCampusWeather,
  hasWeatherApiKey,
  type CampusWeather,
} from './services/weather';

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

const CampusSummary = () => {
  const [campusData, setCampusData] = useState<CampusWeather[]>(getFallbackCampusWeather());
  const [dataSource, setDataSource] = useState<'fallback' | 'live'>(hasWeatherApiKey() ? 'live' : 'fallback');

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      try {
        const data = await fetchCampusWeather();
        if (!isMounted) return;
        setCampusData(data);
        setDataSource(hasWeatherApiKey() ? 'live' : 'fallback');
      } catch {
        if (!isMounted) return;
        setCampusData(getFallbackCampusWeather());
        setDataSource('fallback');
      }
    };

    void loadWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
          Campus Parameters
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            dataSource === 'live'
              ? 'border-red-300/40 bg-red-500/20 text-red-100'
              : 'border-red-200/40 bg-red-900/30 text-red-200'
          }`}
        >
          {dataSource === 'live' ? 'Live API Data' : 'Fallback Data'}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {campusData.map((campus) => (
          <div
            key={campus.name}
            className="group rounded-3xl border border-red-100/70 bg-gradient-to-br from-white/95 to-red-50/35 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-red-300/70 hover:shadow-[0_20px_48px_rgba(185,28,28,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-red-100/70 bg-gradient-to-r from-red-500/7 to-transparent px-5 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-800">{campus.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {campus.warning ? (
                    <AlertCircle size={12} className="shrink-0 text-red-600" />
                  ) : (
                    <Droplets size={12} className="shrink-0 text-red-500" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                    {campus.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rain</p>
                <p className="text-2xl font-black text-slate-900">
                  {campus.rain}{' '}
                  <span className="text-xs font-bold text-slate-600">mm</span>
                </p>
                <p className="text-[10px] text-slate-500">Possibility: {campus.rainPossibility}</p>
              </div>

              <div className="h-px bg-gradient-to-r from-red-200/40 to-transparent" />

              <div className="grid grid-cols-2 gap-2">
                {metricItems.map((metric) => {
                  const value = campus[metric.key];
                  const cellClass =
                    metric.key === 'cloudCover'
                      ? 'col-span-2 rounded-xl border border-red-100/70 bg-white/80 p-2'
                      : 'rounded-xl border border-red-100/70 bg-white/80 p-2';
                  return (
                    <div key={`${campus.name}-${metric.key}`} className={cellClass}>
                      <p className="text-[9px] font-bold uppercase text-slate-600">{metric.label}</p>
                      <p className="text-sm font-black text-slate-800">
                        {value}
                        {metric.unit ? <span className="ml-1 text-[10px] font-semibold">{metric.unit}</span> : null}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-red-200/70 bg-gradient-to-r from-red-100 to-red-50 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-red-700">
                {campus.warning ? 'Monitoring Required' : 'No Warning'}
              </div>

              <span className="block text-center text-[8px] font-medium text-slate-400">
                Live update cycle: 2 mins
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampusSummary;
