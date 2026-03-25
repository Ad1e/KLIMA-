import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, FileSearch, CloudLightning, HelpCircle, LogOut, Clock } from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import CampusSummary, { getCardStatus } from './CampusSummary';
import type { RiskLevel } from './CampusSummary';
import RiskMap from './RiskMap';
import EarthquakeAnalysis from './EarthquakeAnalysis';
import TropicalCycloneAnalysis from './TropicalCycloneAnalysis';
import DetailedSiteAnalysis from './DetailedSiteAnalysis';
import HelpSection from './help.tsx';
import Historical from './Historical';
import {
  fetchCampusWeather,
  type CampusWeather,
} from './services/weather';

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('local');
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'dark'>('street');
  const [campusWeather, setCampusWeather] = useState<CampusWeather[]>([]);
  const [isLiveWeather, setIsLiveWeather] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCampusName, setSelectedCampusName] = useState<string | null>(null);

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const navItems = [
    { id: 'local', label: 'Local Analysis', icon: LayoutDashboard, active: true },
    { id: 'site', label: 'Site Analysis', icon: FileSearch, active: false },
    { id: 'eq', label: 'EQ Analysis', icon: Activity, active: false },
    { id: 'tc', label: 'TC Analysis', icon: CloudLightning, active: false },
    { id: 'historical', label: 'Historical', icon: Clock, active: false },
    { id: 'help', label: 'Help', icon: HelpCircle, active: false },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      try {
        const data = await fetchCampusWeather();
        if (!isMounted) return;
        setCampusWeather(data);
        setIsLiveWeather(true);
        setLastUpdated(new Date());
      } catch {
        if (!isMounted) return;
        setCampusWeather([]);
        setIsLiveWeather(false);
        setLastUpdated(new Date());
      }
    };

    void loadWeather();
    const refreshId = setInterval(() => {
      void loadWeather();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(refreshId);
    };
  }, []);

  const observationSummary = useMemo(() => {
    const monitored = campusWeather.filter((campus) => campus.warning);
    const totalRain = campusWeather.reduce((sum, campus) => sum + Number(campus.rain), 0);
    const avgHumidity =
      campusWeather.length > 0
        ? Math.round(
            campusWeather.reduce((sum, campus) => sum + Number(campus.humidity), 0) /
              campusWeather.length,
          )
        : 0;
    const topRainCampus = [...campusWeather].sort((a, b) => Number(b.rain) - Number(a.rain))[0];
    const strongestWind = [...campusWeather].sort(
      (a, b) => Number(b.windSpeed) - Number(a.windSpeed),
    )[0];

    return {
      monitoredCount: monitored.length,
      totalRain: totalRain.toFixed(2),
      avgHumidity,
      topRainCampus,
      strongestWind,
    };
  }, [campusWeather]);

  const selectedCampus = useMemo(() => {
    if (!selectedCampusName) {
      return null;
    }

    return campusWeather.find((campus) => campus.name === selectedCampusName) ?? null;
  }, [campusWeather, selectedCampusName]);

  useEffect(() => {
    if (campusWeather.length === 0) {
      setSelectedCampusName(null);
      return;
    }

    setSelectedCampusName((previous) => {
      if (previous && campusWeather.some((campus) => campus.name === previous)) {
        return previous;
      }

      return campusWeather[0].name;
    });
  }, [campusWeather]);

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(0,129,142,0.12),transparent_36%),radial-gradient(circle_at_88%_3%,rgba(0,97,147,0.1),transparent_40%),linear-gradient(165deg,#ffffff_0%,#fff5f6_55%,#ffeef0_100%)]">
      {/* Sidebar */}
      <div className="relative flex h-screen w-72 shrink-0 flex-col border-r border-[#d2232a]/40 bg-[linear-gradient(180deg,#911d1f_0%,#d2232a_46%,#414042_100%)] text-white shadow-[14px_0_50px_rgba(65,64,66,0.42)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(251,175,38,0.14),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(210,35,42,0.18),transparent_36%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-[#414042]/0 via-[#414042]/60 to-[#414042]/0" />
        {/* Logo Card */}
        <div className="relative z-10 border-b border-[#d2232a]/35 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#414042]/35 bg-[#414042]/12 p-4 backdrop-blur-md shadow-[0_12px_35px_rgba(65,64,66,0.25)]">
            <img src={bsuLogo} alt="BSU Logo" className="h-10 w-10 rounded-xl bg-[#414042]/96 p-1" />
            <div>
              <h3 className="font-['Trebuchet_MS',sans-serif] text-base font-black tracking-[0.14em] text-white">BatstateU</h3>
              <p className="font-['Trebuchet_MS',sans-serif] text-[11px] uppercase tracking-[0.16em] text-[#fbaf26]/95">Risk Alert Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="modern-scrollbar-dark relative z-10 flex-1 space-y-2 overflow-y-auto px-4 py-5">
          <p className="px-2 pb-2 font-['Trebuchet_MS',sans-serif] text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  isActive
                    ? 'border border-[#fbaf26]/55 bg-[#414042]/18 text-white shadow-[0_12px_28px_rgba(145,29,31,0.36)] backdrop-blur-md'
                    : 'border border-transparent text-white/90 hover:border-[#fbaf26]/35 hover:bg-[#414042]/10 hover:text-[#fbaf26]'
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-[#414042]/20 text-white' : 'bg-[#414042]/28 text-white group-hover:bg-[#414042]/18'
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="font-['Trebuchet_MS',sans-serif] text-[13px] font-semibold tracking-[0.02em]">{item.label}</span>
                {isActive ? <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#fbaf26] shadow-[0_0_0_5px_rgba(251,175,38,0.25)]" /> : null}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative z-10 space-y-3 border-t border-[#d2232a]/35 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#911d1f] to-[#d2232a] px-4 py-2.5 font-['Trebuchet_MS',sans-serif] text-sm font-semibold tracking-[0.03em] text-white shadow-[0_12px_30px_rgba(210,35,42,0.35)] transition-all hover:brightness-110"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="modern-scrollbar h-screen flex-1 overflow-y-auto bg-[radial-gradient(circle_at_18%_14%,rgba(0,129,142,0.1),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(210,35,42,0.08),transparent_42%),linear-gradient(180deg,#ffffff_0%,#fff7f8_100%)]">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-[#d2232a]/25 bg-white/92 p-6 backdrop-blur-lg">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-[#007e42]"></div>
              <div>
                <p className="text-sm font-semibold text-[#414042]">System Status</p>
                <p className="text-xs text-[#414042]/80">All field sensors operational</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {activeNav === 'site' ? (
          <DetailedSiteAnalysis />
        ) : activeNav === 'eq' ? (
          <EarthquakeAnalysis mapMode={mapMode} onMapModeChange={setMapMode} />
        ) : activeNav === 'tc' ? (
          <TropicalCycloneAnalysis mapMode={mapMode} onMapModeChange={setMapMode} />
        ) : activeNav === 'historical' ? (
          <Historical />
        ) : activeNav === 'help' ? (
          <HelpSection />
        ) : (
        <div className="p-8">
          {/* 1. Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#414042]">Local Risk Assessment</h1>
            <p className="mt-1 text-sm text-[#414042]/80">
              As of{' '}
              {lastUpdated
                ? lastUpdated.toLocaleString([], {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Loading live weather'}{' '}
              • Batangas State University
            </p>
          </header>

          {/* 2. Campus Summary Cards */}
          <CampusSummary campusData={campusWeather} dataSource={isLiveWeather ? 'live' : 'fallback'} />

          {/* 3. The Map & Table Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Map */}
            <div className="col-span-12 lg:col-span-6">
              <div className="h-full rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/96 to-[#d2232a]/8 p-6 shadow-[0_20px_65px_rgba(65,64,66,0.12)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#414042]">Risk Map</h3>
                </div>
                <RiskMap
                  mapMode={mapMode}
                  onCampusSelect={setSelectedCampusName}
                  onMapModeChange={setMapMode}
                  campusRisks={campusWeather.map(c => ({ name: c.name, level: getCardStatus(c).level }))}
                  isLive={isLiveWeather}
                />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'High Risk', color: 'bg-[#d2232a]' },
                    { label: 'Medium Risk', color: 'bg-[#fbaf26]' },
                    { label: 'Low Risk', color: 'bg-[#009748]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-[#414042]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Section */}
            <div className="col-span-12 lg:col-span-6">
              {/* Current Observations */}
              <div className="h-full rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/96 to-[#911d1f]/8 p-6 shadow-[0_20px_65px_rgba(65,64,66,0.12)] backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#414042]">Current Observations</h3>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${
                      isLiveWeather
                        ? 'border-[#00818e]/45 bg-[#00818e]/16 text-[#006193]'
                        : 'border-[#d2232a]/25 bg-white text-[#414042]/80'
                    }`}
                  >
                    {isLiveWeather ? 'Live API' : 'Fallback'}
                  </span>
                </div>

                <div className="mb-4 rounded-xl border border-[#d2232a]/20 bg-white/92 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#414042]/80">Selected Campus</p>
                    <p className="text-[10px] font-semibold text-[#006193]">Click a map icon to update</p>
                  </div>
                  {selectedCampus ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#414042]">{selectedCampus.name}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                            selectedCampus.warning
                              ? 'bg-[#fbaf26]/30 text-[#fbaf26]'
                              : 'bg-[#009748]/25 text-[#007e42]'
                          }`}
                        >
                          {selectedCampus.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#414042]/80">No campus selected yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#414042]/80">Monitored Campuses</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#414042]">{observationSummary.monitoredCount}</p>
                  </div>
                  <div className="rounded-xl border border-[#d2232a]/20 bg-white/92 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#414042]/80">Total Rainfall</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#414042]">{observationSummary.totalRain} mm</p>
                  </div>
                  {/* Campuses Exceeding Any Risk Threshold */}
                  {(() => {
                    // List of metrics to check
                    const METRICS = [
                      { key: 'rain', label: 'Rainfall', unit: 'mm', threshold: 30 },
                      { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h', threshold: 60 },
                      { key: 'heatIndex', label: 'Temperature', unit: '°C', threshold: 39 },
                      { key: 'humidity', label: 'Humidity', unit: '%', threshold: 90 },
                      { key: 'dewPoint', label: 'Dew Point', unit: '°C', threshold: 28 },
                      { key: 'windGust', label: 'Wind Gust', unit: 'km/h', threshold: 80 },
                      { key: 'visibility', label: 'Visibility', unit: 'km', threshold: 2, inverted: true },
                    ] as const;

                    type MetricKey = 'rain' | 'windSpeed' | 'heatIndex' | 'humidity' | 'dewpoint' | 'windGust' | 'visibility';
                    const getMetricValue = (campus: CampusWeather, key: MetricKey): number | undefined => {
                      if (key === 'rain') return Number(campus.rain);
                      if (key === 'windSpeed') return Number(campus.windSpeed);
                      if (key === 'heatIndex') return Number(campus.heatIndex);
                      if (key === 'humidity') return Number(campus.humidity);
                      if (key === 'dewpoint') return Number(campus.dewpoint);
                      if (key === 'windGust') return Number(campus.windGust);
                      if (key === 'visibility') return Number(campus.visibility);
                      return undefined;
                    };
                    // Find all campuses with any metric exceeding its risk threshold
                    const exceeded = campusWeather.flatMap(campus => {
                      const exceededMetrics = METRICS.filter(metric => {
                        const value = getMetricValue(campus, metric.key as MetricKey);
                        if (value === undefined || isNaN(value)) return false;
                        if ('inverted' in metric && metric.inverted) return value < metric.threshold;
                        return value >= metric.threshold;
                      });
                      if (exceededMetrics.length === 0) return [];
                      return [{ campus, exceededMetrics }];
                    });
                    if (exceeded.length === 0) return null;
                    const colorMap = {
                      safe: 'border-[#009748]/30 bg-[#009748]/10 text-[#007e42]',
                      monitor: 'border-[#ffd600]/35 bg-[#ffd600]/10 text-[#bfa600]', // strong yellow
                      caution: 'border-[#ffe066]/35 bg-[#ffe066]/10 text-[#bfa600]',
                      warning: 'border-[#ff922b]/35 bg-[#ff922b]/10 text-[#b85c00]',
                      danger: 'border-[#d2232a]/30 bg-[#d2232a]/8 text-[#911d1f]',
                      risk: 'border-[#d2232a]/30 bg-[#d2232a]/8 text-[#911d1f]',
                    };
                    return exceeded.map(({ campus, exceededMetrics }) => {
                      const risk = getCardStatus(campus).level;
                      return (
                        <div key={campus.name + '-exceeded'} className={`col-span-1 rounded-xl border p-2.5 ${colorMap[risk]}`}>
                          <p className="text-[10px] uppercase tracking-[0.12em]">Exceeded</p>
                          <p className="mt-1 text-xs font-semibold">{campus.name}</p>
                          <ul className="text-[11px] ml-2 list-disc">
                            {exceededMetrics.map(metric => (
                              <li key={metric.key}>
                                {metric.label}: {getMetricValue(campus, metric.key as MetricKey)} {metric.unit}
                              </li>
                            ))}
                          </ul>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{risk}</span>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="mt-4 rounded-xl border border-[#d2232a]/20 bg-white/92 p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#414042]/80">Selected Campus Metrics</p>
                  {selectedCampus ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {[
                        { key: 'heatIndex', label: 'Temperature', unit: '°C', value: selectedCampus.heatIndex },
                        { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h', value: selectedCampus.windSpeed },
                        { key: 'humidity', label: 'Humidity', unit: '%', value: selectedCampus.humidity },
                        { key: 'rain', label: 'Rainfall', unit: 'mm', value: selectedCampus.rain },
                      ].map(metric => {
                        const risk: RiskLevel = getCardStatus({ ...selectedCampus, [metric.key]: metric.value }).level;
                        const colorMap: Record<RiskLevel, string> = {
                          safe: 'border-[#009748]/30 bg-[#009748]/10 text-[#007e42]',
                          monitor: 'border-[#fbaf26]/35 bg-[#fbaf26]/10 text-[#92610a]',
                          warning: 'border-[#ff922b]/35 bg-[#ff922b]/10 text-[#b85c00]',
                          danger: 'border-[#d2232a]/30 bg-[#d2232a]/8 text-[#911d1f]',
                          risk: 'border-[#d2232a]/30 bg-[#d2232a]/8 text-[#911d1f]',
                        };
                        return (
                          <div key={metric.key} className={`rounded-xl border px-3 py-3 ${colorMap[risk]}`}>
                            <p className="text-[10px] uppercase tracking-[0.1em] text-[#414042]/80">{metric.label}</p>
                            <p className="mt-1 text-xl font-extrabold">{metric.value} {metric.unit}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{risk}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#414042]/80">Select a campus on the map to view its metrics.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}    
