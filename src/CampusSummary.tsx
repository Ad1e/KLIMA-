import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import bsuLogo from './assets/bsu-logo.png';
import {
  CloudRain,
  Droplets,
  Wind,
  Eye,
  Thermometer,
  Cloud,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  Info,
  TrendingUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampusWeather {
  name: string;
  rain: number | string;
  humidity: number | string;
  windSpeed: number | string;
  windGust?: number | string;
  rainPossibility: string;
  visibility?: number | string;
  heatIndex: number | string;
  dewpoint?: number | string;
  windDirection?: string;
  cloudCover?: string;
  warning: boolean;
  status: string;
}

interface CampusSummaryProps {
  campusData: CampusWeather[];
  dataSource: 'live' | 'fallback';
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  rain: { monitor: 10, risk: 30, unit: 'mm', label: 'Rainfall', icon: CloudRain, desc: 'Normal: <10mm, Monitor: 10–30mm, Risk: >30mm' },
  humidity: { monitor: 80, risk: 90, unit: '%', label: 'Humidity', icon: Droplets, desc: 'Normal: <80%, Monitor: 80–90%, Risk: >90%' },
  windSpeed: { monitor: 40, risk: 60, unit: 'km/h', label: 'Wind Speed', icon: Wind, desc: 'Normal: <40km/h, Monitor: 40–60km/h, Risk: >60km/h' },
  windGust: { monitor: 50, risk: 80, unit: 'km/h', label: 'Wind Gust', icon: Zap, desc: 'Normal: <50km/h, Monitor: 50–80km/h, Risk: >80km/h' },
  heatIndex: {
    monitor: 32,
    warning: 36,
    danger: 39,
    unit: '°C',
    label: 'Temperature',
    icon: Thermometer,
    desc: 'Normal: <32°C, Monitor: 32–36°C, Warning: 36–39°C, Danger: ≥39°C',
  },
  dewpoint: { monitor: 24, risk: 28, unit: '°C', label: 'Dew Point', icon: Droplets, desc: 'Normal: <24°C, Monitor: 24–28°C, Risk: >28°C' },
  visibility: { monitor: 5, risk: 2, unit: 'km', label: 'Visibility', icon: Eye, invertedLow: true, desc: 'Normal: >5km, Monitor: 2–5km, Risk: <2km' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'monitor' | 'warning' | 'danger' | 'risk';

export function getRiskLevel(value: number | string, key: keyof typeof THRESHOLDS): RiskLevel {
  const v = Number(value);
  const t = THRESHOLDS[key];
  if (!t || isNaN(v)) return 'safe';
  if (key === 'heatIndex') {
    const hi = t as typeof THRESHOLDS['heatIndex'];
    if (v >= hi.danger) return 'danger';
    if (v >= hi.warning) return 'warning';
    if (v >= hi.monitor) return 'monitor';
    return 'safe';
  }
  if ('invertedLow' in t && (t as any).invertedLow) {
    if (v < (t as any).risk) return 'risk';
    if (v < (t as any).monitor) return 'monitor';
    return 'safe';
  }
  if ((t as any).risk !== undefined && v >= (t as any).risk) return 'risk';
  if ((t as any).monitor !== undefined && v >= (t as any).monitor) return 'monitor';
  return 'safe';
}

export function getCardStatus(campus: CampusWeather): { level: RiskLevel; reasons: string[] } {
  const checks: Array<[keyof typeof THRESHOLDS, number | string | undefined]> = [
    ['rain', campus.rain],
    ['humidity', campus.humidity],
    ['windSpeed', campus.windSpeed],
    ['windGust', campus.windGust],
    ['heatIndex', campus.heatIndex],
    ['dewpoint', campus.dewpoint],
    ['visibility', campus.visibility],
  ];
  const priority: RiskLevel[] = ['danger', 'risk', 'warning', 'monitor', 'safe'];
  let found: Partial<Record<RiskLevel, string[]>> = {};
  for (const [key, val] of checks) {
    if (val === undefined || val === null) continue;
    const r = getRiskLevel(val, key);
    if (!found[r]) found[r] = [];
    if (r !== 'safe') found[r]!.push(THRESHOLDS[key].label);
  }
  for (const lvl of priority) {
    if (found[lvl] && found[lvl]!.length > 0) {
      return { level: lvl, reasons: found[lvl]! };
    }
  }
  return { level: 'safe', reasons: [] };
}

// ─── Status Config (Refined Palette) ─────────────────────────────────────────

export const STATUS_CONFIG = {
  safe: {
    label: 'NORMAL',
    icon: CheckCircle2,
    emoji: '✅',
    banner: 'Safe. No action needed.',
    message: 'All metrics within normal range.',
    cardBg: 'bg-green-50',
    border: 'border-green-200',
    leftBorder: '#16a34a',
    badgeBg: 'bg-green-100 border-green-300',
    badgeText: 'text-green-800',
    bannerBg: 'bg-green-50 border-green-200',
    bannerText: 'text-green-800',
    glow: 'shadow-[0_2px_12px_rgba(22,163,74,0.12),0_8px_32px_rgba(22,163,74,0.08)]',
    accent: '#16a34a',
    dotClass: 'bg-green-500',
    pillBg: 'bg-green-600 text-white',
    statBg: 'bg-green-50',
    statDot: '#16a34a',
    statColor: '#15803d',
  },
  warning: {
    label: 'WARNING',
    icon: AlertTriangle,
    emoji: '🟧',
    banner: 'Warning: High temperature. Limit outdoor activity.',
    message: 'Temperature is high. Take extra precautions.',
    cardBg: 'bg-orange-50',
    border: 'border-orange-200',
    leftBorder: '#ea580c',
    badgeBg: 'bg-orange-100 border-orange-300',
    badgeText: 'text-orange-800',
    bannerBg: 'bg-orange-50 border-orange-300',
    bannerText: 'text-orange-800',
    glow: 'shadow-[0_2px_12px_rgba(234,88,12,0.14),0_8px_32px_rgba(234,88,12,0.1)]',
    accent: '#ea580c',
    dotClass: 'bg-orange-500',
    pillBg: 'bg-orange-600 text-white',
    statBg: 'bg-orange-50',
    statDot: '#ea580c',
    statColor: '#c2410c',
  },
  danger: {
    label: 'DANGER',
    icon: AlertOctagon,
    emoji: '🚨',
    banner: 'Danger: Extreme temperature. Avoid exposure.',
    message: 'Critical temperature. Follow safety protocols.',
    cardBg: 'bg-red-50',
    border: 'border-red-200',
    leftBorder: '#dc2626',
    badgeBg: 'bg-red-100 border-red-300',
    badgeText: 'text-red-800',
    bannerBg: 'bg-red-50 border-red-300',
    bannerText: 'text-red-800',
    glow: 'shadow-[0_2px_12px_rgba(220,38,38,0.16),0_8px_32px_rgba(220,38,38,0.12)]',
    accent: '#dc2626',
    dotClass: 'bg-red-500 animate-pulse',
    pillBg: 'bg-red-600 text-white',
    statBg: 'bg-red-50',
    statDot: '#dc2626',
    statColor: '#b91c1c',
  },
  monitor: {
    label: 'MONITOR',
    icon: AlertTriangle,
    emoji: '⚠️',
    banner: 'Monitoring required. Stay alert.',
    message: 'Some metrics need attention.',
    cardBg: 'bg-amber-50',
    border: 'border-amber-200',
    leftBorder: '#d97706',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-800',
    bannerBg: 'bg-amber-50 border-amber-300',
    bannerText: 'text-amber-800',
    glow: 'shadow-[0_2px_12px_rgba(217,119,6,0.14),0_8px_32px_rgba(217,119,6,0.1)]',
    accent: '#d97706',
    dotClass: 'bg-amber-500',
    pillBg: 'bg-amber-600 text-white',
    statBg: 'bg-amber-50',
    statDot: '#d97706',
    statColor: '#b45309',
  },
  risk: {
    label: 'RISK',
    icon: AlertOctagon,
    emoji: '🚨',
    banner: 'Warning: Risk detected. Follow protocols.',
    message: 'Critical thresholds exceeded.',
    cardBg: 'bg-red-50',
    border: 'border-red-200',
    leftBorder: '#dc2626',
    badgeBg: 'bg-red-100 border-red-300',
    badgeText: 'text-red-800',
    bannerBg: 'bg-red-50 border-red-300',
    bannerText: 'text-red-800',
    glow: 'shadow-[0_2px_12px_rgba(220,38,38,0.16),0_8px_32px_rgba(220,38,38,0.12)]',
    accent: '#dc2626',
    dotClass: 'bg-red-500 animate-pulse',
    pillBg: 'bg-red-600 text-white',
    statBg: 'bg-red-50',
    statDot: '#dc2626',
    statColor: '#b91c1c',
  },
};

// ─── Threshold detail for footer messages ─────────────────────────────────────

const THRESHOLD_DETAIL: Partial<Record<keyof typeof THRESHOLDS, {
  getThreshold: (level: RiskLevel) => number | undefined;
  unit: string;
  label: string;
}>> = {
  heatIndex: {
    label: 'Temperature',
    unit: '°C',
    getThreshold: (level) => {
      if (level === 'monitor') return THRESHOLDS.heatIndex.monitor;
      if (level === 'warning') return THRESHOLDS.heatIndex.warning;
      if (level === 'danger') return THRESHOLDS.heatIndex.danger;
      return undefined;
    },
  },
  rain: {
    label: 'Rainfall',
    unit: 'mm',
    getThreshold: (level) => {
      if (level === 'monitor' || level === 'warning') return THRESHOLDS.rain.monitor;
      if (level === 'risk' || level === 'danger') return THRESHOLDS.rain.risk;
      return undefined;
    },
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    getThreshold: (level) => {
      if (level === 'monitor' || level === 'warning') return THRESHOLDS.humidity.monitor;
      if (level === 'risk' || level === 'danger') return THRESHOLDS.humidity.risk;
      return undefined;
    },
  },
  windSpeed: {
    label: 'Wind Speed',
    unit: 'km/h',
    getThreshold: (level) => {
      if (level === 'monitor' || level === 'warning') return THRESHOLDS.windSpeed.monitor;
      if (level === 'risk' || level === 'danger') return THRESHOLDS.windSpeed.risk;
      return undefined;
    },
  },
};

// Map of campus field keys to threshold keys
const CAMPUS_FIELD_TO_THRESHOLD: Array<[keyof CampusWeather, keyof typeof THRESHOLDS]> = [
  ['heatIndex', 'heatIndex'],
  ['rain', 'rain'],
  ['humidity', 'humidity'],
  ['windSpeed', 'windSpeed'],
  ['windGust', 'windGust'],
  ['dewpoint', 'dewpoint'],
  ['visibility', 'visibility'],
];

function getAlertFooterMessage(campus: CampusWeather, level: RiskLevel, reasons: string[]): string | null {
  if (level === 'safe' || reasons.length === 0) return null;
  // Find the first alerting metric with a value
  for (const [field, threshKey] of CAMPUS_FIELD_TO_THRESHOLD) {
    const val = campus[field];
    if (val === undefined || val === null) continue;
    const metricLevel = getRiskLevel(val as number | string, threshKey);
    if (metricLevel !== 'safe') {
      const detail = THRESHOLD_DETAIL[threshKey];
      if (detail) {
        const threshold = detail.getThreshold(metricLevel);
        if (threshold !== undefined) {
          const levelLabel = metricLevel.charAt(0).toUpperCase() + metricLevel.slice(1);
          return `${detail.label} is at ${val}${detail.unit} — exceeds ${levelLabel} threshold (≥${threshold}${detail.unit})`;
        }
      }
      return `${THRESHOLDS[threshKey].label} exceeds ${metricLevel} threshold`;
    }
  }
  return reasons.join(' · ');
}

function getAlertReasonSummary(campus: CampusWeather, level: RiskLevel): string {
  const parts: string[] = [];
  for (const [field, threshKey] of CAMPUS_FIELD_TO_THRESHOLD) {
    const val = campus[field];
    if (val === undefined || val === null) continue;
    const metricLevel = getRiskLevel(val as number | string, threshKey);
    if (metricLevel !== 'safe') {
      const t = THRESHOLDS[threshKey];
      parts.push(`${t.label}: ${val}${t.unit}`);
    }
  }
  return parts.length > 0 ? parts.join(' · ') : level;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{top: number, left: number} | null>(null);

  useLayoutEffect(() => {
    if (show && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + 24
      });
    }
  }, [show]);

  return (
    <span
      ref={iconRef}
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={11} className="cursor-help text-gray-400 hover:text-blue-500 transition-colors" aria-label="Threshold info" />
      {show && tooltipPos && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            fontFamily: "'DM Sans', sans-serif",
          }}
          className="pointer-events-none w-52 rounded-xl border border-gray-200 bg-white/98 px-3 py-2 text-[10px] leading-relaxed text-gray-600 shadow-xl backdrop-blur-md"
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────

interface MetricRowProps {
  metricKey: keyof typeof THRESHOLDS;
  value: number | string | undefined;
  cardLevel: RiskLevel;
}

function MetricRow({ metricKey, value, cardLevel }: MetricRowProps) {
  const t = THRESHOLDS[metricKey];
  const Icon = t.icon;
  const risk = value !== undefined ? getRiskLevel(value, metricKey) : 'safe';
  const isAlert = risk !== 'safe';
  // This metric is the triggering one for the card
  const isTrigger = isAlert && risk === cardLevel;

  const alertPillStyles: Record<RiskLevel, string> = {
    safe: '',
    monitor: 'bg-amber-500 text-white',
    warning: 'bg-orange-600 text-white',
    danger: 'bg-red-600 text-white',
    risk: 'bg-red-600 text-white',
  };

  const rowBg: Record<RiskLevel, string> = {
    safe: 'bg-white/60 border-gray-100',
    monitor: 'bg-amber-50 border-amber-200',
    warning: 'bg-orange-50 border-orange-200',
    danger: 'bg-red-50 border-red-200',
    risk: 'bg-red-50 border-red-200',
  };

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 transition-all duration-200 ${rowBg[risk]}`}
      aria-label={`${t.label}: ${value ?? 'N/A'}${t.unit}${isAlert ? ` — ${risk} level` : ''}`}
    >
      {/* Label side */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isTrigger ? (
          <span className="relative flex items-center justify-center w-3 h-3 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${
                risk === 'monitor' ? 'bg-amber-400' :
                risk === 'warning' ? 'bg-orange-500' : 'bg-red-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                risk === 'monitor' ? 'bg-amber-500' :
                risk === 'warning' ? 'bg-orange-600' : 'bg-red-600'
              }`}
            />
          </span>
        ) : (
          <Icon size={12} className={isAlert ? 'text-gray-600' : 'text-gray-400'} aria-hidden="true" />
        )}
        <span className={`text-[10px] font-semibold truncate ${isAlert ? 'text-gray-700' : 'text-gray-500'}`}>
          {t.label}
        </span>
        <Tooltip text={t.desc} />
      </div>

      {/* Value side */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isTrigger ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold font-mono-metric ${alertPillStyles[risk]}`}
          >
            {value !== undefined ? `${value}${t.unit}` : '—'}
          </span>
        ) : (
          <span className={`text-[11px] font-bold font-mono-metric ${isAlert ? 'text-gray-700' : 'text-gray-800'}`}>
            {value !== undefined ? `${value}${t.unit}` : '—'}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Campus Card ──────────────────────────────────────────────────────────────

function CampusCard({ campus }: { campus: CampusWeather }) {
  const [showExtra, setShowExtra] = useState(false);
  const { level, reasons } = getCardStatus(campus);
  const cfg = STATUS_CONFIG[level];
  const StatusIcon = cfg.icon;
  const isAlert = level !== 'safe';

  const primaryMetrics: Array<keyof typeof THRESHOLDS> = ['rain', 'humidity', 'windSpeed', 'heatIndex'];

  const getValue = (key: keyof typeof THRESHOLDS): number | string | undefined => {
    const map: Record<keyof typeof THRESHOLDS, number | string | undefined> = {
      rain: campus.rain,
      humidity: campus.humidity,
      windSpeed: campus.windSpeed,
      windGust: campus.windGust,
      heatIndex: campus.heatIndex,
      dewpoint: campus.dewpoint,
      visibility: campus.visibility,
    };
    return map[key];
  };

  const footerMessage = getAlertFooterMessage(campus, level, reasons);
  const alertReasonSummary = isAlert ? getAlertReasonSummary(campus, level) : '';

  // Basic minis (always shown when !showExtra)
  const basicMinis = [
    { Icon: TrendingUp, label: 'Rain %',  value: campus.rainPossibility ?? '—' },
    { Icon: Compass,    label: 'Wind Dir', value: campus.windDirection    ?? '—' },
    { Icon: Cloud,      label: 'Cloud',    value: campus.cloudCover       ?? '—' },
  ];

  // Extra minis shown when showExtra — same 3-col grid, just different data
  const fmtVal = (v: number | string | undefined, unit: string) =>
    v !== undefined && v !== null ? `${v}${unit}` : '—';

  const extraMinis = [
    {
      Icon: Zap,
      label: 'Wind Gust',
      value: fmtVal(campus.windGust, 'km/h'),
      alert: campus.windGust !== undefined && getRiskLevel(campus.windGust, 'windGust') !== 'safe',
    },
    {
      Icon: Eye,
      label: 'Visibility',
      value: fmtVal(campus.visibility, 'km'),
      alert: campus.visibility !== undefined && getRiskLevel(campus.visibility, 'visibility') !== 'safe',
    },
    {
      Icon: Droplets,
      label: 'Dew Point',
      value: fmtVal(campus.dewpoint, '°C'),
      alert: campus.dewpoint !== undefined && getRiskLevel(campus.dewpoint, 'dewpoint') !== 'safe',
    },
  ];

  const currentMinis = showExtra ? extraMinis : basicMinis;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border ${cfg.cardBg} ${cfg.border} ${cfg.glow} flex flex-col transition-all duration-300 hover:scale-[1.012] hover:shadow-lg`}
      aria-label={`Campus card for ${campus.name}, status: ${cfg.label}`}
    >
      {/* ── Left accent bar ── */}
      <div
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl"
        style={{ background: cfg.leftBorder }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <div className="flex items-center gap-3 pl-5 pr-4 pt-4 pb-3">
        <div className="relative shrink-0" aria-hidden="true">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
            style={{ boxShadow: `0 0 0 2px ${cfg.leftBorder}40, 0 2px 8px rgba(0,0,0,0.08)` }}
          >
            <img src={bsuLogo} alt="BSU Logo" className="h-7 w-7 object-contain" />
          </div>
          <span
            className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${cfg.dotClass}`}
            style={{ boxShadow: `0 0 6px ${cfg.leftBorder}80` }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[12px] font-extrabold leading-tight tracking-tight text-gray-800" title={campus.name}>
            {campus.name}
          </h3>
          <p className="mt-0.5 text-[9px] font-medium text-gray-400">Batangas State University</p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 ${cfg.badgeBg}`}
          role="status"
        >
          <StatusIcon size={10} className={cfg.badgeText} aria-hidden="true" />
          <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.badgeText}`}>{cfg.label}</span>
        </div>
      </div>

      {/* ── Alert / normal banner ── */}
      <div className="mx-4 mb-3">
        {isAlert ? (
          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${cfg.bannerBg}`}>
            <StatusIcon size={11} style={{ color: cfg.accent, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <p className="text-[10px] font-semibold text-gray-700 leading-snug">
              <span className="font-black" style={{ color: cfg.accent }}>Alert: </span>
              {alertReasonSummary}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50/60 px-3 py-2">
            <CheckCircle2 size={11} className="text-green-600 shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-gray-500 font-medium">{cfg.message}</p>
          </div>
        )}
      </div>

      {/* ── Primary metrics 2×2 grid ── */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
        {primaryMetrics.map(key => (
          <MetricRow key={key} metricKey={key} value={getValue(key)} cardLevel={level} />
        ))}
      </div>

      {/* ── Swappable 3-col mini grid — NEVER changes the card height ── */}
      <div className="mx-4 mb-2 grid grid-cols-3 gap-1.5">
        {currentMinis.map(({ Icon, label, value, ...rest }) => {
          const isAlertMini = 'alert' in rest ? (rest as { alert: boolean }).alert : false;
          return (
            <div
              key={label}
              className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 px-1 shadow-sm transition-colors duration-200 ${
                isAlertMini
                  ? `${cfg.statBg} border-[${cfg.leftBorder}]/30`
                  : 'border-gray-200 bg-white/70'
              }`}
            >
              <Icon size={10} style={{ color: isAlertMini ? cfg.accent : cfg.accent }} aria-hidden="true" />
              <span className="text-[8px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
              <span
                className={`text-[11px] font-black font-mono-metric ${
                  isAlertMini ? cfg.statColor : 'text-gray-800'
                }`}
                style={isAlertMini ? { color: cfg.accent } : {}}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Toggle button — swaps content, never resizes the card ── */}
      <button
        onClick={() => setShowExtra(p => !p)}
        className="mx-4 mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white/60 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:border-gray-300"
        aria-pressed={showExtra}
      >
        <ChevronDown
          size={11}
          className="transition-transform duration-300"
          style={{ transform: showExtra ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
        {showExtra ? 'Basic View' : 'More Details'}
      </button>

      {/* ── Footer ── */}
      <div
        className={`flex items-center justify-center gap-1.5 border-t px-4 py-2 ${cfg.bannerBg}`}
        role="note"
      >
        {isAlert ? (
          <>
            <span className="text-[10px] shrink-0" aria-hidden="true">⚠</span>
            <p className={`text-[9px] font-semibold leading-snug text-center ${cfg.bannerText}`}>
              {footerMessage}
            </p>
          </>
        ) : (
          <>
            <span className="text-[10px]" aria-hidden="true">{cfg.emoji}</span>
            <p className={`text-[9px] font-black uppercase tracking-[0.12em] ${cfg.bannerText}`}>
              {cfg.banner}
            </p>
          </>
        )}
      </div>
    </article>
  );
}

// ─── Summary Stats Bar ────────────────────────────────────────────────────────

function SummaryStatsBar({ campusData }: { campusData: CampusWeather[] }) {
  const safeCount    = campusData.filter(c => getCardStatus(c).level === 'safe').length;
  const monitorCount = campusData.filter(c => getCardStatus(c).level === 'monitor').length;
  const warningCount = campusData.filter(c => getCardStatus(c).level === 'warning').length;
  const dangerCount  = campusData.filter(c => getCardStatus(c).level === 'danger').length;

  const total = campusData.length || 1;

  const stats = [
    { label: 'SAFE',    count: safeCount,    color: '#15803d', bg: 'rgba(22,163,74,0.08)',   dot: '#16a34a', bar: '#16a34a', hasTint: safeCount > 0 },
    { label: 'MONITOR', count: monitorCount, color: '#b45309', bg: 'rgba(217,119,6,0.08)',   dot: '#d97706', bar: '#d97706', hasTint: monitorCount > 0 },
    { label: 'WARNING', count: warningCount, color: '#c2410c', bg: 'rgba(234,88,12,0.08)',   dot: '#ea580c', bar: '#ea580c', hasTint: warningCount > 0 },
    { label: 'DANGER',  count: dangerCount,  color: '#b91c1c', bg: 'rgba(220,38,38,0.08)',   dot: '#dc2626', bar: '#dc2626', hasTint: dangerCount > 0 },
  ];

  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      role="region"
      aria-label="Campus status overview"
    >
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 px-5 py-2.5">
        <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-gray-500">
          Campus Status Overview
        </p>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[9.5px] font-bold text-gray-500">
          {total} sites monitored
        </span>
      </div>

      {/* Stat columns */}
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        {stats.map(item => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1.5 px-4 py-4 transition-colors"
            style={{ background: item.hasTint ? item.bg : 'transparent' }}
          >
            {/* Label + dot */}
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.dot, boxShadow: `0 0 5px ${item.dot}99` }}
                aria-hidden="true"
              />
              <span className="text-[9px] font-black uppercase tracking-[0.13em]" style={{ color: item.color }}>
                {item.label}
              </span>
            </div>

            {/* Count — monospace, large */}
            <p className="text-[2.2rem] font-black leading-none font-mono-metric" style={{ color: item.color }}>
              {item.count}
            </p>

            {/* Animated progress bar */}
            <div className="h-[4px] w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(item.count > 0 ? 4 : 0, (item.count / total) * 100)}%`,
                  background: item.bar,
                  transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CampusSummary({ campusData, dataSource }: CampusSummaryProps) {
  return (
    <section aria-label="Campus Risk Summary" className="mb-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-gray-800">Campus Overview</h2>
          <p className="text-[11px] text-gray-500">{campusData.length} campuses monitored</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            dataSource === 'live'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              dataSource === 'live' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          {dataSource === 'live' ? 'Live Data' : 'Fallback'}
        </span>
      </div>

      <SummaryStatsBar campusData={campusData} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {campusData.map((campus, idx) => (
          <CampusCard key={campus.name + '-' + idx} campus={campus} />
        ))}
      </div>
    </section>
  );
}