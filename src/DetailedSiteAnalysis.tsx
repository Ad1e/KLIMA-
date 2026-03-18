import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  Eye,
  Flame,
  Gauge,
  ListFilter,
  Search,
  Settings2,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import { CAMPUSES } from './services/weather';

type AnalysisTab = 'observed' | 'forecast' | 'synopsis';
type ColumnKey = 'timestamp' | 'rain' | 'temp' | 'wind' | 'humidity' | 'pressure' | 'cloud';
type Severity = 'safe' | 'caution' | 'warning';

interface DataRow {
  timestamp: string;
  rain: number;
  temp: number;
  wind: number;
  humidity: number;
  pressure: number;
  cloud: number;
}

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  severity: Severity;
}

const SITE_CAMPUSES = [
  ...CAMPUSES.map((campus) => campus.name),
];

const ALANGILAN_CENTER: [number, number] = [13.784295, 121.07428];

const bsuCampusIcon = L.icon({
  iconUrl: bsuLogo,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
  className: 'rounded-full border-2 border-white shadow-[0_6px_18px_rgba(15,23,42,0.35)] bg-white',
});

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

const COLUMNS: ColumnDefinition[] = [
  { key: 'timestamp', label: 'Date / Time' },
  { key: 'rain', label: 'Rain (mm)' },
  { key: 'temp', label: 'Temp (degC)' },
  { key: 'wind', label: 'Wind (km/h)' },
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'pressure', label: 'Pressure (hPa)' },
  { key: 'cloud', label: 'Cloud (%)' },
];

const observedData: DataRow[] = [
  { timestamp: 'Mar 18, 2026 • 06:00', rain: 0, temp: 28, wind: 12, humidity: 72, pressure: 1012, cloud: 45 },
  { timestamp: 'Mar 18, 2026 • 08:00', rain: 0.2, temp: 29, wind: 13, humidity: 74, pressure: 1011, cloud: 52 },
  { timestamp: 'Mar 18, 2026 • 10:00', rain: 0, temp: 31, wind: 15, humidity: 69, pressure: 1010, cloud: 35 },
  { timestamp: 'Mar 18, 2026 • 12:00', rain: 0.5, temp: 32, wind: 18, humidity: 71, pressure: 1010, cloud: 58 },
  { timestamp: 'Mar 18, 2026 • 14:00', rain: 1.1, temp: 30, wind: 21, humidity: 78, pressure: 1009, cloud: 72 },
  { timestamp: 'Mar 18, 2026 • 16:00', rain: 0.4, temp: 29, wind: 17, humidity: 80, pressure: 1009, cloud: 67 },
  { timestamp: 'Mar 18, 2026 • 18:00', rain: 0, temp: 28, wind: 14, humidity: 82, pressure: 1010, cloud: 50 },
  { timestamp: 'Mar 18, 2026 • 20:00', rain: 0.7, temp: 27, wind: 11, humidity: 83, pressure: 1011, cloud: 62 },
  { timestamp: 'Mar 18, 2026 • 22:00', rain: 0, temp: 26, wind: 10, humidity: 84, pressure: 1012, cloud: 41 },
  { timestamp: 'Mar 19, 2026 • 00:00', rain: 0, temp: 25, wind: 9, humidity: 85, pressure: 1013, cloud: 38 },
];

const forecastData: DataRow[] = [
  { timestamp: 'Mar 19, 2026 • 06:00', rain: 0.9, temp: 29, wind: 16, humidity: 79, pressure: 1010, cloud: 64 },
  { timestamp: 'Mar 19, 2026 • 09:00', rain: 1.4, temp: 30, wind: 18, humidity: 81, pressure: 1009, cloud: 75 },
  { timestamp: 'Mar 19, 2026 • 12:00', rain: 2.2, temp: 31, wind: 22, humidity: 84, pressure: 1008, cloud: 82 },
  { timestamp: 'Mar 19, 2026 • 15:00', rain: 1.8, temp: 30, wind: 24, humidity: 86, pressure: 1008, cloud: 88 },
  { timestamp: 'Mar 19, 2026 • 18:00', rain: 1.1, temp: 29, wind: 20, humidity: 85, pressure: 1009, cloud: 76 },
  { timestamp: 'Mar 19, 2026 • 21:00', rain: 0.6, temp: 27, wind: 15, humidity: 84, pressure: 1010, cloud: 63 },
  { timestamp: 'Mar 20, 2026 • 00:00', rain: 0.2, temp: 26, wind: 13, humidity: 82, pressure: 1011, cloud: 54 },
  { timestamp: 'Mar 20, 2026 • 03:00', rain: 0, temp: 25, wind: 11, humidity: 81, pressure: 1012, cloud: 42 },
  { timestamp: 'Mar 20, 2026 • 06:00', rain: 0, temp: 26, wind: 10, humidity: 78, pressure: 1012, cloud: 37 },
  { timestamp: 'Mar 20, 2026 • 09:00', rain: 0.3, temp: 30, wind: 12, humidity: 75, pressure: 1011, cloud: 44 },
];

