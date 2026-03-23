import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES } from './services/weather';

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
  className: 'rounded-full border-2 border-white shadow-[0_8px_20px_rgba(65,64,66,0.35)] bg-white',
});

interface RiskMapProps {
  mapMode: string;
  onCampusSelect?: (campusName: string) => void;
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

export default function RiskMap({
  mapMode,
  onCampusSelect,
}: RiskMapProps) {
  const center: [number, number] = [13.93, 121.02];
  const tileUrl = getTileUrl(mapMode);

  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-xl border border-[#d2232a]/25 bg-white shadow-inner">
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
          return (
            <Marker
              key={campus.name}
              position={[campus.lat, campus.lon]}
              icon={bsuCampusIcon}
              eventHandlers={{
                click: () => onCampusSelect?.(campus.name),
              }}
            />
          );
        })}
      </MapContainer>

      <div className="absolute right-4 top-4 z-[1000] space-y-2 rounded-xl border border-[#d2232a]/25 bg-white p-3 text-[10px] font-bold text-[#414042] shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#009748]" /> SAFE
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#fbaf26]" /> MONITORING
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#d2232a]" /> CRITICAL
        </div>
      </div>
    </div>
  );
}
