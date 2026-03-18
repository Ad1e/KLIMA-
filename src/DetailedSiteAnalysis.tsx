import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Eye,
  Flame,
  Gauge,
  RefreshCw,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import ForecastChart from './components/ForecastChart';
import { CAMPUSES } from './services/weather';
import { forecastData } from './data/forecastData';

type AnalysisTab = 'observed' | 'forecast' | 'synopsis';
type Severity = 'safe' | 'caution' | 'warning';
type ForecastScenario = 'baseline' | 'rain-heavy' | 'windy';
type ForecastHorizon = 6 | 12 | 24;

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  severity: Severity;
}

const SITE_CAMPUSES = [...CAMPUSES.map((campus) => campus.name)];
const ALANGILAN_CENTER: [number, number] = [13.784295, 121.07428];

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
  className: 'rounded-full border-2 border-white shadow-[0_6px_18px_rgba(15,23,42,0.35)] bg-white',
});

function CampusViewportController() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(
      CAMPUSES.map((campus) => [campus.lat, campus.lon] as [number, number]),
      { padding: [40, 40], maxZoom: 11, animate: false },
    );
  }, [map]);

  return null;
}

const synopsisActions = [
  { parameter: 'Strong Wind Gusts', action: 'Avoid outdoor scaffold work near open areas.' },
  { parameter: 'Moderate Rainfall Bands', action: 'Caution on low-lying campus roads and pathways.' },
  { parameter: 'Class Operations', action: 'Resume regular classes with advisory-level monitoring.' },
  { parameter: 'Laboratory Activities', action: 'Caution for equipment setup in exposed facilities.' },
];

const getActionClass = (action: string): string => {
  const normalized = action.toLowerCase();
  if (normalized.includes('resume')) {
    return 'bg-emerald-500 text-white';
  }
  if (normalized.includes('avoid') || normalized.includes('caution')) {
    return 'bg-amber-500 text-white';
  }
  return 'bg-slate-500 text-white';
};

const getSeverityClass = (severity: Severity): string => {
  if (severity === 'warning') return 'bg-orange-500';
  if (severity === 'caution') return 'bg-amber-400';
  return 'bg-emerald-500';
};

