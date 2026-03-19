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
  MoonStar,
  Flame,
  Gauge,
  RefreshCw,
  Sparkles,
  Thermometer,
  TrendingUp,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import ForecastChart from './components/ForecastChart';
import { CAMPUSES, fetchOpenMeteoForecast } from './services/weather';
import { forecastData } from './data/forecastData';

type AnalysisTab = 'observed' | 'forecast' | 'synopsis';
type Severity = 'safe' | 'caution' | 'warning';
type ForecastScenario = 'baseline' | 'rain-heavy' | 'windy';
type ForecastHorizon = 6 | 12 | 24;
type WeatherBackground = 'sunny' | 'cloudy' | 'rainy' | 'night';

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

const getActionTheme = (action: string): { tone: string; ring: string; icon: LucideIcon } => {
  const normalized = action.toLowerCase();

  if (normalized.includes('resume')) {
    return {
      tone: 'from-emerald-50 to-emerald-100/80 text-emerald-800',
      ring: 'ring-emerald-200/70',
      icon: CloudSun,
    };
  }

  if (normalized.includes('avoid')) {
    return {
      tone: 'from-rose-50 to-orange-100/80 text-rose-800',
      ring: 'ring-rose-200/80',
      icon: AlertTriangle,
    };
  }

  if (normalized.includes('caution')) {
    return {
      tone: 'from-amber-50 to-orange-100/80 text-amber-800',
      ring: 'ring-amber-200/80',
      icon: Wind,
    };
  }

  return {
    tone: 'from-slate-50 to-slate-100 text-slate-700',
    ring: 'ring-slate-200',
    icon: Sparkles,
  };
};

const getMetricTone = (severity: Severity): { badge: string; iconWrap: string; value: string; bg: string } => {
  if (severity === 'warning') {
    return {
      badge: 'bg-orange-100 text-orange-700',
      iconWrap: 'bg-orange-100 text-orange-700',
      value: 'text-orange-700',
      bg: 'from-white to-orange-50/60',
    };
  }

  if (severity === 'caution') {
    return {
      badge: 'bg-amber-100 text-amber-700',
      iconWrap: 'bg-amber-100 text-amber-700',
      value: 'text-amber-700',
      bg: 'from-white to-amber-50/60',
    };
  }

  return {
    badge: 'bg-emerald-100 text-emerald-700',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
    bg: 'from-white to-emerald-50/60',
  };
};

