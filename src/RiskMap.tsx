import { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUSES } from './services/weather';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Eye,
  Moon,
  Navigation2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'monitor' | 'risk';

interface CampusRisk {
  name: string;
  level: RiskLevel;
}

interface RiskMapProps {
  mapMode: 'street' | 'satellite' | 'dark';
  onCampusSelect?: (campusName: string) => void;
  onMapModeChange?: (mode: 'street' | 'satellite' | 'dark') => void;
  campusRisks?: CampusRisk[];   // optional: pass risk levels from parent
  isLive?: boolean;
}

// ─── Risk config ──────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  ring: string;
  pulse: boolean;
  label: string;
  hex: string;
  glowHex: string;
}> = {
  safe:    { color: '#009748', ring: '#009748', pulse: false, label: 'Safe',      hex: '#009748', glowHex: 'rgba(0,151,72,0.45)' },
  caution: { color: '#fbaf26', ring: '#fbaf26', pulse: false, label: 'Caution',   hex: '#fbaf26', glowHex: 'rgba(251,175,38,0.45)' },
  warning: { color: '#ff922b', ring: '#ff922b', pulse: false, label: 'Warning',   hex: '#ff922b', glowHex: 'rgba(255,146,43,0.45)' },
  danger:  { color: '#d2232a', ring: '#d2232a', pulse: true,  label: 'Dangerous', hex: '#d2232a', glowHex: 'rgba(210,35,42,0.5)' },
  monitor: { color: '#fbaf26', ring: '#fbaf26', pulse: false, label: 'Caution',   hex: '#fbaf26', glowHex: 'rgba(251,175,38,0.45)' },
  risk:    { color: '#d2232a', ring: '#d2232a', pulse: true,  label: 'Dangerous', hex: '#d2232a', glowHex: 'rgba(210,35,42,0.5)' },
};

// ─── BSU logo marker factory ────────────────────────────────────────────────
function createRiskIcon(level: RiskLevel, selected: boolean): L.DivIcon {
  const cfg = RISK_CONFIG[level];
  const size = selected ? 44 : 36;
  const border = selected ? 4 : 2.5;
  const glow = selected
    ? `0 0 12px 4px ${cfg.glowHex}`
    : `0 0 6px 2px ${cfg.glowHex}`;
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: white;
        border: ${border}px solid ${cfg.hex};
        box-shadow: ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      ">
        <img src='${bsuLogo}' alt='BSU' style="width: ${size - 8}px; height: ${size - 8}px; object-fit: contain; border-radius: 50%;" />
        ${cfg.pulse ? `<span style='position:absolute;left:0;top:0;width:100%;height:100%;border-radius:50%;box-shadow:0_0_0_6px_${cfg.hex}44;animation:pulse 1.5s infinite;'></span>` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${cfg.hex}44; }
          70% { box-shadow: 0 0 0 10px ${cfg.hex}00; }
          100% { box-shadow: 0 0 0 0 ${cfg.hex}44; }
        }
      </style>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ─── Tile URLs ────────────────────────────────────────────────────────────────

