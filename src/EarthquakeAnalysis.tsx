import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  Navigation,
  Info,
  ShieldAlert,
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
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(65,64,66,0.35)] bg-white',
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
  Safe: 'bg-[#009748]/22 text-[#007e42] border-[#009748]/35',
  Watch: 'bg-[#fbaf26]/25 text-[#fbaf26] border-[#fbaf26]/35',
  Monitor: 'bg-[#d2232a]/20 text-[#911d1f] border-[#d2232a]/35',
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

// Fly-to helper for map zoom effect
function FlyToSelected({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 12), { duration: 1.1, easeLinearity: 0.4 });
  }, [lat, lon, map]);
  return null;
}

export default function EarthquakeAnalysis({ mapMode, onMapModeChange }: EarthquakeAnalysisProps) {
  const [focusMode, setFocusMode] = useState<FocusMode>('campuses');
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lon: number } | null>(null);

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
  const nearestCampus = campusDistances[0];
  const advisoryLevel =
    nearestCampus.status === 'Monitor'
      ? 'Heightened monitoring'
      : nearestCampus.status === 'Watch'
        ? 'Preparedness watch'
        : 'Routine awareness';
  const shakingEstimate =
    latestEQ.depthKm > 300
      ? 'Deep-focus event: generally lower surface shaking impact is expected in Batangas.'
      : 'Shallow-to-mid depth event: monitor for stronger local ground motion and aftershocks.';

  const mapView =
    focusMode === 'event'
      ? ({ center: latestEQ.coords as [number, number], zoom: 5 } as const)
      : focusMode === 'campuses'
        ? ({ center: [13.93, 121.02] as [number, number], zoom: 9 } as const)
        : ({ center: [18.7, 127.5] as [number, number], zoom: 4 } as const);

  return (
    <div className="space-y-4 px-6 py-4">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#414042]">Earthquake Risk Analysis</h1>
          <p className="mt-0.5 text-xs text-[#414042]/80">As of March 18, 2026 • Regional Seismic Activity Overview</p>
        </div>
        <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-[#414042]/80 shadow-sm backdrop-blur-sm">
          Source: PHIVOLCS / USGS style feed (mock)
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3 items-start">
        <div className="col-span-12 space-y-3 lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/10 p-4 shadow-[0_12px_40px_rgba(65,64,66,0.10)]">
            <div className="absolute left-6 top-6 z-[1000] flex gap-2 rounded-full border border-[#d2232a]/20 bg-white/92 p-1 backdrop-blur-md">
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
                      ? 'bg-[#911d1f] text-white'
                      : 'text-[#414042]/75 hover:bg-[#d2232a]/15 hover:text-[#911d1f]'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="absolute right-6 top-6 z-[1000] flex gap-2 rounded-full border border-[#d2232a]/20 bg-white/92 p-1 backdrop-blur-md">
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
                      ? 'bg-[#d2232a] text-white'
                      : 'text-[#414042]/75 hover:bg-[#d2232a]/15 hover:text-[#911d1f]'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-[400px] w-full overflow-hidden rounded-2xl">
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
                      pathOptions={{ color: '#d2232a', weight: 1.5, opacity: 0.3, dashArray: '4 8' }}
                    />
                  ))}

                <CircleMarker
                  center={latestEQ.coords}
                  radius={16}
                  pathOptions={{ color: '#911d1f', fillColor: '#d2232a', fillOpacity: 0.45, weight: 2 }}
                >
                  <Popup>
                    <div className="min-w-[160px] space-y-1">
                      <p className="font-bold text-[#911d1f]">Magnitude {latestEQ.magnitude.toFixed(1)}</p>
                      <p className="text-xs text-[#414042]">{latestEQ.location}</p>
                      <p className="text-xs text-[#414042]/80">Depth: {latestEQ.depthKm.toFixed(1)} km</p>
                    </div>
                  </Popup>
                </CircleMarker>


                {/* Fly-to effect for selected campus */}
                {flyTarget && <FlyToSelected lat={flyTarget.lat} lon={flyTarget.lon} />}

                {CAMPUSES.map((campus) => {
                  const isSelected = selectedCampus === campus.name;
                  return (
                    <Marker
                      key={campus.name}
                      position={[campus.lat, campus.lon]}
                      icon={bsuCampusIcon}
                      zIndexOffset={isSelected ? 1200 : 1000}
                      eventHandlers={{
                        click: () => {
                          setSelectedCampus(campus.name);
                          setFlyTarget({ lat: campus.lat, lon: campus.lon });
                        },
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-[#414042]">{campus.name}</p>
                          <p className="text-[#414042]/80">
                            {campus.lat.toFixed(6)}, {campus.lon.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#d2232a]/15 bg-white/70 p-4 shadow-sm backdrop-blur-md">
            {/* Risk Status Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-[#414042]/60">Risk Status</span>
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { label: 'Monitor', color: '#d2232a' },
                  { label: 'Watch',   color: '#fbaf26' },
                  { label: 'Safe',    color: '#009748' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: item.color }} />
                    <span className="text-[11px] font-bold text-[#414042]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-[#d2232a]/15 to-transparent" />

            {/* Map Indicators Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-[#414042]/60">Map Markers</span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {[
                  { label: 'BSU Campus',      el: <span className="h-3 w-3 rounded-full border-2 border-white bg-[#414042]/30 shadow-sm" /> },
                  { label: 'Epicenter Link',  el: <span className="h-px w-5 border-t-2 border-dashed border-[#d2232a]/70" /> },
                  { label: 'EQ Source',       el: <span className="h-2.5 w-2.5 rounded-full bg-[#d2232a] shadow-sm" /> },
                ].map(({ label, el }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {el}
                    <span className="text-[11px] font-bold text-[#414042]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/14 p-6 shadow-[0_20px_65px_rgba(65,64,66,0.12)]">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Activity size={96} className="text-[#911d1f]" />
            </div>

            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#911d1f]">
              <ShieldAlert size={15} /> Latest Earthquake
            </h3>

            <div className="mb-3 flex items-center gap-4">
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#911d1f] to-[#d2232a] text-white shadow-lg shadow-[#d2232a]/35">
                <span className="text-2xl font-black">{latestEQ.magnitude.toFixed(1)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-85">Magnitude</span>
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight text-[#414042]">{latestEQ.location}</h2>
                <p className="mt-1 text-xs italic text-[#414042]/80">Depth: {latestEQ.depthKm.toFixed(1)} km</p>
                <p className="mt-1 text-[11px] text-[#414042]/70">{latestEQ.time}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-2.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#414042]/80">Event Assessment</p>
              <p className="mt-1 text-sm font-semibold text-[#414042]">
                Deep-focus regional event with low immediate impact probability for Batangas campuses.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d2232a]/20 bg-white/96 shadow-[0_12px_40px_rgba(65,64,66,0.08)]">
            <div className="flex items-center justify-between border-b border-[#d2232a]/15 p-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]">Campus Distance Analysis</h3>
              <Navigation size={14} className="text-[#911d1f]/55" />
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#d2232a]/8">
                <th className="px-4 py-2 text-[10px] font-bold uppercase text-[#414042]/70">Campus</th>
                <th className="px-4 py-2 text-center text-[10px] font-bold uppercase text-[#414042]/70">Distance (km)</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-[#414042]/70">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2232a]/10">
                {campusDistances.map((campus) => (
                  <tr key={campus.name} className="transition-colors hover:bg-[#d2232a]/8">
                    <td className="px-4 py-2.5 text-xs font-bold text-[#414042]">{campus.name}</td>
                    <td className="px-4 py-2.5 text-center text-xs font-mono text-[#414042]/80">
                      {campus.distanceKm.toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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

          <div className="rounded-2xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/12 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Radar size={14} className="text-[#911d1f]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#414042]">Action Briefing</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#414042]/80">Nearest</p>
                <p className="mt-0.5 text-xs font-semibold text-[#414042]">{nearestCampus.name}</p>
              </div>
              <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#414042]/80">Distance</p>
                <p className="mt-0.5 text-xs font-semibold text-[#414042]">{nearestCampus.distanceKm.toFixed(0)} km</p>
              </div>
              <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#414042]/80">Advisory</p>
                <p className="mt-0.5 text-xs font-semibold text-[#414042]">{advisoryLevel}</p>
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-[#d2232a]/20 bg-white/92 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#414042]/80">Expected Ground Impact</p>
              <p className="mt-1 text-xs text-[#414042]">{shakingEstimate}</p>
            </div>

            <div className="mt-2 rounded-xl border border-[#d2232a]/20 bg-white/92 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#414042]/80">Recommended Actions</p>
              <div className="mt-1.5 space-y-0.5 text-xs text-[#414042]">
                <p>Check official seismic advisories every 30 minutes.</p>
                <p>Confirm building and lab safety status before high-occupancy activities.</p>
                <p>Prepare response teams for possible aftershock notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



