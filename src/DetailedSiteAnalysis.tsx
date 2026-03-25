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
// Map tile URLs for different modes
const TILES = {
  street:    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const MAP_MODES = [
  { key: 'street', label: 'Street', icon: <Eye size={12} /> },
  { key: 'satellite', label: 'Satellite', icon: <MoonStar size={12} /> },
  { key: 'dark', label: 'Dark', icon: <Flame size={12} /> },
];

type MapMode = 'street' | 'satellite' | 'dark';

// Risk ring config (simplified from RiskMap)
const RISK_RING: Record<string, { color: string; glow: string }> = {
  safe:    { color: '#009748', glow: '0 0 8px 2px #00974855' },
  monitor: { color: '#fbaf26', glow: '0 0 8px 2px #fbaf2655' },
  warning: { color: '#ff922b', glow: '0 0 8px 2px #ff922b55' },
  danger:  { color: '#d2232a', glow: '0 0 10px 3px #d2232a77' },
  risk:    { color: '#d2232a', glow: '0 0 10px 3px #d2232a77' },
};

function createRiskIcon(level: string, selected: boolean): L.DivIcon {
  const cfg = RISK_RING[level] || RISK_RING.safe;
  const size = selected ? 44 : 36;
  const border = selected ? 4 : 2.5;
  const glow = selected ? `0 0 16px 4px ${cfg.color}77` : cfg.glow;
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: white;
        border: ${border}px solid ${cfg.color};
        box-shadow: ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;">
        <img src='${bsuLogo}' alt='BSU' style="width: ${size - 8}px; height: ${size - 8}px; object-fit: contain; border-radius: 50%;" />
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
import ForecastChart from './components/ForecastChart';
import type { RiskLevel } from './CampusSummary';


// CampusSummary color config
import { STATUS_CONFIG, getCardStatus } from './CampusSummary';


import { CAMPUSES, fetchOpenMeteoForecast } from './services/weather';
import type { CampusWeather } from './services/weather';
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
    return 'bg-[#007e42] text-white';
  }
  if (normalized.includes('avoid') || normalized.includes('caution')) {
    return 'bg-[#fbaf26] text-white';
  }
  return 'bg-[#911d1f] text-white';
};

const getActionTheme = (action: string): { tone: string; ring: string; icon: LucideIcon } => {
  const normalized = action.toLowerCase();

  if (normalized.includes('resume')) {
    return {
      tone: 'from-[#007e42]/16 to-[#009748]/18 text-[#007e42]',
      ring: 'ring-[#007e42]/28',
      icon: CloudSun,
    };
  }

  if (normalized.includes('avoid')) {
    return {
      tone: 'from-[#d2232a]/14 to-[#d2232a]/16 text-[#911d1f]',
      ring: 'ring-[#d2232a]/30',
      icon: AlertTriangle,
    };
  }

  if (normalized.includes('caution')) {
    return {
      tone: 'from-[#fbaf26]/20 to-[#fbaf26]/22 text-[#fbaf26]',
      ring: 'ring-[#fbaf26]/34',
      icon: Wind,
    };
  }

  return {
    tone: 'from-white to-[#d2232a]/12 text-[#414042]',
    ring: 'ring-[#d2232a]/20',
    icon: Sparkles,
  };
};



