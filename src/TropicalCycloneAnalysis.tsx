import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Wind, ShieldCheck, Info, Radio, Map, Satellite, Moon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES, fetchLiveTyphoonFeed, type CycloneTrackPoint } from './services/weather';

type MapMode = 'street' | 'satellite' | 'dark';
type TrackMode = 'pagasa' | 'jtwc' | 'multi';

interface TropicalCycloneAnalysisProps {
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
}

type CyclonePoint = Omit<CycloneTrackPoint, 'timestampIso'> & { timestampIso?: string };

interface TyphoonAdvisoryInfo {
  stormName: string;
  source: string;
  advisoryFromIso: string | null;
  advisoryToIso: string | null;
  alertLevel: string;
  maxWindKph: number | null;
  detailsSummary: string;
}

interface PreviousTyphoonItem {
  name: string;
  source: string;
  fromIso: string | null;
  toIso: string | null;
  alertLevel: string;
  maxWindKph: number | null;
  isActive: boolean;
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

const APPROACH_DISTANCE_KM = 380;

const formatTrackPointTime = (timestampIso?: string): string => {
  if (!timestampIso) return 'Time unavailable';
  const parsed = new Date(timestampIso);
  if (Number.isNaN(parsed.getTime())) return 'Time unavailable';
  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAdvisoryWindow = (fromIso: string | null, toIso: string | null): string => {
  const from = fromIso ? new Date(fromIso) : null;
  const to = toIso ? new Date(toIso) : null;

  const formattedFrom = from && !Number.isNaN(from.getTime())
    ? from.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';
  const formattedTo = to && !Number.isNaN(to.getTime())
    ? to.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return `${formattedFrom} to ${formattedTo}`;
};

const formatAge = (totalHours: number): string => {
  if (totalHours < 1) return 'just now';
  if (totalHours < 24) return `${Math.round(totalHours)}h ago`;
  return `${Math.round(totalHours / 24)}d ago`;
};

const getFreshness = (timestampIso: string | null) => {
  if (!timestampIso) {
    return {
      label: 'No timestamp',
      age: 'unknown',
      chipClass: 'bg-[#414042]/10 text-[#414042]/75 border-[#414042]/20',
      dotClass: 'bg-[#414042]/45',
    };
  }

  const parsed = new Date(timestampIso);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: 'Invalid timestamp',
      age: 'unknown',
      chipClass: 'bg-[#414042]/10 text-[#414042]/75 border-[#414042]/20',
      dotClass: 'bg-[#414042]/45',
    };
  }

  const ageHours = (Date.now() - parsed.getTime()) / (1000 * 60 * 60);
  if (ageHours <= 6) {
    return {
      label: 'Fresh',
      age: formatAge(ageHours),
      chipClass: 'bg-[#009748]/16 text-[#007e42] border-[#009748]/30',
      dotClass: 'bg-[#009748]',
    };
  }

  if (ageHours <= 24) {
    return {
      label: 'Recent',
      age: formatAge(ageHours),
      chipClass: 'bg-[#fbaf26]/18 text-[#9a6a00] border-[#fbaf26]/35',
      dotClass: 'bg-[#fbaf26]',
    };
  }

  if (ageHours <= 72) {
    return {
      label: 'Aging',
      age: formatAge(ageHours),
      chipClass: 'bg-[#d2232a]/12 text-[#911d1f] border-[#d2232a]/25',
      dotClass: 'bg-[#d2232a]/80',
    };
  }

  return {
    label: 'Stale',
    age: formatAge(ageHours),
    chipClass: 'bg-[#911d1f]/14 text-[#911d1f] border-[#911d1f]/35',
    dotClass: 'bg-[#911d1f]',
  };
};

const estimateApproach = (track: CyclonePoint[]) => {
  let closestDistanceKm = Number.POSITIVE_INFINITY;
  let closestCampusName = '';
  let etaLabel = 'No projected approach to PH campuses';

  for (const point of track) {
    for (const campus of CAMPUSES) {
      const distanceKm = haversineDistanceKm([point.lat, point.lon], [campus.lat, campus.lon]);

      if (distanceKm < closestDistanceKm) {
        closestDistanceKm = distanceKm;
        closestCampusName = campus.name;
      }

      if (distanceKm <= APPROACH_DISTANCE_KM) {
        etaLabel = `${formatTrackPointTime(point.timestampIso)} (${point.label})`;
        return {
          etaLabel,
          closestDistanceKm,
          closestCampusName,
        };
      }
    }
  }

  return {
    etaLabel,
    closestDistanceKm,
    closestCampusName,
  };
};