const parseForecastHour = (timeLabel: string): number | null => {
  const simpleMatch = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
  if (simpleMatch) {
    const hour = Number(simpleMatch[1]);
    return Number.isFinite(hour) ? hour : null;
  }

  const parsed = new Date(`1970-01-01T${timeLabel}`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getHours();
};

const getBackgroundFromData = (isDay: number, weatherCode: number): WeatherBackground => {
  if (isDay === 0) {
    return 'night';
  }

  switch (weatherCode) {
    case 0:
      return 'sunny';
    case 1:
    case 2:
    case 3:
    case 45:
    case 48:
      return 'cloudy';
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
    case 95:
    case 96:
    case 99:
      return 'rainy';
    default:
      return 'cloudy';
  }
};

function MetricCard({ label, value, icon: Icon, severity }: MetricCardProps) {
  const tone = getMetricTone(severity);

  return (
    <article
      className={`h-full rounded-xl border border-slate-200 bg-gradient-to-br p-3 shadow-sm ${tone.bg}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${tone.badge}`}>
          {severity}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className={`text-lg font-black leading-none ${tone.value}`}>{value}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone.iconWrap}`}>
          <Icon size={14} />
        </span>
      </div>
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
  const [forecastSeries, setForecastSeries] = useState(forecastData);
  const [isLiveForecast, setIsLiveForecast] = useState(false);
  const [currentIsDay, setCurrentIsDay] = useState<boolean | null>(null);
  const [daylightDurationSeconds, setDaylightDurationSeconds] = useState<number | null>(null);
  const [currentWeatherCode, setCurrentWeatherCode] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const campus = CAMPUSES.find((item) => item.name === selectedCampus);
    if (!campus) {
      return () => {
        isMounted = false;
      };
    }

    const loadForecast = async () => {
      try {
        const liveForecast = await fetchOpenMeteoForecast(campus.lat, campus.lon);
        if (!isMounted) return;
        setForecastSeries(liveForecast.points);
        setCurrentIsDay(liveForecast.currentIsDay);
        setDaylightDurationSeconds(liveForecast.daylightDurationSeconds);
        setCurrentWeatherCode(liveForecast.currentWeatherCode);
        setIsLiveForecast(true);
        setLastUpdated(new Date());
      } catch {
        if (!isMounted) return;
        setForecastSeries(forecastData);
        setCurrentIsDay(null);
        setDaylightDurationSeconds(null);
        setCurrentWeatherCode(null);
        setIsLiveForecast(false);
      }
    };

    void loadForecast();

    return () => {
      isMounted = false;
    };
  }, [selectedCampus]);

  const latestObserved = useMemo(() => {
    const fallbackPoint = forecastData[Math.min(3, forecastData.length - 1)];
    if (forecastSeries.length === 0) return fallbackPoint;
    return forecastSeries[Math.min(3, forecastSeries.length - 1)] ?? fallbackPoint;
  }, [forecastSeries]);

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

    const pointsToShow = Math.max(2, Math.min(forecastSeries.length, Math.floor(forecastHorizon / 3)));
    return forecastSeries.slice(0, pointsToShow).map((point) => ({
      ...point,
      rain: Number((point.rain * multipliers.rain).toFixed(2)),
      wind: Math.round(point.wind * multipliers.wind),
      gust: Math.round(point.gust * multipliers.gust),
      humidity: Math.min(99, Math.round(point.humidity * multipliers.humidity)),
      pressure: Number((point.pressure + multipliers.pressureDelta).toFixed(1)),
      chanceRain: Math.min(99, Math.round(point.chanceRain * multipliers.rain)),
    }));
  }, [forecastScenario, forecastHorizon, forecastSeries]);

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
  const updatedLabel = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const horizon24Data = scenarioAdjustedForecast.slice(0, Math.min(8, scenarioAdjustedForecast.length));
  const weatherStatus =
    currentWeather.chanceRain >= 70
      ? 'High chance of rainfall and possible operational delays.'
      : currentWeather.chanceRain >= 45
        ? 'Moderate chance of showers. Prepare flexible activity plans.'
        : 'Lower rainfall risk. Standard campus operations are likely suitable.';

  const weatherSummaryTheme = useMemo(() => {
    const hour = parseForecastHour(currentWeather.time);
    const fallbackIsDay = hour !== null ? (hour >= 5 && hour < 18 ? 1 : 0) : 1;
    const isDayFlag = currentIsDay === null ? fallbackIsDay : currentIsDay ? 1 : 0;

    const fallbackWeatherCode = (() => {
      const normalized = currentWeather.condition.toLowerCase();
      if (normalized.includes('thunder')) return 95;
      if (normalized.includes('rain')) return 61;
      if (normalized.includes('cloud')) return 3;
      return 0;
    })();

    const resolvedWeatherCode = currentWeatherCode ?? fallbackWeatherCode;
    const background = getBackgroundFromData(isDayFlag, resolvedWeatherCode);

    if (background === 'night') {
      return {
        bg: 'from-slate-950 via-indigo-950 to-slate-900',
        overlay: 'bg-[radial-gradient(circle_at_18%_15%,rgba(148,163,184,0.32),transparent_36%),radial-gradient(circle_at_85%_5%,rgba(99,102,241,0.3),transparent_42%)]',
        icon: MoonStar,
        iconClass: 'text-indigo-200',
        label:
          daylightDurationSeconds !== null
            ? `Night Conditions - Daylight ${Math.round(daylightDurationSeconds / 3600)}h`
            : 'Night Conditions',
      };
    }

    if (background === 'rainy') {
      return {
        bg: 'from-slate-900 via-slate-800 to-sky-950',
        overlay: 'bg-[radial-gradient(circle_at_18%_15%,rgba(56,189,248,0.26),transparent_34%),radial-gradient(circle_at_84%_5%,rgba(59,130,246,0.2),transparent_38%)]',
        icon: CloudRain,
        iconClass: 'text-cyan-200',
        label: 'Rain Bands Present',
      };
    }

    if (background === 'cloudy') {
      return {
        bg: 'from-slate-800 via-slate-700 to-slate-900',
        overlay: 'bg-[radial-gradient(circle_at_20%_15%,rgba(148,163,184,0.22),transparent_35%),radial-gradient(circle_at_82%_5%,rgba(203,213,225,0.16),transparent_40%)]',
        icon: Cloud,
        iconClass: 'text-slate-100',
        label: 'Cloud Cover Dominant',
      };
    }

    return {
      bg: 'from-sky-600 via-cyan-500 to-amber-400',
      overlay: 'bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.3),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(253,224,71,0.4),transparent_40%)]',
      icon: CloudSun,
      iconClass: 'text-amber-100',
      label:
        daylightDurationSeconds !== null
          ? `Sunny Window - Daylight ${Math.round(daylightDurationSeconds / 3600)}h`
          : 'Sunny Window',
    };
  }, [currentWeather, currentIsDay, daylightDurationSeconds, currentWeatherCode]);

  const WeatherSummaryIcon = weatherSummaryTheme.icon;

  const synopsisSignals = useMemo(
    () => [
      {
        label: 'Rainfall Outlook',
        value: `${forecastKpis.maxRain.toFixed(1)} mm`,
        caption: 'Maximum rainfall within selected horizon',
        color: 'text-blue-700',
      },
      {
        label: 'Wind Exposure',
        value: `${forecastKpis.maxGust} kph`,
        caption: 'Projected highest wind gust',
        color: 'text-amber-700',
      },
      {
        label: 'Humidity Load',
        value: `${forecastKpis.avgHumidity}%`,
        caption: 'Average moisture concentration',
        color: 'text-teal-700',
      },
      {
        label: 'Risk Score',
        value: `${forecastKpis.riskScore}`,
        caption: 'Scenario-adjusted impact index',
        color: 'text-rose-700',
      },
    ],
    [forecastKpis],
  );

  const observedKpis = useMemo(
    () => [
      {
        label: 'Live Rainfall',
        value: `${latestObserved.rain.toFixed(2)} mm`,
        caption: 'Most recent measured precipitation',
        color: 'text-blue-700',
      },
      {
        label: 'Rain Probability',
        value: `${latestObserved.chanceRain.toFixed(0)}%`,
        caption: 'Chance of rainfall in current cycle',
        color: 'text-cyan-700',
      },
      {
        label: 'Wind Gust',
        value: `${latestObserved.gust.toFixed(1)} kph`,
        caption: 'Peak observed gust speed',
        color: 'text-amber-700',
      },
      {
        label: 'Heat Index',
        value: '36.20 degC',
        caption: 'Thermal stress indicator',
        color: 'text-rose-700',
      },
    ],
    [latestObserved],
  );

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
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 p-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5">
                      <AlertTriangle size={14} className="text-rose-200" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">Weather Synopsis</p>
                    </div>

                    <p className="text-sm leading-relaxed text-white/90">
                      {selectedCampus} is currently experiencing a humid and unsettled pattern with intermittent rain
                      cells and shifting easterly to southeasterly winds. Short visibility dips and localized surface
                      runoff are possible during heavier bursts. Keep advisory-level monitoring active, particularly for
                      low-lying walkways and open corridors exposed to gusts.
                    </p>

                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">Operational Note</p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-white/95">{weatherStatus}</p>
                    </div>
                  </div>

                  <div className="grid min-w-[240px] grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Rain Chance</p>
                      <p className="mt-1 text-xl font-black text-cyan-200">{currentWeather.chanceRain}%</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Peak Gust</p>
                      <p className="mt-1 text-xl font-black text-amber-200">{forecastKpis.maxGust} kph</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Risk Score</p>
                      <p className="mt-1 text-xl font-black text-rose-200">{forecastKpis.riskScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-200/70 bg-gradient-to-r from-white to-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {synopsisSignals.map((signal) => (
                  <article key={signal.label} className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{signal.label}</p>
                    <p className={`mt-1 text-2xl font-black ${signal.color}`}>{signal.value}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">{signal.caption}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-rose-600" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Action Matrix</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Advisory Level
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    <RefreshCw size={11} />
                    Updated {updatedLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {synopsisActions.map((item) => {
                  const theme = getActionTheme(item.action);
                  const Icon = theme.icon;

                  return (
                    <article
                      key={item.parameter}
                      className={`rounded-2xl border border-slate-200 bg-gradient-to-br p-4 shadow-sm ring-1 ${theme.tone} ${theme.ring}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Parameter</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{item.parameter}</p>
                        </div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-slate-700">
                          <Icon size={15} />
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                        <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${getActionClass(item.action)}`}>
                          {item.action}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : activeTab === 'observed' ? (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <Eye size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Observed Conditions</p>
                    <p className="text-sm font-semibold text-slate-700">Live field metrics and map state for {selectedCampus}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                    <CloudSun size={13} /> {currentWeather.condition}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                    <RefreshCw size={13} /> Updated {updatedLabel}
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm ${
                      isLiveForecast
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isLiveForecast ? 'Live Open-Meteo' : 'Fallback Dataset'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {observedKpis.map((item) => (
                <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-3xl font-black ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.caption}</p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-7">
                <div className="flex h-[660px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Campus Map View</p>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Sensor feed online
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
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

                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => setShowLegend((prev) => !prev)}
                      className="flex w-full items-center justify-between bg-gradient-to-r from-white to-slate-50 px-4 py-3 text-left"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Legend</span>
                      {showLegend ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                    </button>

                    {showLegend ? (
                      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 sm:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-emerald-500" /> Safe
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-amber-400" /> Caution
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-orange-500" /> Warning
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="flex h-[660px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Metric Panel</p>
                      <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                        12 Indicators
                      </span>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden p-3">
                    <div className="grid h-full grid-cols-2 grid-rows-6 gap-2">
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
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Predictive Controls</p>
                    <p className="text-sm font-semibold text-slate-700">Tune scenario and horizon for planning simulations</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {[
                      { key: 'baseline' as const, label: 'Baseline' },
                      { key: 'rain-heavy' as const, label: 'Rain Heavy' },
                      { key: 'windy' as const, label: 'Windy' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setForecastScenario(item.key)}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                          forecastScenario === item.key
                            ? 'bg-rose-700 text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {[6, 12, 24].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setForecastHorizon(hours as ForecastHorizon)}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                          forecastHorizon === hours
                            ? 'bg-sky-700 text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                    <RefreshCw size={13} /> Updated {updatedLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Forecast Risk Score</p>
                <p className="mt-2 text-3xl font-black text-rose-700">{forecastKpis.riskScore}</p>
                <p className="mt-1 text-xs text-slate-500">Scenario-adjusted storm impact index</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Peak Rainfall</p>
                <p className="mt-2 text-3xl font-black text-blue-700">{forecastKpis.maxRain.toFixed(1)} mm</p>
                <p className="mt-1 text-xs text-slate-500">Highest expected 3-hour precipitation</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Peak Wind Gust</p>
                <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black text-amber-700">
                  <TrendingUp size={22} /> {forecastKpis.maxGust} kph
                </p>
                <p className="mt-1 text-xs text-slate-500">Maximum projected gust for selected horizon</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Weather Summary</p>
                  <WeatherSummaryIcon size={18} className={weatherSummaryTheme.iconClass} />
                </div>

                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] ${weatherSummaryTheme.bg}`}
                >
                  <div className={`absolute inset-0 ${weatherSummaryTheme.overlay}`} />
                  <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                  <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />

                  <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">Current Condition</p>
                  <p className="mt-2 text-4xl font-black">{currentWeather.temp.toFixed(1)} degC</p>
                  <p className="mt-1 text-sm font-semibold text-white/90">{currentWeather.condition}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/75">{weatherSummaryTheme.label}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/10 px-2 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">Rain Chance</p>
                      <p className="text-sm font-black">{currentWeather.chanceRain}%</p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-2 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">Wind Gust</p>
                      <p className="text-sm font-black">{currentWeather.gust} kph</p>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Operational Note</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{weatherStatus}</p>
                </div>
              </div>

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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ForecastChart
                title="Rainfall Outlook (24h)"
                subtitle="Expected rainfall trend for the next 24 hours"
                data={horizon24Data}
                xKey="time"
                unit="mm"
                chartType="area"
                series={[{ key: 'rain', label: '24h Rainfall', color: '#2563eb' }]}
              />

              <ForecastChart
                title="Wind Speed and Gust Outlook (24h)"
                subtitle="Expected wind behavior for the next 24 hours"
                data={horizon24Data}
                xKey="time"
                unit="kph"
                series={[
                  { key: 'wind', label: 'Wind Speed', color: '#0ea5e9' },
                  { key: 'gust', label: 'Wind Gust', color: '#f97316' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ForecastChart
                title="Relative Humidity Trend"
                subtitle="Atmospheric moisture behavior"
                data={scenarioAdjustedForecast}
                xKey="time"
                unit="%"
                chartType="area"
                yDomain={[65, 95]}
                series={[{ key: 'humidity', label: 'Humidity', color: '#14b8a6' }]}
              />
              <ForecastChart
                title="Atmospheric Pressure Trend"
                subtitle="Pressure shifts (hPa)"
                data={scenarioAdjustedForecast}
                xKey="time"
                unit="hPa"
                chartType="area"
                yDomain={[1006, 1014]}
                series={[{ key: 'pressure', label: 'Pressure', color: '#0f766e' }]}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