const synopsisActions = [
  { parameter: 'Strong Wind Gusts', action: 'Avoid outdoor scaffold work near open areas.' },
  { parameter: 'Moderate Rainfall Bands', action: 'Caution on low-lying campus roads and pathways.' },
  { parameter: 'Class Operations', action: 'Resume regular classes with advisory-level monitoring.' },
  { parameter: 'Laboratory Activities', action: 'Caution for equipment setup in exposed facilities.' },
];

const getActionClass = (action: string): string => {
  const normalized = action.toLowerCase();
  if (normalized.includes('resume')) {
    return 'bg-emerald-500 text-white';
  }
  if (normalized.includes('avoid') || normalized.includes('caution')) {
    return 'bg-amber-500 text-white';
  }
  return 'bg-slate-500 text-white';
};

const getTempClass = (temp: number): string => {
  return temp > 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
};

const getRainClass = (rain: number): string => {
  return rain > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500';
};

const getSeverityClass = (severity: Severity): string => {
  if (severity === 'warning') return 'bg-orange-500';
  if (severity === 'caution') return 'bg-amber-400';
  return 'bg-emerald-500';
};

function MetricCard({ label, value, icon: Icon, severity }: MetricCardProps) {
  return (
    <article className={`rounded-2xl p-4 text-white shadow-sm ${getSeverityClass(severity)}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">{label}</p>
        <Icon size={16} className="text-white/90" />
      </div>
      <p className="text-2xl font-black leading-none">{value}</p>
    </article>
  );
}

export default function DetailedSiteAnalysis() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('observed');
  const [selectedCampus, setSelectedCampus] = useState(SITE_CAMPUSES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnPopover, setShowColumnPopover] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(COLUMNS.map((column) => column.key));
  const [page, setPage] = useState(1);

  const rows = forecastData;
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(term)));
  }, [rows, searchTerm]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const latestObserved = observedData[3];

  const observedMetrics = [
    {
      label: 'Rain (mm)',
      value: `${latestObserved.rain.toFixed(2)} mm`,
      icon: CloudRain,
      severity: latestObserved.rain > 1 ? 'warning' : latestObserved.rain > 0 ? 'caution' : 'safe',
    },
    {
      label: 'Rain Probability (%)',
      value: '68 %',
      icon: CloudRain,
      severity: 'caution',
    },
    {
      label: 'MSLP (hPa)',
      value: `${latestObserved.pressure.toFixed(0)} hPa`,
      icon: Gauge,
      severity: latestObserved.pressure < 1009 ? 'warning' : latestObserved.pressure < 1011 ? 'caution' : 'safe',
    },
    {
      label: 'Humidity (%)',
      value: `${latestObserved.humidity.toFixed(0)} %`,
      icon: Droplets,
      severity: latestObserved.humidity > 85 ? 'warning' : latestObserved.humidity > 75 ? 'caution' : 'safe',
    },
    {
      label: 'Temperature (degC)',
      value: `${latestObserved.temp.toFixed(2)} degC`,
      icon: Thermometer,
      severity: latestObserved.temp > 32 ? 'warning' : latestObserved.temp > 30 ? 'caution' : 'safe',
    },
    {
      label: 'Dewpoint (degC)',
      value: '24.10 degC',
      icon: Thermometer,
      severity: 'caution',
    },
    {
      label: 'Heat Index (degC)',
      value: '36.20 degC',
      icon: Flame,
      severity: 'warning',
    },
    {
      label: 'Wind Direction (deg)',
      value: '128 deg',
      icon: Compass,
      severity: 'caution',
    },
    {
      label: 'Wind Gust (kph)',
      value: `${(latestObserved.wind + 7).toFixed(1)} kph`,
      icon: Wind,
      severity: latestObserved.wind + 7 > 24 ? 'warning' : latestObserved.wind + 7 > 16 ? 'caution' : 'safe',
    },
    {
      label: 'Wind Speed (kph)',
      value: `${latestObserved.wind.toFixed(1)} kph`,
      icon: Wind,
      severity: latestObserved.wind > 20 ? 'warning' : latestObserved.wind > 14 ? 'caution' : 'safe',
    },
    {
      label: 'Visibility (km)',
      value: '8.40 km',
      icon: Eye,
      severity: 'safe',
    },
    {
      label: 'Cloud Cover (%)',
      value: `${latestObserved.cloud.toFixed(0)} %`,
      icon: Cloud,
      severity: latestObserved.cloud > 80 ? 'warning' : latestObserved.cloud > 60 ? 'caution' : 'safe',
    },
  ] as const;

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const renderCell = (row: DataRow, key: ColumnKey) => {
    if (key === 'timestamp') {
      return <span className="text-xs font-semibold text-slate-700">{row.timestamp}</span>;
    }

    if (key === 'temp') {
      return (
        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${getTempClass(row.temp)}`}>
          {row.temp}
        </span>
      );
    }

    if (key === 'rain') {
      return (
        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${getRainClass(row.rain)}`}>
          {row.rain}
        </span>
      );
    }

    const value = row[key];
    return <span className="text-xs font-semibold text-slate-700">{value}</span>;
  };

  return (
    <div className="min-h-full bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <select
              value={selectedCampus}
              onChange={(event) => setSelectedCampus(event.target.value)}
              className="w-fit rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-colors focus:border-rose-400"
            >
              {SITE_CAMPUSES.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
                Batangas State University - {selectedCampus} Risk Assessment
              </h1>
              <p className="mt-1 text-sm text-slate-600">Detailed Site Analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {[
                { key: 'observed' as const, label: 'Observed' },
                { key: 'forecast' as const, label: 'Forecast' },
                { key: 'synopsis' as const, label: 'Synopsis' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                    activeTab === tab.key
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {activeTab === 'synopsis' ? (
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Weather Synopsis</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                The campus is under a humid and unsettled weather regime with intermittent rain cells and variable
                wind flow from the east to southeast. Temperatures remain moderate-to-warm by mid-day with occasional
                rainfall spikes that may reduce visibility and increase localized runoff near low elevation pathways.
                Continue advisory monitoring for changing precipitation trends and wind gust episodes.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-12 border-b border-slate-100 text-xs font-bold uppercase tracking-[0.12em]">
                <div className="col-span-4 bg-rose-700 px-4 py-3 text-white">Parameter</div>
                <div className="col-span-8 bg-slate-50 px-4 py-3 text-slate-600">Action</div>
              </div>

              <div className="divide-y divide-slate-100">
                {synopsisActions.map((item) => (
                  <div key={item.parameter} className="grid grid-cols-12">
                    <div className="col-span-4 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {item.parameter}
                    </div>
                    <div className="col-span-8 px-4 py-3">
                      <span
                        className={`inline-block rounded-lg px-3 py-1.5 text-xs font-semibold ${getActionClass(item.action)}`}
                      >
                        {item.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : activeTab === 'observed' ? (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Current Observation</h2>
              <p className="mt-1 text-sm text-slate-600">Local map and field metrics for BatStateU Alangilan Campus</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-4 lg:col-span-7">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-[520px] w-full">
                    <MapContainer
                      center={ALANGILAN_CENTER}
                      zoom={9}
                      zoomControl={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <CampusViewportController />
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="&copy; Esri"
                      />
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
                      <CircleMarker
                        center={ALANGILAN_CENTER}
                        radius={8}
                        pathOptions={{ color: '#be123c', fillColor: '#f43f5e', fillOpacity: 0.8, weight: 2 }}
                      >
                        <Popup>
                          <p className="text-xs font-semibold">BatStateU Alangilan Campus</p>
                        </Popup>
                      </CircleMarker>
                      <ZoomControl position="bottomright" />
                    </MapContainer>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    onClick={() => setShowLegend((prev) => !prev)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Legend</span>
                    {showLegend ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
                  </button>

                  {showLegend ? (
                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-700 sm:grid-cols-3">
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Safe</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" /> Caution</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> Warning</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
              <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search records..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-rose-300"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowColumnPopover((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Settings2 size={14} />
                  Columns
                </button>

                {showColumnPopover ? (
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      <ListFilter size={13} /> Visible Columns
                    </div>
                    <div className="space-y-2">
                      {COLUMNS.map((column) => (
                        <label key={column.key} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(column.key)}
                            onChange={() => toggleColumn(column.key)}
                          />
                          {column.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      {COLUMNS.filter((column) => visibleColumns.includes(column.key)).map((column) => (
                        <th
                          key={column.key}
                          className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.timestamp} className="border-b border-slate-100 hover:bg-slate-50/70">
                        {COLUMNS.filter((column) => visibleColumns.includes(column.key)).map((column) => (
                          <td key={`${row.timestamp}-${column.key}`} className="whitespace-nowrap px-4 py-3 align-middle">
                            {renderCell(row, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