function MetricCard({ label, value, icon: Icon, severity }: MetricCardProps) {
  return (
    <article className={`rounded-2xl p-4 text-white shadow-sm ${getSeverityClass(severity)}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">{label}</p>
        <Icon size={16} className="text-white/90" />
      </div>
      <p className="text-2xl font-black leading-none">{value}</p>
    </article>
  );
}

export default function DetailedSiteAnalysis() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('observed');
  const [selectedCampus, setSelectedCampus] = useState(SITE_CAMPUSES[0]);
  const [showLegend, setShowLegend] = useState(true);
  const [forecastScenario, setForecastScenario] = useState<ForecastScenario>('baseline');
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>(24);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const latestObserved = useMemo(() => forecastData[3], []);

  const observedMetrics = [
    {
      label: 'Rain (mm)',
      value: `${latestObserved.rain.toFixed(2)} mm`,
      icon: CloudRain,
      severity: latestObserved.rain > 1 ? 'warning' : latestObserved.rain > 0 ? 'caution' : 'safe',
    },
    {
      label: 'Rain Probability (%)',
      value: `${latestObserved.chanceRain.toFixed(0)} %`,
      icon: CloudRain,
      severity: latestObserved.chanceRain > 65 ? 'warning' : latestObserved.chanceRain > 35 ? 'caution' : 'safe',
    },
    {
      label: 'MSLP (hPa)',
      value: `${latestObserved.pressure.toFixed(0)} hPa`,
      icon: Gauge,
      severity: latestObserved.pressure < 1009 ? 'warning' : latestObserved.pressure < 1011 ? 'caution' : 'safe',
    },
    {
      label: 'Humidity (%)',
      value: `${latestObserved.humidity.toFixed(0)} %`,
      icon: Droplets,
      severity: latestObserved.humidity > 85 ? 'warning' : latestObserved.humidity > 75 ? 'caution' : 'safe',
    },
    {
      label: 'Temperature (degC)',
      value: `${latestObserved.temp.toFixed(2)} degC`,
      icon: Thermometer,
      severity: latestObserved.temp > 32 ? 'warning' : latestObserved.temp > 30 ? 'caution' : 'safe',
    },
    {
      label: 'Dewpoint (degC)',
      value: '24.10 degC',
      icon: Thermometer,
      severity: 'caution',
    },
    {
      label: 'Heat Index (degC)',
      value: '36.20 degC',
      icon: Flame,
      severity: 'warning',
    },
    {
      label: 'Wind Direction (deg)',
      value: '128 deg',
      icon: Compass,
      severity: 'caution',
    },
    {
      label: 'Wind Gust (kph)',
      value: `${latestObserved.gust.toFixed(1)} kph`,
      icon: Wind,
      severity: latestObserved.gust > 30 ? 'warning' : latestObserved.gust > 18 ? 'caution' : 'safe',
    },
    {
      label: 'Wind Speed (kph)',
      value: `${latestObserved.wind.toFixed(1)} kph`,
      icon: Wind,
      severity: latestObserved.wind > 20 ? 'warning' : latestObserved.wind > 14 ? 'caution' : 'safe',
    },
    {
      label: 'Visibility (km)',
      value: '8.40 km',
      icon: Eye,
      severity: 'safe',
    },
    {
      label: 'Cloud Cover (%)',
      value: '58 %',
      icon: Cloud,
      severity: 'caution',
    },
  ] as const;

  const scenarioAdjustedForecast = useMemo(() => {
    const multipliers =
      forecastScenario === 'rain-heavy'
        ? { rain: 1.35, wind: 1.08, gust: 1.12, humidity: 1.05, pressureDelta: -1.2 }
        : forecastScenario === 'windy'
          ? { rain: 0.9, wind: 1.28, gust: 1.35, humidity: 1.02, pressureDelta: -0.7 }
          : { rain: 1, wind: 1, gust: 1, humidity: 1, pressureDelta: 0 };

    const pointsToShow = Math.max(2, Math.min(forecastData.length, Math.floor(forecastHorizon / 3)));
    return forecastData.slice(0, pointsToShow).map((point) => ({
      ...point,
      rain: Number((point.rain * multipliers.rain).toFixed(2)),
      wind: Math.round(point.wind * multipliers.wind),
      gust: Math.round(point.gust * multipliers.gust),
      humidity: Math.min(99, Math.round(point.humidity * multipliers.humidity)),
      pressure: Number((point.pressure + multipliers.pressureDelta).toFixed(1)),
      chanceRain: Math.min(99, Math.round(point.chanceRain * multipliers.rain)),
    }));
  }, [forecastScenario, forecastHorizon]);

  const forecastKpis = useMemo(() => {
    const maxRain = Math.max(...scenarioAdjustedForecast.map((point) => point.rain));
    const maxGust = Math.max(...scenarioAdjustedForecast.map((point) => point.gust));
    const avgHumidity =
      scenarioAdjustedForecast.reduce((sum, point) => sum + point.humidity, 0) /
      scenarioAdjustedForecast.length;
    const riskScore = Math.min(100, Math.round(maxRain * 18 + maxGust * 1.35 + avgHumidity * 0.25));
    return { maxRain, maxGust, avgHumidity: Math.round(avgHumidity), riskScore };
  }, [scenarioAdjustedForecast]);

  const currentWeather = scenarioAdjustedForecast[0];
  const lookAheadTimeline = scenarioAdjustedForecast.slice(0, Math.min(6, scenarioAdjustedForecast.length));
  const updatedLabel = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scenarioLabel = forecastScenario === 'rain-heavy' ? 'Rain Heavy' : forecastScenario === 'windy' ? 'Windy' : 'Baseline';
  const plainLanguageSummary =
    forecastKpis.maxRain > 2.5
      ? 'Moderate to heavy rain is possible. Plan for wet roads and slower movement around campus.'
      : forecastKpis.maxRain > 0.8
        ? 'Light to moderate rain is possible. Keep classes and activities weather-aware.'
        : 'Low rainfall expected. Conditions are generally manageable for normal operations.';
  const immediateOutlook =
    forecastKpis.maxGust > 35 ? 'Strong wind gusts possible' : forecastKpis.maxGust > 22 ? 'Noticeable wind at times' : 'Light to moderate wind expected';

  return (
    <div className="min-h-full bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <select
              value={selectedCampus}
              onChange={(event) => setSelectedCampus(event.target.value)}
              className="w-fit rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-rose-400"
            >
              {SITE_CAMPUSES.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
                Batangas State University - {selectedCampus} Risk Assessment
              </h1>
              <p className="mt-1 text-sm text-slate-600">Detailed Site Analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {[
                { key: 'observed' as const, label: 'Observed' },
                { key: 'forecast' as const, label: 'Forecast' },
                { key: 'synopsis' as const, label: 'Synopsis' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                    activeTab === tab.key
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {activeTab === 'synopsis' ? (
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Weather Synopsis</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                The campus is under a humid and unsettled weather regime with intermittent rain cells and variable
                wind flow from the east to southeast. Temperatures remain moderate-to-warm by mid-day with occasional
                rainfall spikes that may reduce visibility and increase localized runoff near low elevation pathways.
                Continue advisory monitoring for changing precipitation trends and wind gust episodes.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-12 border-b border-slate-100 text-xs font-bold uppercase tracking-[0.12em]">
                <div className="col-span-4 bg-rose-700 px-4 py-3 text-white">Parameter</div>
                <div className="col-span-8 bg-slate-50 px-4 py-3 text-slate-600">Action</div>
              </div>

              <div className="divide-y divide-slate-100">
                {synopsisActions.map((item) => (
                  <div key={item.parameter} className="grid grid-cols-12">
                    <div className="col-span-4 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {item.parameter}
                    </div>
                    <div className="col-span-8 px-4 py-3">
                      <span className={`inline-block rounded-lg px-3 py-1.5 text-xs font-semibold ${getActionClass(item.action)}`}>
                        {item.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : activeTab === 'observed' ? (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Current Observation</h2>
              <p className="mt-1 text-sm text-slate-600">Local map and field metrics for BatStateU Alangilan Campus</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-4 lg:col-span-7">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-[520px] w-full">
                    <MapContainer
                      center={ALANGILAN_CENTER}
                      zoom={9}
                      zoomControl={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <CampusViewportController />
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="&copy; Esri"
                      />
                      {CAMPUSES.map((campus) => (
                        <Marker key={campus.name} position={[campus.lat, campus.lon]} icon={bsuCampusIcon} zIndexOffset={1000}>
                          <Popup>
                            <div className="space-y-1 text-xs">
                              <p className="font-semibold text-slate-700">{campus.name}</p>
                              <p className="text-slate-500">
                                {campus.lat.toFixed(6)}, {campus.lon.toFixed(6)}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                      <CircleMarker
                        center={ALANGILAN_CENTER}
                        radius={8}
                        pathOptions={{ color: '#be123c', fillColor: '#f43f5e', fillOpacity: 0.8, weight: 2 }}
                      >
                        <Popup>
                          <p className="text-xs font-semibold">BatStateU Alangilan Campus</p>
                        </Popup>
                      </CircleMarker>
                      <ZoomControl position="bottomright" />
                    </MapContainer>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    onClick={() => setShowLegend((prev) => !prev)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Legend</span>
                    {showLegend ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                  </button>

                  {showLegend ? (
                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 sm:grid-cols-3">
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Safe</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" /> Caution</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> Warning</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {observedMetrics.map((metric) => (
                    <MetricCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      icon={metric.icon}
                      severity={metric.severity}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Simple Forecast View</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Easy-to-read outlook for the next {forecastHorizon} hours</h2>
                  <p className="mt-2 text-sm text-slate-600">{plainLanguageSummary}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Choose forecast type</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'baseline' as const, label: 'Normal' },
                      { key: 'rain-heavy' as const, label: 'Rainy' },
                      { key: 'windy' as const, label: 'Windy' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setForecastScenario(item.key)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                          forecastScenario === item.key
                            ? 'bg-rose-700 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[6, 12, 24].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setForecastHorizon(hours as ForecastHorizon)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      forecastHorizon === hours
                        ? 'bg-sky-700 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Next {hours}h
                  </button>
                ))}
                <span className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <RefreshCw size={13} /> Updated {updatedLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Rain Outlook</p>
                <p className="mt-2 text-2xl font-black text-blue-700">{forecastKpis.maxRain.toFixed(1)} mm max</p>
                <p className="mt-1 text-xs text-slate-500">Highest rainfall expected in a 3-hour period</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Wind Outlook</p>
                <p className="mt-2 text-2xl font-black text-amber-700">{forecastKpis.maxGust} kph gust</p>
                <p className="mt-1 text-xs text-slate-500">{immediateOutlook}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Current Snapshot</p>
                <p className="mt-2 text-2xl font-black text-slate-800">{currentWeather.temp.toFixed(1)} degC</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{scenarioLabel} scenario • {currentWeather.chanceRain}% rain chance</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-4 xl:col-span-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">What This Means</p>
                  <CloudSun size={18} className="text-amber-500" />
                </div>
                <p className="text-3xl font-black text-slate-900">{currentWeather.temp.toFixed(1)} degC</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{currentWeather.condition}</p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">Quick guidance</p>
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">
                    {plainLanguageSummary}
                  </p>
                </div>
              </div>

              <div className="col-span-12 md:col-span-8 xl:col-span-9">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <ForecastChart
                    title="Rainfall Forecast"
                    subtitle={`Next ${forecastHorizon} hours (mm)`}
                    data={scenarioAdjustedForecast}
                    xKey="time"
                    unit="mm"
                    series={[{ key: 'rain', label: 'Rainfall', color: '#2563eb' }]}
                  />
                  <ForecastChart
                    title="Wind Speed vs Gust"
                    subtitle={`Scenario: ${forecastScenario.replace('-', ' ')}`}
                    data={scenarioAdjustedForecast}
                    xKey="time"
                    unit="kph"
                    series={[
                      { key: 'wind', label: 'Wind Speed', color: '#0ea5e9' },
                      { key: 'gust', label: 'Wind Gust', color: '#f97316' },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-slate-700">Next Periods</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {lookAheadTimeline.slice(0, 4).map((point) => (
                  <article key={`mini-outlook-${point.time}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">{point.time}</p>
                      {point.rain > 1 ? <CloudRain size={15} className="text-blue-600" /> : <Cloud size={15} className="text-slate-500" />}
                    </div>
                    <p className="text-xs text-slate-600">Rain: <span className="font-bold text-slate-800">{point.chanceRain}%</span></p>
                    <p className="text-xs text-slate-600">Wind: <span className="font-bold text-slate-800">{point.wind} kph</span></p>
                    <p className="text-xs text-slate-600">Temp: <span className="font-bold text-slate-800">{point.temp.toFixed(1)} degC</span></p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-blue-50 p-4 text-sm text-slate-700">
              <p className="font-bold text-slate-900">How to read this section</p>
              <p className="mt-1">1) Choose a weather type (Normal, Rainy, Windy).</p>
              <p>2) Choose how far ahead you want to see (6h, 12h, 24h).</p>
              <p>3) Check Rain Outlook and Wind Outlook first, then review charts for details.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