const statusClassMap: Record<string, string> = {
  Safe: 'text-[#007e42] bg-[#009748]/22 border-[#009748]/35',
  'Low Risk': 'text-[#fbaf26] bg-[#fbaf26]/25 border-[#fbaf26]/35',
  'Moderate Risk': 'text-[#911d1f] bg-[#d2232a]/22 border-[#d2232a]/35',
};

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(65,64,66,0.35)] bg-white',
});

export default function TropicalCycloneAnalysis({
  mapMode,
  onMapModeChange,
}: TropicalCycloneAnalysisProps) {
  const [trackMode, setTrackMode] = useState<TrackMode>('pagasa');
  const [liveStormName, setLiveStormName] = useState('Tropical Storm AGATON');
  const [liveSourceLabel, setLiveSourceLabel] = useState('Fallback Dataset');
  const [liveUpdatedAtIso, setLiveUpdatedAtIso] = useState<string | null>(null);
  const [livePagasaTrack, setLivePagasaTrack] = useState<CyclonePoint[]>(PAGASA_TRACK);
  const [liveJtwcTrack, setLiveJtwcTrack] = useState<CyclonePoint[]>(JTWC_TRACK);
  const [hasActiveTyphoon, setHasActiveTyphoon] = useState(false);
  const [pagasaInfo, setPagasaInfo] = useState<TyphoonAdvisoryInfo>({
    stormName: 'PAGASA advisory unavailable',
    source: 'PAGASA',
    advisoryFromIso: null,
    advisoryToIso: null,
    alertLevel: 'N/A',
    maxWindKph: null,
    detailsSummary: 'No advisory details available.',
  });
  const [jtwcInfo, setJtwcInfo] = useState<TyphoonAdvisoryInfo>({
    stormName: 'JTWC advisory unavailable',
    source: 'JTWC',
    advisoryFromIso: null,
    advisoryToIso: null,
    alertLevel: 'N/A',
    maxWindKph: null,
    detailsSummary: 'No advisory details available.',
  });
  const [previousTyphoons, setPreviousTyphoons] = useState<PreviousTyphoonItem[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLiveTyphoonFeed = async () => {
      try {
        const payload = await fetchLiveTyphoonFeed();
        if (!isMounted) return;

        setLiveStormName(payload.stormName);
        setLiveSourceLabel(payload.sourceLabel || 'GDACS');
        setLiveUpdatedAtIso(payload.updatedAtIso);
        setHasActiveTyphoon(payload.hasActivePhilippineTyphoon);
        setPagasaInfo(payload.pagasa);
        setJtwcInfo(payload.jtwc);
        setPreviousTyphoons(payload.recentPhilippineTyphoons ?? []);
        setLivePagasaTrack(payload.pagasaTrack.length >= 2 ? payload.pagasaTrack : PAGASA_TRACK);
        setLiveJtwcTrack(payload.jtwcTrack.length >= 2 ? payload.jtwcTrack : JTWC_TRACK);
        setLiveError(null);
      } catch {
        if (!isMounted) return;
        setLiveError('Live typhoon feed unavailable, using fallback track data.');
        setHasActiveTyphoon(false);
        setPreviousTyphoons([]);
        setLivePagasaTrack(PAGASA_TRACK);
        setLiveJtwcTrack(JTWC_TRACK);
      } finally {
        if (isMounted) {
          setIsLiveLoading(false);
        }
      }
    };

    void loadLiveTyphoonFeed();
    const refreshHandle = window.setInterval(() => {
      void loadLiveTyphoonFeed();
    }, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshHandle);
    };
  }, []);

  const currentTrack = trackMode === 'jtwc' ? liveJtwcTrack : livePagasaTrack;
  const currentCenter = currentTrack[currentTrack.length - 1];
  const mapTileUrl = getMapTileUrl(mapMode);
  const mapCenter: [number, number] = [currentCenter.lat, currentCenter.lon];
  const isFallbackFeed = Boolean(liveError) || liveSourceLabel.toLowerCase().includes('fallback');
  const hasRenderableActiveTrack = hasActiveTyphoon && livePagasaTrack.length >= 2 && liveJtwcTrack.length >= 2;
  const pagasaApproach = useMemo(() => estimateApproach(livePagasaTrack), [livePagasaTrack]);
  const jtwcApproach = useMemo(() => estimateApproach(liveJtwcTrack), [liveJtwcTrack]);
  const feedFreshness = useMemo(() => getFreshness(liveUpdatedAtIso), [liveUpdatedAtIso]);
  const pagasaFreshness = useMemo(
    () => getFreshness(pagasaInfo.advisoryToIso ?? livePagasaTrack[livePagasaTrack.length - 1]?.timestampIso ?? null),
    [pagasaInfo.advisoryToIso, livePagasaTrack],
  );
  const jtwcFreshness = useMemo(
    () => getFreshness(jtwcInfo.advisoryToIso ?? liveJtwcTrack[liveJtwcTrack.length - 1]?.timestampIso ?? null),
    [jtwcInfo.advisoryToIso, liveJtwcTrack],
  );

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
          <h1 className="text-3xl font-extrabold text-[#414042]">Tropical Cyclone Risk Analysis</h1>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#414042]/80">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#d2232a]" />
            Monitoring: {liveStormName}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#414042]/70">
            Feed: {liveSourceLabel}
            {liveUpdatedAtIso ? ` • Updated ${new Date(liveUpdatedAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </div>
          <div className="mt-2 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
            <div className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${feedFreshness.chipClass}`}>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${feedFreshness.dotClass}`} />
                Feed Sync: {feedFreshness.label}
              </div>
              <p className="mt-0.5 text-[10px] opacity-85">{feedFreshness.age}</p>
            </div>
            <div className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${pagasaFreshness.chipClass}`}>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${pagasaFreshness.dotClass}`} />
                PAGASA: {pagasaFreshness.label}
              </div>
              <p className="mt-0.5 text-[10px] opacity-85">{pagasaFreshness.age}</p>
            </div>
            <div className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${jtwcFreshness.chipClass}`}>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${jtwcFreshness.dotClass}`} />
                JTWC: {jtwcFreshness.label}
              </div>
              <p className="mt-0.5 text-[10px] opacity-85">{jtwcFreshness.age}</p>
            </div>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#414042]/70">
            View note: PAGASA and JTWC are two track projections for the same cyclone.
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#911d1f]">
            Data mode: {isFallbackFeed ? 'Fallback track' : 'Live GDACS-derived track'} • {hasActiveTyphoon ? 'Active PH advisory' : 'No active PH advisory'}
          </div>
          {liveError ? <p className="mt-1 text-[11px] font-semibold text-[#911d1f]">{liveError}</p> : null}
        </div>

        <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-1 shadow-sm backdrop-blur-sm">
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
                  ? 'bg-[#911d1f] text-white'
                  : 'text-[#414042]/75 hover:bg-[#d2232a]/12 hover:text-[#911d1f]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/10 p-2 shadow-[0_20px_65px_rgba(65,64,66,0.12)]">
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
                      : 'text-[#414042]/75 hover:bg-[#d2232a]/12 hover:text-[#911d1f]'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-[520px] w-full overflow-hidden rounded-2xl">
              <MapContainer center={mapCenter} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={mapTileUrl} attribution="&copy; OpenStreetMap contributors" />

                {hasRenderableActiveTrack && (trackMode === 'pagasa' || trackMode === 'multi') && (
                  <>
                    <Polyline
                      positions={livePagasaTrack.map((point) => [point.lat, point.lon])}
                      color="#d2232a"
                      weight={9}
                      opacity={0.18}
                    />
                    <Polyline
                      positions={livePagasaTrack.map((point) => [point.lat, point.lon])}
                      color="#d2232a"
                      weight={4}
                      opacity={0.95}
                    />
                    {livePagasaTrack.map((point, index) => (
                      <CircleMarker
                        key={`pagasa-point-${index}`}
                        center={[point.lat, point.lon]}
                        radius={point.label === 'Current' ? 6 : 4}
                        pathOptions={{
                          color: '#911d1f',
                          fillColor: '#d2232a',
                          fillOpacity: point.label === 'Current' ? 0.95 : 0.75,
                          weight: 1.5,
                        }}
                      >
                        <Tooltip direction="top">
                          PAGASA • {point.label} • {point.windKph} kph • {formatTrackPointTime(point.timestampIso)}
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </>
                )}

                {hasRenderableActiveTrack && (trackMode === 'jtwc' || trackMode === 'multi') && (
                  <>
                    <Polyline
                      positions={liveJtwcTrack.map((point) => [point.lat, point.lon])}
                      color="#006193"
                      weight={9}
                      opacity={0.16}
                    />
                    <Polyline
                      positions={liveJtwcTrack.map((point) => [point.lat, point.lon])}
                      color="#006193"
                      weight={4}
                      opacity={0.95}
                    />
                    {liveJtwcTrack.map((point, index) => (
                      <CircleMarker
                        key={`jtwc-point-${index}`}
                        center={[point.lat, point.lon]}
                        radius={point.label === 'Current' ? 6 : 4}
                        pathOptions={{
                          color: '#00527c',
                          fillColor: '#006193',
                          fillOpacity: point.label === 'Current' ? 0.95 : 0.75,
                          weight: 1.5,
                        }}
                      >
                        <Tooltip direction="top">
                          JTWC • {point.label} • {point.windKph} kph • {formatTrackPointTime(point.timestampIso)}
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </>
                )}

                {hasRenderableActiveTrack ? (
                  <CircleMarker
                    center={[currentCenter.lat, currentCenter.lon]}
                    radius={11}
                    pathOptions={{ color: '#911d1f', fillColor: '#d2232a', fillOpacity: 0.75, weight: 2 }}
                  >
                    <Tooltip direction="top" permanent>
                      Current Cyclone Core
                    </Tooltip>
                  </CircleMarker>
                ) : null}

                {CAMPUSES.map((campus) => (
                  <Marker key={campus.name} position={[campus.lat, campus.lon]} icon={bsuCampusIcon}>
                    <Tooltip direction="top">{campus.name}</Tooltip>
                  </Marker>
                ))}

                <ZoomControl position="bottomright" />
              </MapContainer>
            </div>

            {!hasRenderableActiveTrack ? (
              <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center">
                <div className="rounded-2xl border border-[#d2232a]/20 bg-white/92 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#911d1f]">No active incoming typhoon</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#414042]/80">
                    Map tracks are hidden to avoid showing stale historical paths.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="absolute bottom-6 left-6 z-[1000] rounded-2xl border border-[#d2232a]/20 bg-white p-4 shadow-2xl">
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#414042]/80">Track Comparison</h4>
              <div className="space-y-2 text-[10px] font-bold text-[#414042]">
                <div className="flex items-center gap-2"><span className="h-1.5 w-6 rounded bg-[#d2232a]" /> PAGASA Projection {isLiveLoading ? '(loading)' : '(live/fallback)'}</div>
                <div className="flex items-center gap-2"><span className="h-1.5 w-6 rounded bg-[#006193]" /> JTWC Projection {isLiveLoading ? '(loading)' : '(live/fallback)'}</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-[#414042]/35 bg-white" /> BSU Campuses</div>
              </div>
              <div className="mt-3 space-y-1 border-t border-[#d2232a]/15 pt-2 text-[10px] font-semibold text-[#414042]/80">
                <p>
                  PAGASA PH approach: {hasRenderableActiveTrack ? pagasaApproach.etaLabel : 'No active projected approach'}
                  {Number.isFinite(pagasaApproach.closestDistanceKm)
                    ? ` • Closest: ${pagasaApproach.closestDistanceKm.toFixed(0)} km (${pagasaApproach.closestCampusName})`
                    : ''}
                </p>
                <p>
                  JTWC PH approach: {hasRenderableActiveTrack ? jtwcApproach.etaLabel : 'No active projected approach'}
                  {Number.isFinite(jtwcApproach.closestDistanceKm)
                    ? ` • Closest: ${jtwcApproach.closestDistanceKm.toFixed(0)} km (${jtwcApproach.closestCampusName})`
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-3xl border border-[#d2232a]/20 bg-white/95 p-4 shadow-[0_18px_55px_rgba(65,64,66,0.1)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]">Incoming Typhoon Brief</h3>
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${hasActiveTyphoon ? 'bg-[#d2232a]/18 text-[#911d1f]' : 'bg-[#fbaf26]/22 text-[#9a6a00]'}`}>
                {hasActiveTyphoon ? 'Active Advisory' : 'Monitoring Only'}
              </span>
            </div>

            <div className="space-y-2.5 text-[11px] text-[#414042]/85">
              <div className="rounded-xl border border-[#d2232a]/20 bg-gradient-to-br from-white to-[#d2232a]/10 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#911d1f]">PAGASA Name</p>
                <p className="mt-1 text-sm font-black text-[#414042]">{pagasaInfo.stormName}</p>
                <p className="mt-1 text-[10px] font-semibold">Window: {formatAdvisoryWindow(pagasaInfo.advisoryFromIso, pagasaInfo.advisoryToIso)}</p>
                <p className="mt-1 text-[10px] font-semibold">Alert: {pagasaInfo.alertLevel} • Max wind: {pagasaInfo.maxWindKph ?? 'N/A'} kph</p>
              </div>

              <div className="rounded-xl border border-[#006193]/20 bg-gradient-to-br from-white to-[#006193]/10 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#006193]">JTWC Name</p>
                <p className="mt-1 text-sm font-black text-[#414042]">{jtwcInfo.stormName}</p>
                <p className="mt-1 text-[10px] font-semibold">Window: {formatAdvisoryWindow(jtwcInfo.advisoryFromIso, jtwcInfo.advisoryToIso)}</p>
                <p className="mt-1 text-[10px] font-semibold">Alert: {jtwcInfo.alertLevel} • Max wind: {jtwcInfo.maxWindKph ?? 'N/A'} kph</p>
              </div>

              <div className="rounded-xl border border-[#d2232a]/18 bg-white p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#414042]/75">Advisory Detail</p>
                <p className="mt-1 leading-relaxed">{trackMode === 'jtwc' ? jtwcInfo.detailsSummary : pagasaInfo.detailsSummary}</p>
              </div>

              <div className="rounded-xl border border-[#414042]/16 bg-white p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#414042]/75">Recent PH Typhoons</p>
                {previousTyphoons.length > 0 ? (
                  <div className="modern-scrollbar mt-2 max-h-[150px] space-y-1 overflow-y-auto pr-1">
                    {previousTyphoons.slice(0, 6).map((item, index) => (
                      <div key={`${item.name}-${item.fromIso ?? index}`} className="rounded-lg border border-[#d2232a]/12 bg-[#fff7f8] px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[10px] font-bold text-[#414042]">{item.name}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${item.isActive ? 'bg-[#009748]/16 text-[#007e42]' : 'bg-[#414042]/10 text-[#414042]/75'}`}>
                            {item.isActive ? 'active' : 'previous'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-[#414042]/70">
                          {item.source} • {formatAdvisoryWindow(item.fromIso, item.toIso)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] text-[#414042]/65">No recent Philippine typhoon records from current feed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="h-full rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/10 p-4 shadow-[0_18px_60px_rgba(65,64,66,0.1)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]">Wind Intensity</h3>
              <Wind size={16} className="text-[#911d1f]" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#414042]/70">
                <span>{hasRenderableActiveTrack ? `${currentCenter.windKph} kph` : 'N/A'}</span>
                <span>MAX: 120 kph</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#d2232a]/15">
                <div
                  className="h-full bg-gradient-to-r from-[#fbaf26] via-[#d2232a] to-[#d2232a]"
                  style={{ width: `${hasRenderableActiveTrack ? windPercent : 0}%` }}
                />
              </div>
              <p className="text-[11px] italic text-[#414042]/80">
                {hasRenderableActiveTrack
                  ? 'Tropical storm profile with moderate rainfall bands expected in nearby provinces.'
                  : 'No active incoming typhoon signal. Monitoring remains in preparedness mode.'}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="overflow-hidden rounded-3xl border border-[#d2232a]/20 bg-white/96 shadow-[0_20px_65px_rgba(65,64,66,0.1)]">
            <div className="flex items-center justify-between border-b border-[#d2232a]/15 p-4">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#414042]">Impact by Campus</span>
              <ShieldCheck size={16} className="text-[#007e42]" />
            </div>

            <div className="modern-scrollbar max-h-[300px] space-y-1 overflow-y-auto p-2">
              {campusImpact.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-[#d2232a]/8">
                  <div>
                    <p className="text-xs font-bold text-[#414042]">{item.name}</p>
                    <p className="text-[10px] italic text-[#414042]/70">Dist: {item.distanceKm.toFixed(0)} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#414042]">{item.windKph} kph</p>
                    <span className={`inline-block rounded-md border px-2 py-1 text-[9px] font-bold uppercase ${statusClassMap[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="h-full rounded-3xl bg-gradient-to-br from-[#911d1f] to-[#d2232a] p-4 text-white shadow-lg shadow-[#d2232a]/35">
            <div className="mb-3 flex items-center gap-3">
              <Info size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">Safety Protocol</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-95">
              {hasRenderableActiveTrack
                ? 'Activate campus action centers when winds exceed 85 kph. Inspect roofing, secure loose fixtures, and clear drainage pathways before rainfall peaks.'
                : 'No active incoming typhoon at this time. Keep emergency supplies ready, maintain communication trees, and review evacuation and shelter checklists.'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
              <Radio size={12} /> live advisory mode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



