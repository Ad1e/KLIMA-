import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  Navigation,
  Info,
  ShieldAlert,
  Waves,
  Map,
  Satellite,
  Moon,
  LocateFixed,
  Radar,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES } from './services/weather';

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,23,42,0.35)] bg-white',
});

interface EarthquakeEvent {
  magnitude: number;
  location: string;
  depthKm: number;
  time: string;
  coords: [number, number];
}

type MapMode = 'street' | 'satellite' | 'dark';
type FocusMode = 'combined' | 'campuses' | 'event';

interface EarthquakeAnalysisProps {
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
}

interface MapViewportControllerProps {
  center: [number, number];
  zoom: number;
  focusMode: FocusMode;
}

function MapViewportController({ center, zoom, focusMode }: MapViewportControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (focusMode === 'campuses') {
      map.fitBounds(
        CAMPUSES.map((campus) => [campus.lat, campus.lon] as [number, number]),
        { padding: [42, 42], maxZoom: 11, animate: true },
      );
      return;
    }

    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map, focusMode]);

  return null;
}

const latestEQ: EarthquakeEvent = {
  magnitude: 4.3,
  location: 'Izu Islands, Japan Region',
  depthKm: 508.215,
  time: 'Mar 18, 2026, 7:39 AM',
  coords: [31.5, 140.0],
};

const getEqTileUrl = (mode: MapMode): string => {
  if (mode === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (mode === 'dark') {
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
};

const getRiskLabel = (distanceKm: number) => {
  if (distanceKm < 250) return 'Monitor';
  if (distanceKm < 600) return 'Watch';
  return 'Safe';
};

const statusClasses: Record<string, string> = {
  Safe: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Watch: 'bg-amber-100 text-amber-700 border-amber-200',
  Monitor: 'bg-rose-100 text-rose-700 border-rose-200',
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

export default function EarthquakeAnalysis({ mapMode, onMapModeChange }: EarthquakeAnalysisProps) {
  const [focusMode, setFocusMode] = useState<FocusMode>('campuses');

  const campusDistances = useMemo(() => {
    return CAMPUSES.map((campus) => {
      const distanceKm = haversineDistanceKm(latestEQ.coords, [campus.lat, campus.lon]);
      const status = getRiskLabel(distanceKm);

      return {
        name: campus.name,
        distanceKm,
        status,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, []);

  const mapTileUrl = getEqTileUrl(mapMode);

  const mapView =
    focusMode === 'event'
      ? ({ center: latestEQ.coords as [number, number], zoom: 5 } as const)
      : focusMode === 'campuses'
        ? ({ center: [13.93, 121.02] as [number, number], zoom: 9 } as const)
        : ({ center: [18.7, 127.5] as [number, number], zoom: 4 } as const);

  return (
    <div className="space-y-6 p-8">
      <header className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Earthquake Risk Analysis</h1>
          <p className="mt-1 text-sm text-slate-600">As of March 18, 2026 • Regional Seismic Activity Overview</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/85 px-4 py-2 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
          Source: PHIVOLCS / USGS style feed (mock)
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-sky-50/35 p-2 shadow-[0_20px_65px_rgba(15,23,42,0.1)]">
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

            <div className="absolute right-6 top-6 z-[1000] flex gap-2 rounded-full border border-slate-200/95 bg-white/90 p-1 backdrop-blur-md">
              {[
                { key: 'combined' as const, label: 'Combined', icon: <Radar size={13} /> },
                { key: 'campuses' as const, label: 'Campuses', icon: <LocateFixed size={13} /> },
                { key: 'event' as const, label: 'Event', icon: <LocateFixed size={13} /> },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setFocusMode(mode.key)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    focusMode === mode.key
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-[500px] w-full overflow-hidden rounded-2xl">
              <MapContainer
                center={mapView.center}
                zoom={mapView.zoom}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
              >
                <MapViewportController center={mapView.center} zoom={mapView.zoom} focusMode={focusMode} />
                <TileLayer url={mapTileUrl} attribution="&copy; OpenStreetMap contributors" />

                {focusMode !== 'event' &&
                  CAMPUSES.map((campus) => (
                    <Polyline
                      key={`link-${campus.name}`}
                      positions={[latestEQ.coords, [campus.lat, campus.lon]]}
                      pathOptions={{ color: '#f43f5e', weight: 1.5, opacity: 0.25, dashArray: '4 8' }}
                    />
                  ))}

                <CircleMarker
                  center={latestEQ.coords}
                  radius={16}
                  pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.45, weight: 2 }}
                >
                  <Popup>
                    <div className="min-w-[160px] space-y-1">
                      <p className="font-bold text-rose-700">Magnitude {latestEQ.magnitude.toFixed(1)}</p>
                      <p className="text-xs text-slate-700">{latestEQ.location}</p>
                      <p className="text-xs text-slate-500">Depth: {latestEQ.depthKm.toFixed(1)} km</p>
                    </div>
                  </Popup>
                </CircleMarker>

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

                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Info size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Legend And Indicators</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-[10px] font-semibold text-slate-700">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-slate-300 bg-white" /> BSU Campus</div>
              <div className="flex items-center gap-2"><span className="h-1 w-5 bg-rose-400/70" /> Epicenter Link</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Earthquake Source</div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-rose-50/30 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.1)]">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Activity size={96} className="text-rose-700" />
            </div>

            <h3 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
              <ShieldAlert size={15} /> Latest Earthquake
            </h3>

            <div className="mb-5 flex items-center gap-5">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-200/70">
                <span className="text-3xl font-black">{latestEQ.magnitude.toFixed(1)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-85">Magnitude</span>
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-slate-800">{latestEQ.location}</h2>
                <p className="mt-1 text-xs italic text-slate-500">Depth: {latestEQ.depthKm.toFixed(1)} km</p>
                <p className="mt-1 text-[11px] text-slate-400">{latestEQ.time}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/85 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Event Assessment</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                Deep-focus regional event with low immediate impact probability for Batangas campuses.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_20px_65px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Campus Distance Analysis</h3>
              <Navigation size={14} className="text-slate-300" />
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-400">Campus</th>
                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase text-slate-400">Distance (km)</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campusDistances.map((campus) => (
                  <tr key={campus.name} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-4 text-xs font-bold text-slate-700">{campus.name}</td>
                    <td className="px-5 py-4 text-center text-xs font-mono text-slate-500">
                      {campus.distanceKm.toFixed(0)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase ${
                          statusClasses[campus.status]
                        }`}
                      >
                        {campus.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <LocateFixed size={14} className="text-cyan-600" />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                BSU Campus Coordinates (Verified)
              </p>
            </div>
            <div className="space-y-2">
              {CAMPUSES.map((campus) => (
                <div
                  key={`coord-${campus.name}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-700">{campus.name}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {campus.lat.toFixed(6)}, {campus.lon.toFixed(6)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white/95 to-amber-50/30 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-amber-700">
              <Waves size={14} />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Operational Note</p>
            </div>
            <p className="text-xs text-slate-600">
              For automatic earthquake feeds, integrate PHIVOLCS or USGS GeoJSON event endpoints and update the
              latest event object in this module.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
