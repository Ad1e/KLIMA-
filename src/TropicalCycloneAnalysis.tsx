import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Wind, ShieldCheck, Info, Radio, Map, Satellite, Moon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES } from './services/weather';

type MapMode = 'street' | 'satellite' | 'dark';
type TrackMode = 'pagasa' | 'jtwc' | 'multi';

interface TropicalCycloneAnalysisProps {
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
}

interface CyclonePoint {
  lat: number;
  lon: number;
  windKph: number;
  label: string;
}

const PAGASA_TRACK: CyclonePoint[] = [
  { lat: 13.0, lon: 125.0, windKph: 65, label: '24h Ago' },
  { lat: 13.45, lon: 123.1, windKph: 72, label: '12h Ago' },
  { lat: 13.82, lon: 121.25, windKph: 78, label: 'Current' },
];

const JTWC_TRACK: CyclonePoint[] = [
  { lat: 13.2, lon: 125.2, windKph: 62, label: '24h Ago' },
  { lat: 13.7, lon: 123.35, windKph: 70, label: '12h Ago' },
  { lat: 14.02, lon: 121.62, windKph: 76, label: 'Current' },
];

const getMapTileUrl = (mode: MapMode): string => {
  if (mode === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (mode === 'dark') {
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
};

const haversineDistanceKm = (start: [number, number], end: [number, number]): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(end[0] - start[0]);
  const dLon = toRad(end[1] - start[1]);
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const getRiskStatus = (distanceKm: number) => {
  if (distanceKm < 130) return 'Moderate Risk';
  if (distanceKm < 220) return 'Low Risk';
  return 'Safe';
};

const statusClassMap: Record<string, string> = {
  Safe: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'Low Risk': 'text-amber-700 bg-amber-100 border-amber-200',
  'Moderate Risk': 'text-rose-700 bg-rose-100 border-rose-200',
};

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,23,42,0.35)] bg-white',
});

export default function TropicalCycloneAnalysis({
  mapMode,
  onMapModeChange,
}: TropicalCycloneAnalysisProps) {
  const [trackMode, setTrackMode] = useState<TrackMode>('pagasa');

  const currentTrack = trackMode === 'jtwc' ? JTWC_TRACK : PAGASA_TRACK;
  const currentCenter = currentTrack[currentTrack.length - 1];
  const mapTileUrl = getMapTileUrl(mapMode);

  const campusImpact = useMemo(() => {
    return CAMPUSES.map((campus) => {
      const distanceKm = haversineDistanceKm(
        [currentCenter.lat, currentCenter.lon],
        [campus.lat, campus.lon],
      );
      const adjustedWind = Math.max(22, Math.round(currentCenter.windKph - distanceKm * 0.13));
      const status = getRiskStatus(distanceKm);

      return {
        name: campus.name,
        distanceKm,
        windKph: adjustedWind,
        status,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentCenter.lat, currentCenter.lon, currentCenter.windKph]);

  const windPercent = Math.min(100, Math.round((currentCenter.windKph / 120) * 100));

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Tropical Cyclone Risk Analysis</h1>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
            Monitoring: Tropical Storm AGATON
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/85 p-1 shadow-sm backdrop-blur-sm">
          {[
            { key: 'pagasa' as const, label: 'PAGASA' },
            { key: 'jtwc' as const, label: 'JTWC' },
            { key: 'multi' as const, label: 'Multi-View' },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setTrackMode(mode.key)}
              className={`rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                trackMode === mode.key
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-cyan-50/35 p-2 shadow-[0_20px_65px_rgba(15,23,42,0.1)]">
            <div className="absolute left-6 top-6 z-[1000] flex gap-2 rounded-full border border-slate-200/95 bg-white/90 p-1 backdrop-blur-md">
              {[
                { key: 'street' as const, label: 'Street', icon: <Map size={13} /> },
                { key: 'satellite' as const, label: 'Satellite', icon: <Satellite size={13} /> },
                { key: 'dark' as const, label: 'Dark', icon: <Moon size={13} /> },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => onMapModeChange(mode.key)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    mapMode === mode.key
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-[550px] w-full overflow-hidden rounded-2xl">
              <MapContainer center={[13.5, 122.0]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={mapTileUrl} attribution="&copy; OpenStreetMap contributors" />

                {(trackMode === 'pagasa' || trackMode === 'multi') && (
                  <>
                    <Polyline
                      positions={PAGASA_TRACK.map((point) => [point.lat, point.lon])}
                      color="#ffffff"
                      weight={8}
                      opacity={0.95}
                      dashArray="6 8"
                    />
                    <Polyline
                      positions={PAGASA_TRACK.map((point) => [point.lat, point.lon])}
                      color="#ef4444"
                      weight={4}
                      dashArray="6 8"
                    />
                  </>
                )}

                {(trackMode === 'jtwc' || trackMode === 'multi') && (
                  <>
                    <Polyline
                      positions={JTWC_TRACK.map((point) => [point.lat, point.lon])}
                      color="#ffffff"
                      weight={8}
                      opacity={0.95}
                      dashArray="4 6"
                    />
                    <Polyline
                      positions={JTWC_TRACK.map((point) => [point.lat, point.lon])}
                      color="#2563eb"
                      weight={4}
                      opacity={1}
                      dashArray="4 6"
                    />
                  </>
                )}

                <CircleMarker
                  center={[currentCenter.lat, currentCenter.lon]}
                  radius={11}
                  pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.75, weight: 2 }}
                >
                  <Tooltip direction="top" permanent>
                    Current Cyclone Core
                  </Tooltip>
                </CircleMarker>

                {CAMPUSES.map((campus) => (
                  <Marker key={campus.name} position={[campus.lat, campus.lon]} icon={bsuCampusIcon}>
                    <Tooltip direction="top">{campus.name}</Tooltip>
                  </Marker>
                ))}

                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>

            <div className="absolute bottom-6 left-6 z-[1000] rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl">
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">Track Comparison</h4>
              <div className="space-y-2 text-[10px] font-bold text-slate-800">
                <div className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-rose-500" /> PAGASA Official</div>
                <div className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-blue-600" /> JTWC Forecast</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> BSU Campuses</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-sky-50/35 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Wind Intensity</h3>
              <Wind size={16} className="text-sky-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>{currentCenter.windKph} kph</span>
                <span>MAX: 120 kph</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                  style={{ width: `${windPercent}%` }}
                />
              </div>
              <p className="text-[11px] italic text-slate-500">
                Tropical storm profile with moderate rainfall bands expected in nearby provinces.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_20px_65px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Impact by Campus</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>

            <div className="space-y-1 p-2">
              {campusImpact.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{item.name}</p>
                    <p className="text-[10px] italic text-slate-400">Dist: {item.distanceKm.toFixed(0)} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800">{item.windKph} kph</p>
                    <span className={`inline-block rounded-md border px-2 py-1 text-[9px] font-bold uppercase ${statusClassMap[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-rose-600 to-rose-800 p-6 text-white shadow-lg shadow-rose-200/70">
            <div className="mb-3 flex items-center gap-3">
              <Info size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">Safety Protocol</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-95">
              Activate campus action centers when winds exceed 85 kph. Inspect roofing, secure loose fixtures,
              and clear drainage pathways before rainfall peaks.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100">
              <Radio size={12} /> live advisory mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