const parseForecastHour = (timeLabel: string): number | null => {
  const simpleMatch = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
  if (simpleMatch) {
    const hour = Number(simpleMatch[1]);
    return Number.isFinite(hour) ? hour : null;
  }

  const meridiemMatch = timeLabel.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (meridiemMatch) {
    const rawHour = Number(meridiemMatch[1]);
    const meridiem = meridiemMatch[3].toUpperCase();

    if (!Number.isFinite(rawHour) || rawHour < 1 || rawHour > 12) {
      return null;
    }

    if (meridiem === 'AM') {
      return rawHour % 12;
    }

    return rawHour % 12 + 12;
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
  // Use CampusSummary logic for color
  let risk: RiskLevel = 'safe';
  if (severity === 'warning') risk = 'warning';
  else if (severity === 'caution') risk = 'monitor';
  else risk = 'safe';
  const cfg = STATUS_CONFIG[risk];
  return (
    <article
      className={`h-full rounded-xl border ${cfg.border} bg-gradient-to-br ${cfg.gradient} ${cfg.glow} p-3 shadow-sm`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#414042]/70">{label}</p>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-lg font-black leading-none ${cfg.badgeText}`}>{value}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${cfg.badgeBg} ${cfg.badgeText}`}>
          <Icon size={14} />
        </span>
      </div>
    </article>
  );
}

export default function DetailedSiteAnalysis() {
  const [mapMode, setMapMode] = useState<MapMode>('street');
  const [selectedCampusMarker, setSelectedCampusMarker] = useState<string | null>(null);
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

    const poller = window.setInterval(() => {
      void loadForecast();
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(poller);
    };
  }, [selectedCampus]);

  const latestObserved = useMemo(() => {
    const fallbackPoint = forecastData[Math.min(3, forecastData.length - 1)];
    if (forecastSeries.length === 0) return fallbackPoint;
    return forecastSeries[Math.min(3, forecastSeries.length - 1)] ?? fallbackPoint;
  }, [forecastSeries]);

  // Calculate dewpoint and heat index if possible
  function computeDewPoint(tempC: number, humidityPct: number): number {
    return tempC - (100 - humidityPct) / 5;
  }
  function computeHeatIndex(tempC: number, humidityPct: number): number {
    // Rothfusz regression (approximate, valid for T >= 27°C, RH >= 40%)
    if (tempC < 27 || humidityPct < 40) return tempC;
    const T = tempC;
    const R = humidityPct;
    return (
      -8.78469475556 +
      1.61139411 * T +
      2.33854883889 * R +
      -0.14611605 * T * R +
      -0.012308094 * T * T +
      -0.0164248277778 * R * R +
      0.002211732 * T * T * R +
      0.00072546 * T * R * R +
      -0.000003582 * T * T * R * R
    );
  }
  // scenarioAdjustedForecast and currentWeather must be defined first

  // Only declared once after forecastKpis

  // Use currentWeather for all metrics, handle missing fields gracefully
  const observedMetrics = [
    {
      label: 'Rain (mm)',
      value: `${currentWeather.rain.toFixed(2)} mm`,
      icon: CloudRain,
      severity: currentWeather.rain > 1 ? 'warning' : currentWeather.rain > 0 ? 'caution' : 'safe',
    },
    {
      label: 'Rain Probability (%)',
      value: `${currentWeather.chanceRain.toFixed(0)} %`,
      icon: CloudRain,
      severity: currentWeather.chanceRain > 65 ? 'warning' : currentWeather.chanceRain > 35 ? 'caution' : 'safe',
    },
    {
      label: 'MSLP (hPa)',
      value: `${currentWeather.pressure.toFixed(0)} hPa`,
      icon: Gauge,
      severity: currentWeather.pressure < 1009 ? 'warning' : currentWeather.pressure < 1011 ? 'caution' : 'safe',
    },
    {
      label: 'Humidity (%)',
      value: `${currentWeather.humidity.toFixed(0)} %`,
      icon: Droplets,
      severity: currentWeather.humidity > 85 ? 'warning' : currentWeather.humidity > 75 ? 'caution' : 'safe',
    },
    {
      label: 'Temperature (degC)',
      value: `${currentWeather.temp.toFixed(2)} degC`,
      icon: Thermometer,
      severity: currentWeather.temp > 32 ? 'warning' : currentWeather.temp > 30 ? 'caution' : 'safe',
    },
    {
      label: 'Dewpoint (degC)',
      value: `${computeDewPoint(currentWeather.temp, currentWeather.humidity).toFixed(2)} degC`,
      icon: Thermometer,
      severity: 'caution',
    },
    {
      label: 'Heat Index (degC)',
      value: `${computeHeatIndex(currentWeather.temp, currentWeather.humidity).toFixed(2)} degC`,
      icon: Flame,
      severity: computeHeatIndex(currentWeather.temp, currentWeather.humidity) > 38 ? 'warning' : computeHeatIndex(currentWeather.temp, currentWeather.humidity) > 33 ? 'caution' : 'safe',
    },
    {
      label: 'Wind Direction (deg)',
      value: currentWeather.wind !== undefined ? `${currentWeather.wind.toFixed(0)} deg` : 'N/A',
      icon: Compass,
      severity: 'caution',
    },
    {
      label: 'Wind Gust (kph)',
      value: `${currentWeather.gust.toFixed(1)} kph`,
      icon: Wind,
      severity: currentWeather.gust > 30 ? 'warning' : currentWeather.gust > 18 ? 'caution' : 'safe',
    },
    {
      label: 'Wind Speed (kph)',
      value: `${currentWeather.wind.toFixed(1)} kph`,
      icon: Wind,
      severity: currentWeather.wind > 20 ? 'warning' : currentWeather.wind > 14 ? 'caution' : 'safe',
    },
    {
      label: 'Visibility (km)',
      value: (currentWeather as any).visibility !== undefined ? `${(currentWeather as any).visibility} km` : 'N/A',
      icon: Eye,
      severity: 'safe',
    },
    {
      label: 'Cloud Cover (%)',
      value: (currentWeather as any).cloudCover !== undefined ? `${(currentWeather as any).cloudCover} %` : 'N/A',
      icon: Cloud,
      severity: 'caution',
    },
  ] as const;

  // Only declared once after scenarioAdjustedForecast

  const scenarioAdjustedForecast = useMemo(() => {
    const multipliers =
      forecastScenario === 'rain-heavy'
        ? { rain: 1.35, wind: 1.08, gust: 1.12, humidity: 1.05, pressureDelta: -1.2 }
        : forecastScenario === 'windy'
          ? { rain: 0.9, wind: 1.28, gust: 1.35, humidity: 1.02, pressureDelta: -0.7 }
          : { rain: 1, wind: 1, gust: 1, humidity: 1, pressureDelta: 0 };

    // Include the starting hour plus each 6-hour step (e.g., 12h => 0, 6, 12 = 3 points).
    const pointsToShow = Math.max(2, Math.min(forecastSeries.length, Math.floor(forecastHorizon / 6) + 1));
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
  const horizon24Data = scenarioAdjustedForecast.slice(0, Math.min(5, scenarioAdjustedForecast.length));
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
        color: 'text-[#d2232a]',
      },
      {
        label: 'Wind Exposure',
        value: `${forecastKpis.maxGust} kph`,
        caption: 'Projected highest wind gust',
        color: 'text-[#fbaf26]',
      },
      {
        label: 'Humidity Load',
        value: `${forecastKpis.avgHumidity}%`,
        caption: 'Average moisture concentration',
        color: 'text-[#006193]',
      },
      {
        label: 'Risk Score',
        value: `${forecastKpis.riskScore}`,
        caption: 'Scenario-adjusted impact index',
        color: 'text-[#911d1f]',
      },
    ],
    [forecastKpis],
  );

  const observedKpis = useMemo(
    () => [
      {
        label: 'Live Rainfall',
        value: `${currentWeather.rain.toFixed(2)} mm`,
        caption: 'Most recent measured precipitation',
        color: 'text-[#d2232a]',
      },
      {
        label: 'Rain Probability',
        value: `${currentWeather.chanceRain.toFixed(0)}%`,
        caption: 'Chance of rainfall in current cycle',
        color: 'text-[#006193]',
      },
      {
        label: 'Wind Gust',
        value: `${currentWeather.gust.toFixed(1)} kph`,
        caption: 'Peak observed gust speed',
        color: 'text-[#fbaf26]',
      },
      {
        label: 'Heat Index',
        value: `${computeHeatIndex(currentWeather.temp, currentWeather.humidity).toFixed(2)} degC`,
        caption: 'Thermal stress indicator',
        color: 'text-[#911d1f]',
      },
    ],
    [currentWeather],
  );

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#ffffff_0%,#fff5f6_100%)] px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <select
              value={selectedCampus}
              onChange={(event) => setSelectedCampus(event.target.value)}
              className="w-fit rounded-xl border border-[#d2232a]/20 bg-white px-3 py-2 text-xs font-semibold text-[#414042] shadow-sm outline-none transition-colors focus:border-[#d2232a]"
            >
              {SITE_CAMPUSES.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#414042] lg:text-3xl">
                Batangas State University - {selectedCampus} Risk Assessment
              </h1>
              <p className="mt-1 text-sm text-[#414042]/80">Detailed Site Analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-[#d2232a]/20 bg-white p-1 shadow-sm">
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
                      ? 'bg-[#911d1f] text-white'
                      : 'text-[#414042]/75 hover:bg-[#d2232a]/12 hover:text-[#911d1f]'
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
            <div className="overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white shadow-[0_18px_50px_rgba(65,64,66,0.12)]">
              <div
                className={`relative overflow-hidden bg-gradient-to-br p-5 text-white ${weatherSummaryTheme.bg}`}
              >
                <div className={`absolute inset-0 ${weatherSummaryTheme.overlay}`} />
                <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#006193]/16 blur-xl" />
                <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[#006193]/16 blur-xl" />

                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-[#414042]/40 bg-[#414042]/10 px-3 py-1.5">
                      <AlertTriangle size={14} className="text-white" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">Weather Synopsis</p>
                    </div>

                    <p className="text-sm leading-relaxed text-white/95">
                      {selectedCampus} is currently experiencing a humid and unsettled pattern with intermittent rain
                      cells and shifting easterly to southeasterly winds. Short visibility dips and localized surface
                      runoff are possible during heavier bursts. Keep advisory-level monitoring active, particularly for
                      low-lying walkways and open corridors exposed to gusts.
                    </p>

                    <div className="rounded-2xl border border-[#414042]/35 bg-[#414042]/10 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/82">Operational Note</p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-white">{weatherStatus}</p>
                    </div>
                  </div>

                  <div className="grid min-w-[240px] grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-xl border border-[#414042]/40 bg-[#414042]/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/78">Rain Chance</p>
                      <p className="mt-1 text-xl font-black text-white">{currentWeather.chanceRain}%</p>
                    </div>
                    <div className="rounded-xl border border-[#414042]/40 bg-[#414042]/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/78">Peak Gust</p>
                      <p className="mt-1 text-xl font-black text-white">{forecastKpis.maxGust} kph</p>
                    </div>
                    <div className="rounded-xl border border-[#414042]/40 bg-[#414042]/10 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/78">Risk Score</p>
                      <p className="mt-1 text-xl font-black text-white">{forecastKpis.riskScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-[#d2232a]/15 bg-gradient-to-r from-white to-[#d2232a]/10 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {synopsisSignals.map((signal) => (
                  <article key={signal.label} className="rounded-2xl border border-[#d2232a]/20 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">{signal.label}</p>
                    <p className={`mt-1 text-2xl font-black ${signal.color}`}>{signal.value}</p>
                    <p className="mt-1 text-[11px] font-medium text-[#414042]/70">{signal.caption}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#d2232a]/20 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#d2232a]" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#414042]">Action Matrix</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-[#d2232a]/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#414042]/80">
                    Advisory Level
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d2232a]/20 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#414042]/80">
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
                      className={`rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br p-4 shadow-sm ring-1 ${theme.tone} ${theme.ring}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">Parameter</p>
                          <p className="mt-1 text-sm font-bold text-[#414042]">{item.parameter}</p>
                        </div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#d2232a]/15 text-[#911d1f]">
                          <Icon size={15} />
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-2">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d2232a]" />
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
            <div className="rounded-3xl border border-[#d2232a]/20 bg-gradient-to-r from-white to-[#d2232a]/10 p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00818e]/20 text-[#006193]">
                    <Eye size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]/70">Observed Conditions</p>
                    <p className="text-sm font-semibold text-[#414042]">Live field metrics and map state for {selectedCampus}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#d2232a]/20 bg-white px-3 py-2 text-xs font-semibold text-[#414042]/80 shadow-sm">
                    <CloudSun size={13} /> {currentWeather.condition}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#d2232a]/20 bg-white px-3 py-2 text-xs font-semibold text-[#414042]/80 shadow-sm">
                    <RefreshCw size={13} /> Updated {updatedLabel}
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm ${
                      isLiveForecast
                        ? 'border-[#00818e]/38 bg-[#00818e]/16 text-[#006193]'
                        : 'border-[#d2232a]/20 bg-white text-[#414042]/80'
                    }`}
                  >
                    {isLiveForecast ? 'Live Open-Meteo' : 'Fallback Dataset'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {observedKpis.map((item) => (
                <article key={item.label} className="rounded-2xl border border-[#d2232a]/20 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">{item.label}</p>
                  <p className={`mt-2 text-3xl font-black ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-[#414042]/70">{item.caption}</p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-7">
                <div className="flex h-[660px] flex-col overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white shadow-sm">
                  <div className="border-b border-[#d2232a]/15 bg-gradient-to-r from-white to-[#d2232a]/10 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]/70">Campus Map View</p>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-[#d2232a]/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#414042]/80">
                        <span className="h-2 w-2 rounded-full bg-[#009748]" />
                        Sensor feed online
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 relative">
                    <MapContainer
                      center={ALANGILAN_CENTER}
                      zoom={9}
                      zoomControl={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      {/* Map mode buttons inside map box, top left */}
                      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
                        <div className="flex gap-2 rounded-full border border-[#d2232a]/20 bg-white/92 p-1 backdrop-blur-md">
                          {MAP_MODES.map((mode) => (
                            <button
                              key={mode.key}
                              onClick={() => setMapMode(mode.key as MapMode)}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors ${
                                mapMode === mode.key
                                  ? 'bg-[#911d1f] text-white'
                                  : 'text-[#911d1f] hover:bg-[#d2232a]/10'
                              }`}
                            >
                              {mode.icon} {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <CampusViewportController />
                      <TileLayer
                        url={TILES[mapMode]}
                        attribution="&copy; Esri & OpenStreetMap contributors"
                      />
                      {/* Use fallback data to get CampusWeather for risk logic */}
                      {/* Only use live API data for campus markers. Render markers elsewhere with live data. */}
                      <CircleMarker
                        center={ALANGILAN_CENTER}
                        radius={8}
                        pathOptions={{ color: '#911d1f', fillColor: '#d2232a', fillOpacity: 0.8, weight: 2 }}
                      >
                        <Popup>
                          <p className="text-xs font-semibold">BatStateU Alangilan Campus</p>
                        </Popup>
                      </CircleMarker>
                      <ZoomControl position="bottomright" />
                    </MapContainer>
                  </div>

                  <div className="border-t border-[#d2232a]/15">
                    <button
                      onClick={() => setShowLegend((prev) => !prev)}
                      className="flex w-full items-center justify-between bg-gradient-to-r from-white to-[#d2232a]/10 px-4 py-3 text-left"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]">Legend</span>
                      {showLegend ? <ChevronUp size={15} className="text-[#414042]/70" /> : <ChevronDown size={15} className="text-[#414042]/70" />}
                    </button>

                    {showLegend ? (
                      <div className="grid grid-cols-1 gap-3 border-t border-[#d2232a]/15 px-4 py-3 text-xs font-semibold text-[#414042] sm:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-lg border border-[#009748]/30 bg-[#009748]/14 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-[#009748]" /> Safe
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-[#fbaf26]/30 bg-[#fbaf26]/16 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-[#fbaf26]" /> Caution
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-[#d2232a]/30 bg-[#d2232a]/16 px-2.5 py-2">
                          <span className="h-3 w-3 rounded-full bg-[#d2232a]" /> Warning
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="flex h-[660px] flex-col overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white shadow-sm">
                  <div className="border-b border-[#d2232a]/15 bg-gradient-to-r from-white to-[#d2232a]/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]/70">Metric Panel</p>
                      <span className="rounded-lg border border-[#d2232a]/20 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#414042]/80">
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
            <div className="rounded-3xl border border-[#d2232a]/20 bg-gradient-to-r from-white to-[#d2232a]/10 p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d2232a]/20 text-[#911d1f]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]/70">Predictive Controls</p>
                    <p className="text-sm font-semibold text-[#414042]">Tune scenario and horizon for planning simulations</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-xl border border-[#d2232a]/20 bg-white p-1 shadow-sm">
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
                            ? 'bg-[#911d1f] text-white'
                            : 'text-[#414042]/75 hover:bg-[#d2232a]/12 hover:text-[#911d1f]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex rounded-xl border border-[#d2232a]/20 bg-white p-1 shadow-sm">
                    {[6, 12, 24].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setForecastHorizon(hours as ForecastHorizon)}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
                          forecastHorizon === hours
                            ? 'bg-[#911d1f] text-white'
                            : 'text-[#414042]/75 hover:bg-[#d2232a]/12 hover:text-[#911d1f]'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#d2232a]/20 bg-white px-3 py-2 text-xs font-semibold text-[#414042]/80 shadow-sm">
                    <RefreshCw size={13} /> Updated {updatedLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#d2232a]/20 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">Forecast Risk Score</p>
                <p className="mt-2 text-3xl font-black text-[#911d1f]">{forecastKpis.riskScore}</p>
                <p className="mt-1 text-xs text-[#414042]/70">Scenario-adjusted storm impact index</p>
              </div>
              <div className="rounded-2xl border border-[#d2232a]/20 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">Peak Rainfall</p>
                <p className="mt-2 text-3xl font-black text-[#d2232a]">{forecastKpis.maxRain.toFixed(1)} mm</p>
                <p className="mt-1 text-xs text-[#414042]/70">Highest expected 6-hour precipitation</p>
              </div>
              <div className="rounded-2xl border border-[#d2232a]/20 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#414042]/70">Peak Wind Gust</p>
                <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black text-[#fbaf26]">
                  <TrendingUp size={22} /> {forecastKpis.maxGust} kph
                </p>
                <p className="mt-1 text-xs text-[#414042]/70">Maximum projected gust for selected horizon</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-[#d2232a]/20 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]/70">Weather Summary</p>
                  <WeatherSummaryIcon size={18} className={weatherSummaryTheme.iconClass} />
                </div>

                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_12px_30px_rgba(65,64,66,0.22)] ${weatherSummaryTheme.bg}`}
                >
                  <div className={`absolute inset-0 ${weatherSummaryTheme.overlay}`} />
                  <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#006193]/16 blur-xl" />
                  <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[#006193]/16 blur-xl" />

                  <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/85">Current Condition</p>
                  <p className="mt-2 text-4xl font-black">{currentWeather.temp.toFixed(1)} degC</p>
                  <p className="mt-1 text-sm font-semibold text-white/95">{currentWeather.condition}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/82">{weatherSummaryTheme.label}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#414042]/10 px-2 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/78">Rain Chance</p>
                      <p className="text-sm font-black">{currentWeather.chanceRain}%</p>
                    </div>
                    <div className="rounded-lg bg-[#414042]/10 px-2 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/78">Wind Gust</p>
                      <p className="text-sm font-black">{currentWeather.gust} kph</p>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#d2232a]/20 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#414042]/70">Operational Note</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-[#414042]">{weatherStatus}</p>
                </div>
              </div>


              <ForecastChart
                title="Rainfall Forecast"
                subtitle={`Next ${forecastHorizon} hours (mm)`}
                data={scenarioAdjustedForecast}
                xKey="time"
                unit="mm"
                series={[
                  {
                    key: 'rain',
                    label: 'Rainfall',
                    color: '#009748',
                  },
                ]}
              />


              <ForecastChart
                title="Wind Speed & Gust"
                subtitle={`Scenario: ${forecastScenario.replace('-', ' ')}`}
                data={scenarioAdjustedForecast}
                xKey="time"
                unit="kph"
                series={[
                  {
                    key: 'wind',
                    label: 'Wind Speed',
                    color: '#009748',
                  },
                  {
                    key: 'gust',
                    label: 'Wind Gust',
                    color: '#009748',
                  },
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
                series={[
                  {
                    key: 'rain',
                    label: '24h Rainfall',
                    color: '#009748',
                  },
                ]}
              />


              <ForecastChart
                title="Wind Speed and Gust Outlook (24h)"
                subtitle="Expected wind behavior for the next 24 hours"
                data={horizon24Data}
                xKey="time"
                unit="kph"
                series={[
                  {
                    key: 'wind',
                    label: 'Wind Speed',
                    color: '#009748',
                  },
                  {
                    key: 'gust',
                    label: 'Wind Gust',
                    color: '#009748',
                  },
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
                series={[
                  {
                    key: 'humidity',
                    label: 'Humidity',
                    color: '#009748',
                  },
                ]}
              />
              <ForecastChart
                title="Atmospheric Pressure Trend"
                subtitle="Pressure shifts (hPa)"
                data={scenarioAdjustedForecast}
                xKey="time"
                unit="hPa"
                chartType="area"
                yDomain={[1006, 1014]}
                series={[
                  {
                    key: 'pressure',
                    label: 'Pressure',
                    color: '#009748',
                  },
                ]}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}



