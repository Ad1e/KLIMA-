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
  ChevronUp,
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
  // Four-level threshold for heatIndex
  heatIndex: {
    monitor: 32, // yellow
    warning: 36, // orange
    danger: 39, // red
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
  // Priority order from highest to lowest
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

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  safe: {
    label: 'Normal',
    icon: CheckCircle2,
    emoji: '✅',
    banner: 'Safe. No action needed.',
    message: 'All metrics within normal range.',
    gradient: 'from-[#f0fff4] via-white to-[#e6f7f0]',
    border: 'border-[#009748]/30',
    badgeBg: 'bg-[#009748]/12 border-[#009748]/40',
    badgeText: 'text-[#007e42]',
    bannerBg: 'bg-[#009748]/10 border-[#009748]/30',
    bannerText: 'text-[#007e42]',
    glow: 'shadow-[0_0_0_1px_rgba(0,151,72,0.15),0_20px_60px_rgba(0,151,72,0.1)]',
    accent: '#009748',
    dot: 'bg-[#009748]',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    emoji: '🟧',
    banner: 'Warning: High temperature. Limit outdoor activity.',
    message: 'Temperature is high. Take extra precautions.',
    gradient: 'from-[#fff4e6] via-white to-[#ffe8cc]',
    border: 'border-[#ff922b]/40',
    badgeBg: 'bg-[#ff922b]/14 border-[#ff922b]/50',
    badgeText: 'text-[#b85c00]',
    bannerBg: 'bg-[#ff922b]/12 border-[#ff922b]/35',
    bannerText: 'text-[#b85c00]',
    glow: 'shadow-[0_0_0_1px_rgba(255,146,43,0.2),0_20px_60px_rgba(255,146,43,0.12)]',
    accent: '#ff922b',
    dot: 'bg-[#ff922b]',
  },
  danger: {
    label: 'Danger',
    icon: AlertOctagon,
    emoji: '🚨',
    banner: 'Danger: Extreme temperature. Avoid exposure.',
    message: 'Critical temperature. Follow safety protocols.',
    gradient: 'from-[#fff5f5] via-white to-[#ffe4e4]',
    border: 'border-[#d2232a]/35',
    badgeBg: 'bg-[#d2232a]/12 border-[#d2232a]/45',
    badgeText: 'text-[#911d1f]',
    bannerBg: 'bg-[#d2232a]/10 border-[#d2232a]/30',
    bannerText: 'text-[#911d1f]',
    glow: 'shadow-[0_0_0_1px_rgba(210,35,42,0.18),0_20px_60px_rgba(210,35,42,0.14)]',
    accent: '#d2232a',
    dot: 'bg-[#d2232a] animate-pulse',
  },
  // fallback for other metrics
  monitor: {
    label: 'Monitor',
    icon: AlertTriangle,
    emoji: '⚠️',
    banner: 'Monitoring required. Stay alert.',
    message: 'Some metrics need attention.',
    gradient: 'from-[#fffde7] via-white to-[#fff176]', // stronger yellow
    border: 'border-[#ffd600]/40',
    badgeBg: 'bg-[#ffd600]/14 border-[#ffd600]/50',
    badgeText: 'text-[#bfa600]',
    bannerBg: 'bg-[#ffd600]/12 border-[#ffd600]/35',
    bannerText: 'text-[#bfa600]',
    glow: 'shadow-[0_0_0_1px_rgba(255,214,0,0.2),0_20px_60px_rgba(255,214,0,0.12)]',
    accent: '#ffd600',
    dot: 'bg-[#ffd600]',
  },
  risk: {
    label: 'Risk',
    icon: AlertOctagon,
    emoji: '🚨',
    banner: 'Warning: Risk detected. Follow protocols.',
    message: 'Critical thresholds exceeded.',
    gradient: 'from-[#fff5f5] via-white to-[#ffe4e4]',
    border: 'border-[#d2232a]/35',
    badgeBg: 'bg-[#d2232a]/12 border-[#d2232a]/45',
    badgeText: 'text-[#911d1f]',
    bannerBg: 'bg-[#d2232a]/10 border-[#d2232a]/30',
    bannerText: 'text-[#911d1f]',
    glow: 'shadow-[0_0_0_1px_rgba(210,35,42,0.18),0_20px_60px_rgba(210,35,42,0.14)]',
    accent: '#d2232a',
    dot: 'bg-[#d2232a] animate-pulse',
  },
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{top: number, left: number} | null>(null);

  useLayoutEffect(() => {
    if (show && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + window.scrollY - 8, // adjust as needed
        left: rect.left + window.scrollX + 24 // adjust as needed
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
      <Info size={11} className="cursor-help text-[#414042]/40 hover:text-[#006193] transition-colors" aria-label="Threshold info" />
      {show && tooltipPos && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
          }}
          className="pointer-events-none w-52 rounded-xl border border-[#414042]/15 bg-white/98 px-3 py-2 text-[10px] leading-relaxed text-[#414042] shadow-xl backdrop-blur-md"
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
}

function MetricRow({ metricKey, value }: MetricRowProps) {
  const t = THRESHOLDS[metricKey];
  const Icon = t.icon;
  const risk = value !== undefined ? getRiskLevel(value, metricKey) : 'safe';
  const isAlert = risk !== 'safe';

  const alertStyles: Record<RiskLevel, string> = {
    safe: 'bg-transparent border-transparent text-[#414042]',
    warning: 'bg-[#ff922b]/10 border-[#ff922b]/35 text-[#b85c00]',
    danger: 'bg-[#d2232a]/8 border-[#d2232a]/30 text-[#911d1f]',
    monitor: 'bg-[#fbaf26]/10 border-[#fbaf26]/35 text-[#92610a]',
    risk: 'bg-[#d2232a]/8 border-[#d2232a]/30 text-[#911d1f]',
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition-all ${alertStyles[risk]}`}
      aria-label={`${t.label}: ${value ?? 'N/A'}${t.unit}${isAlert ? ` — ${risk} level` : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: isAlert ? undefined : '#414042aa' }} aria-hidden="true" />
        <span className={`text-[10px] font-medium ${isAlert ? 'font-semibold' : 'text-[#414042]/70'}`}>{t.label}</span>
        <Tooltip text={t.desc} />
      </div>
      <div className="flex items-center gap-1">
        {isAlert && (
          <span className={`text-[9px] font-bold uppercase tracking-wider ${risk === 'risk' ? 'text-[#d2232a]' : 'text-[#fbaf26]'}`}>
            {risk}
          </span>
        )}
        <span className={`text-xs font-bold ${isAlert ? '' : 'text-black'}`}>
          {value !== undefined ? `${value}${t.unit}` : '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Campus Card ──────────────────────────────────────────────────────────────

function CampusCard({ campus }: { campus: CampusWeather }) {
  const [expanded, setExpanded] = useState(false);
  const { level, reasons } = getCardStatus(campus);
  const cfg = STATUS_CONFIG[level];
  const StatusIcon = cfg.icon;

  const primaryMetrics: Array<keyof typeof THRESHOLDS> = ['rain', 'humidity', 'windSpeed', 'heatIndex'];
  const secondaryMetrics: Array<keyof typeof THRESHOLDS> = ['windGust', 'visibility', 'dewpoint'];

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

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${cfg.gradient} ${cfg.border} ${cfg.glow} flex flex-col transition-all duration-300`}
      aria-label={`Campus card for ${campus.name}, status: ${cfg.label}`}
    >
      {/* Decorative top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cfg.accent}aa, ${cfg.accent}33, transparent)` }} aria-hidden="true" />

      {/* Card body */}
      <div className="flex flex-col gap-3 p-5">

        {/* Campus Identity */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-[#e5e7eb]"
              aria-hidden="true"
            >
              <img src={bsuLogo} alt="BSU Logo" className="h-7 w-7 object-contain" />
            </div>
            <h3 className="truncate text-sm font-extrabold tracking-tight text-[#414042] leading-tight" title={campus.name}>
              {campus.name}
            </h3>
          </div>

          {/* Status Badge */}
          <div
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 ${cfg.badgeBg}`}
            role="status"
            aria-label={`Status: ${cfg.label}`}
          >
            <div className={`h-2 w-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
            <StatusIcon size={11} className={cfg.badgeText} aria-hidden="true" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badgeText}`}>{cfg.label}</span>
          </div>
        </div>

        {/* Reason / Message */}
        <div className="rounded-xl px-3 py-2" style={{ background: `${cfg.accent}0d` }}>
          {reasons.length > 0 ? (
            <p className="text-[11px] font-semibold text-[#414042]">
              <span style={{ color: cfg.accent }}>⚡ Triggered by: </span>
              {reasons.join(', ')}
            </p>
          ) : (
            <p className="text-[11px] text-[#414042]/70">{cfg.message}</p>
          )}
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-1.5">
          {primaryMetrics.map(key => (
            <MetricRow key={key} metricKey={key} value={getValue(key)} />
          ))}
        </div>

        {/* Extra metrics: Rain Possibility, Wind Direction, Cloud Cover */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col items-center rounded-lg border border-[#414042]/10 bg-white/60 py-1.5 px-2 text-center">
            <TrendingUp size={11} className="mb-0.5 text-[#414042]/50" aria-hidden="true" />
            <span className="text-[9px] text-[#414042]/60">Rain %</span>
            <span className="text-[11px] font-bold text-black">{campus.rainPossibility ?? '—'}</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border border-[#414042]/10 bg-white/60 py-1.5 px-2 text-center">
            <Compass size={11} className="mb-0.5 text-[#414042]/50" aria-hidden="true" />
            <span className="text-[9px] text-[#414042]/60">Wind Dir</span>
            <span className="text-[11px] font-bold text-black">{campus.windDirection ?? '—'}</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border border-[#414042]/10 bg-white/60 py-1.5 px-2 text-center">
            <Cloud size={11} className="mb-0.5 text-[#414042]/50" aria-hidden="true" />
            <span className="text-[9px] text-[#414042]/60">Cloud</span>
            <span className="text-[11px] font-bold text-black">{campus.cloudCover ?? '—'}</span>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(p => !p)}
          className="flex items-center justify-center gap-1 rounded-xl border border-[#414042]/12 bg-white/70 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#414042]/60 transition-all hover:bg-white hover:text-[#414042]"
          aria-expanded={expanded}
          aria-controls={`details-${campus.name}`}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide Details' : 'More Details'}
        </button>

        {/* Expanded secondary metrics */}
        {expanded && (
          <div id={`details-${campus.name}`} className="flex flex-col gap-1.5 border-t border-[#414042]/10 pt-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#414042]/50">Additional Metrics</p>
            {secondaryMetrics.map(key => (
              <MetricRow key={key} metricKey={key} value={getValue(key)} />
            ))}
          </div>
        )}
      </div>

      {/* Summary Banner */}
      <div
        className={`mt-auto border-t px-4 py-2.5 ${cfg.bannerBg}`}
        role="note"
        aria-label={`Summary: ${cfg.banner}`}
      >
        <p className={`text-center text-[10px] font-bold uppercase tracking-[0.12em] ${cfg.bannerText}`}>
          {cfg.emoji} {cfg.banner}
        </p>
      </div>
    </article>
  );
}

// ─── Summary Stats Bar ────────────────────────────────────────────────────────

function SummaryStatsBar({ campusData }: { campusData: CampusWeather[] }) {
  const safeCount = campusData.filter(c => getCardStatus(c).level === 'safe').length;
  const monitorCount = campusData.filter(c => getCardStatus(c).level === 'monitor').length;
  const warningCount = campusData.filter(c => getCardStatus(c).level === 'warning').length;
  const dangerCount = campusData.filter(c => getCardStatus(c).level === 'danger').length;

  return (
    <div className="mb-6 grid grid-cols-4 gap-3" role="region" aria-label="Campus status overview">
      {[
        {
          label: 'Safe',
          count: safeCount,
          color: 'text-[#007e42]',
          bg: 'bg-[#009748]/10 border-[#009748]/25',
          dot: 'bg-[#009748]'
        },
        {
          label: 'Monitor',
          count: monitorCount,
          color: 'text-[#92610a]',
          bg: 'bg-[#fbaf26]/10 border-[#fbaf26]/30',
          dot: 'bg-[#fbaf26]'
        },
        {
          label: 'Warning',
          count: warningCount,
          color: 'text-[#b85c00]',
          bg: 'bg-[#ff922b]/10 border-[#ff922b]/25',
          dot: 'bg-[#ff922b]'
        },
        {
          label: 'Danger',
          count: dangerCount,
          color: 'text-[#911d1f]',
          bg: 'bg-[#d2232a]/10 border-[#d2232a]/25',
          dot: 'bg-[#d2232a] animate-pulse'
        },
      ].map(item => (
        <div key={item.label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${item.bg}`}>
          <div className={`h-3 w-3 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
          <div>
            <p className={`text-2xl font-black leading-none ${item.color}`}>{item.count}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#414042]/60">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CampusSummary({ campusData, dataSource }: CampusSummaryProps) {
  return (
    <section aria-label="Campus Risk Summary" className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#414042]">Campus Overview</h2>
          <p className="text-[11px] text-[#414042]/60">{campusData.length} campuses monitored</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            dataSource === 'live'
              ? 'border-[#009748]/40 bg-[#009748]/12 text-[#007e42]'
              : 'border-[#414042]/20 bg-[#414042]/6 text-[#414042]/60'
          }`}
        >
          {dataSource === 'live' ? '● Live' : '○ Fallback'}
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
  