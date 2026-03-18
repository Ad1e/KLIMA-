import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES, type CampusWeather } from './services/weather';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,23,42,0.35)] bg-white',
});

interface RiskMapProps {
  campusWeather: CampusWeather[];
  mapMode: string;
}

const getTileUrl = (mode: string): string => {
  if (mode === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (mode === 'dark') {
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
};

const getRiskState = (campus: CampusWeather) => {
  const rain = Number(campus.rain);
  if (rain >= 2) return { label: 'Critical', color: '#dc2626' };
  if (campus.warning) return { label: 'Monitoring', color: '#f59e0b' };
  return { label: 'Safe', color: '#16a34a' };
};

export default function RiskMap({ campusWeather, mapMode }: RiskMapProps) {
  const center: [number, number] = [13.93, 121.02];
  const tileUrl = getTileUrl(mapMode);

  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-800 shadow-inner">
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution="&copy; OpenStreetMap contributors" url={tileUrl} />
        <ZoomControl position="bottomright" />

        {CAMPUSES.map((campus) => {
          const weather = campusWeather.find((item) => item.name === campus.name);
          const risk = weather ? getRiskState(weather) : { label: 'No Data', color: '#64748b' };

          return (
            <Marker key={campus.name} position={[campus.lat, campus.lon]} icon={bsuCampusIcon}>
              <Popup>
                <div className="min-w-[180px] space-y-1 text-sm">
                  <p className="font-bold text-cyan-700">{campus.name}</p>
                  <p className="text-xs text-slate-600">Status: {risk.label}</p>
                  <p className="text-xs text-slate-600">Rain: {weather?.rain ?? '0.00'} mm</p>
                  <p className="text-xs text-slate-600">Humidity: {weather?.humidity ?? '0'}%</p>
                </div>
              </Popup>

            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute right-4 top-4 z-[1000] space-y-2 rounded-xl border border-slate-200/90 bg-white/92 p-3 text-[10px] font-bold shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" /> SAFE
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" /> MONITORING
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-600" /> CRITICAL
        </div>
      </div>
    </div>
  );
}