const TILES = {
  street:    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors';

// ─── Map mode button labels ───────────────────────────────────────────────────

const MAP_MODES: Array<{ key: 'street' | 'satellite' | 'dark'; label: string; icon: React.ReactNode }> = [
  { key: 'street',    label: 'Street',    icon: <Eye size={12} /> },
  { key: 'satellite', label: 'Satellite', icon: <Layers size={12} /> },
  { key: 'dark',      label: 'Dark',      icon: <Moon size={12} /> },
];

// ─── Fly-to helper ────────────────────────────────────────────────────────────

function FlyToSelected({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 12), { duration: 1.1, easeLinearity: 0.4 });
  }, [lat, lon, map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RiskMap({
  mapMode,
  onCampusSelect,
  onMapModeChange,
  campusRisks = [],
  isLive = false,
}: RiskMapProps) {
  const center: [number, number] = [13.93, 121.02];
  const [selected, setSelected] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number } | null>(null);

  // Build a risk lookup map
  const riskMap = new Map<string, RiskLevel>(campusRisks.map(cr => [cr.name, cr.level]));

  const riskCounts = {
    safe:    campusRisks.filter(c => c.level === 'safe').length    || CAMPUSES.length,
    monitor: campusRisks.filter(c => c.level === 'monitor').length || 0,
    warning: campusRisks.filter(c => c.level === 'warning').length || 0,
    danger:  campusRisks.filter(c => c.level === 'danger').length  || 0,
  };

  function handleSelect(campusName: string, lat: number, lon: number) {
    setSelected(campusName);
    setFlyTarget({ lat, lon });
    onCampusSelect?.(campusName);
  }

  const isDark = mapMode === 'dark';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#d2232a]/20 shadow-[0_20px_60px_rgba(65,64,66,0.18)]"
      style={{ height: 460 }}
      role="region"
      aria-label="BatstateU campus risk map"
    >
      {/* ── Map ── */}
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom
        dragging
        touchZoom
        doubleClickZoom
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution={TILE_ATTR} url={TILES[mapMode]} />
        <ZoomControl position="bottomleft" />

        {flyTarget && <FlyToSelected lat={flyTarget.lat} lon={flyTarget.lon} />}

        {CAMPUSES.map(campus => {
          const level: RiskLevel = riskMap.get(campus.name) ?? 'safe';
          const isSelected = selected === campus.name;
          const icon = createRiskIcon(level, isSelected);
          const cfg = RISK_CONFIG[level];

          return (
            <Marker
              key={campus.name}
              position={[campus.lat, campus.lon]}
              icon={icon}
              zIndexOffset={isSelected ? 1000 : level === 'risk' ? 500 : level === 'monitor' ? 250 : 0}
              eventHandlers={{
                click: () => handleSelect(campus.name, campus.lat, campus.lon),
              }}
            >
              <Tooltip
                permanent={false}
                direction="top"
                offset={[0, -38]}
                className="leaflet-tooltip-custom"
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.97)',
                    border: `1.5px solid ${cfg.hex}55`,
                    borderRadius: 12,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#414042',
                    boxShadow: `0 4px 16px rgba(0,0,0,0.14)`,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Trebuchet MS', sans-serif",
                  }}
                >
                  <span style={{ color: cfg.hex, marginRight: 5 }}>●</span>
                  {campus.name}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: cfg.hex,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Top-left: Map mode controls ── */}
      <div
        className={`absolute left-3 top-3 z-[1000] flex items-center gap-1 rounded-xl border p-1 backdrop-blur-md ${
          isDark
            ? 'border-white/15 bg-[#1a1a2e]/85'
            : 'border-[#414042]/12 bg-white/90'
        }`}
      >
        {MAP_MODES.map(mode => (
          <button
            key={mode.key}
            aria-label={`Switch to ${mode.label} map`}
            aria-pressed={mapMode === mode.key}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              mapMode === mode.key
                ? 'bg-[#d2232a] text-white shadow-sm'
                : isDark
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-[#414042]/60 hover:bg-[#414042]/8 hover:text-[#414042]'
            }`}
            onClick={() => onMapModeChange?.(mode.key)}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* ── Top-right: Live indicator ── */}
      <div
        className={`absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 backdrop-blur-md ${
          isLive
            ? 'border-[#009748]/40 bg-[#009748]/14'
            : isDark
              ? 'border-white/15 bg-[#1a1a2e]/80'
              : 'border-[#414042]/15 bg-white/88'
        }`}
        aria-label={isLive ? 'Live data active' : 'Using fallback data'}
      >
        {isLive ? (
          <Wifi size={11} className="text-[#009748]" />
        ) : (
          <WifiOff size={11} className="text-[#414042]/50" />
        )}
        <span
          className={`text-[9px] font-black uppercase tracking-[0.14em] ${
            isLive ? 'text-[#007e42]' : isDark ? 'text-white/50' : 'text-[#414042]/50'
          }`}
        >
          {isLive ? 'Live' : 'Fallback'}
        </span>
        {isLive && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#009748] shadow-[0_0_0_3px_rgba(0,151,72,0.25)] animate-pulse" />
        )}
      </div>

      {/* ── Bottom-right: Legend ── */}
      <div
        className={`absolute bottom-10 right-3 z-[1000] rounded-2xl border p-3 backdrop-blur-md ${
          isDark
            ? 'border-white/12 bg-[#1a1a2e]/88'
            : 'border-[#414042]/12 bg-white/94'
        }`}
        role="legend"
        aria-label="Map risk legend"
        style={{ minWidth: 148 }}
      >
        {/* Risk Level */}
        <p
          className={`mb-2 text-[9px] font-black uppercase tracking-[0.18em] ${
            isDark ? 'text-white/50' : 'text-[#414042]/50'
          }`}
        >
          Risk Level
        </p>
        <div className="flex flex-col gap-1.5">
          {(
            [
              { level: 'safe' as RiskLevel,    Icon: CheckCircle2,  count: riskCounts.safe },
              { level: 'monitor' as RiskLevel, Icon: AlertTriangle, count: riskCounts.monitor },
              { level: 'warning' as RiskLevel, Icon: AlertTriangle, count: riskCounts.warning },
              { level: 'danger' as RiskLevel,  Icon: AlertOctagon,  count: riskCounts.danger },
            ] as const
          ).map(({ level, Icon, count }) => {
            const cfg = RISK_CONFIG[level];
            return (
              <div key={level} className="flex items-center gap-2">
                <Icon size={12} style={{ color: cfg.hex }} aria-hidden="true" />
                <span
                  className={`text-[10px] font-semibold ${isDark ? 'text-white/80' : 'text-[#414042]'}`}
                >
                  {cfg.label}
                </span>
                <span
                  className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-black"
                  style={{
                    background: `${cfg.hex}22`,
                    color: cfg.hex,
                    border: `1px solid ${cfg.hex}44`,
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Bottom-left: Selected campus chip ── */}
      {selected && (
        <div
          className={`absolute bottom-10 left-12 z-[1000] flex items-center gap-2 rounded-xl border px-3 py-1.5 backdrop-blur-md ${
            isDark
              ? 'border-white/15 bg-[#1a1a2e]/88 text-white'
              : 'border-[#414042]/15 bg-white/94 text-[#414042]'
          }`}
          aria-live="polite"
          aria-label={`Selected campus: ${selected}`}
        >
          <Navigation2 size={11} className="text-[#d2232a]" aria-hidden="true" />
          <span className="text-[10px] font-bold">{selected}</span>
        </div>
      )}

      {/* ── Leaflet tooltip CSS override (injected inline) ── */}
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          border-radius: 10px !important;
          border: 1px solid rgba(65,64,66,0.15) !important;
          color: #414042 !important;
          font-weight: 800 !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 20px rgba(65,64,66,0.18) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
