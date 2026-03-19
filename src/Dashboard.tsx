import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FileSearch,
  CloudLightning,
  HelpCircle,
  LogOut,
  Eye,
  Layers,
  Bell,
  User,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import CampusSummary from './CampusSummary';
import RiskMap from './RiskMap';
import EarthquakeAnalysis from './EarthquakeAnalysis';
import TropicalCycloneAnalysis from './TropicalCycloneAnalysis';
import DetailedSiteAnalysis from './DetailedSiteAnalysis';
import HelpSection from './help.tsx';
import {
  fetchCampusWeather,
  getFallbackCampusWeather,
  type CampusWeather,
} from './services/weather';

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('local');
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'dark'>('street');
  const [campusWeather, setCampusWeather] = useState<CampusWeather[]>(getFallbackCampusWeather());
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
        setCampusWeather(getFallbackCampusWeather());
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
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(45,212,191,0.2),transparent_34%),radial-gradient(circle_at_88%_3%,rgba(56,189,248,0.18),transparent_38%),linear-gradient(165deg,#f4f7fb_0%,#edf3fb_45%,#e8eef8_100%)]">
      {/* Sidebar */}
      <div className="relative flex h-screen w-72 shrink-0 flex-col border-r border-[#571010]/35 bg-[linear-gradient(180deg,#4a0303_0%,#7f0d0d_46%,#2a0505_100%)] text-slate-100 shadow-[14px_0_50px_rgba(29,7,7,0.42)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,215,145,0.12),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(255,188,188,0.16),transparent_36%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-rose-200/0 via-rose-200/50 to-rose-200/0" />
        {/* Logo Card */}
        <div className="relative z-10 border-b border-red-300/25 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur-md shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <img src={bsuLogo} alt="BSU Logo" className="h-10 w-10 rounded-xl bg-white/95 p-1" />
            <div>
              <h3 className="font-['Trebuchet_MS',sans-serif] text-base font-black tracking-[0.14em] text-white">KLIMA</h3>
              <p className="font-['Trebuchet_MS',sans-serif] text-[11px] uppercase tracking-[0.16em] text-rose-50/90">Risk Alert Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="modern-scrollbar-dark relative z-10 flex-1 space-y-2 overflow-y-auto px-4 py-5">
          <p className="px-2 pb-2 font-['Trebuchet_MS',sans-serif] text-[10px] font-bold uppercase tracking-[0.2em] text-rose-100/80">
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
                    ? 'border border-rose-100/50 bg-white/18 text-white shadow-[0_12px_28px_rgba(127,29,29,0.36)] backdrop-blur-md'
                    : 'border border-transparent text-slate-100/90 hover:border-white/25 hover:bg-white/10 hover:text-rose-50'
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/15 text-rose-100 group-hover:bg-white/15'
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="font-['Trebuchet_MS',sans-serif] text-[13px] font-semibold tracking-[0.02em]">{item.label}</span>
                {isActive ? <span className="ml-auto h-2.5 w-2.5 rounded-full bg-rose-100 shadow-[0_0_0_5px_rgba(255,255,255,0.1)]" /> : null}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative z-10 space-y-3 border-t border-red-300/25 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#ef4444] px-4 py-2.5 font-['Trebuchet_MS',sans-serif] text-sm font-semibold tracking-[0.03em] text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)] transition-all hover:brightness-110"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="modern-scrollbar h-screen flex-1 overflow-y-auto bg-[radial-gradient(circle_at_18%_14%,rgba(45,212,191,0.16),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.16),transparent_40%)]">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-slate-200/75 bg-white/82 p-6 backdrop-blur-lg">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">System Status</p>
                <p className="text-xs text-slate-600">All field sensors operational</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-none border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 rounded-none border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-gradient-to-br from-cyan-500 to-sky-700">
                <User size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Admin</p>
                <p className="text-xs text-slate-600">Operator</p>
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
        ) : activeNav === 'help' ? (
          <HelpSection />
        ) : (
        <div className="p-8">
          {/* 1. Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Local Risk Assessment</h1>
            <p className="mt-1 text-sm text-slate-600">
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
              <div className="h-full rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-cyan-50/40 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Risk Map</h3>
                  <div className="flex gap-2">
                    {[
                      {
                        key: 'street' as const,
                        label: 'Street',
                        icon: <Eye size={14} className="inline mr-1" />,
                      },
                      {
                        key: 'satellite' as const,
                        label: 'Satellite',
                        icon: <Layers size={14} className="inline mr-1" />,
                      },
                      { key: 'dark' as const, label: 'Dark', icon: null },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setMapMode(mode.key)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          mapMode === mode.key
                            ? 'bg-sky-700 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'
                        }`}
                      >
                        {mode.icon}
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                <RiskMap
                  mapMode={mapMode}
                  onCampusSelect={setSelectedCampusName}
                />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'High Risk', color: 'bg-rose-600' },
                    { label: 'Medium Risk', color: 'bg-amber-500' },
                    { label: 'Low Risk', color: 'bg-emerald-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Section */}
            <div className="col-span-12 lg:col-span-6">
              {/* Current Observations */}
              <div className="h-full rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-sky-50/45 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Current Observations</h3>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${
                      isLiveWeather
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isLiveWeather ? 'Live API' : 'Fallback'}
                  </span>
                </div>

                <div className="mb-4 rounded-xl border border-slate-200 bg-white/90 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Selected Campus</p>
                    <p className="text-[10px] font-semibold text-cyan-700">Click a map icon to update</p>
                  </div>
                  {selectedCampus ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{selectedCampus.name}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                            selectedCampus.warning
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {selectedCampus.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-600">No campus selected yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Monitored Campuses</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{observationSummary.monitoredCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Total Rainfall</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{observationSummary.totalRain} mm</p>
                  </div>
                  <div className="col-span-1 rounded-xl border border-slate-200 bg-white/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Highest Rain Campus</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                      {observationSummary.topRainCampus?.name ?? 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {observationSummary.topRainCampus?.rain ?? '0.00'} mm rain
                    </p>
                  </div>
                  <div className="col-span-1 rounded-xl border border-slate-200 bg-white/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Strongest Wind</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                      {observationSummary.strongestWind?.name ?? 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {observationSummary.strongestWind?.windSpeed ?? '0'} km/h
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Selected Campus Metrics</p>
                  {selectedCampus ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-cyan-100/80 bg-cyan-50/55 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Temperature</p>
                        <p className="mt-1 text-xl font-extrabold text-cyan-800">{selectedCampus.heatIndex} degC</p>
                      </div>
                      <div className="rounded-xl border border-cyan-100/80 bg-cyan-50/55 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Wind Speed</p>
                        <p className="mt-1 text-xl font-extrabold text-cyan-800">{selectedCampus.windSpeed} km/h</p>
                      </div>
                      <div className="rounded-xl border border-cyan-100/80 bg-cyan-50/55 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Humidity</p>
                        <p className="mt-1 text-xl font-extrabold text-cyan-800">{selectedCampus.humidity}%</p>
                      </div>
                      <div className="rounded-xl border border-cyan-100/80 bg-cyan-50/55 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Rain Chance</p>
                        <p className="mt-1 text-xl font-extrabold text-cyan-800">{selectedCampus.rainPossibility}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-600">Select a campus on the map to view its metrics.</p>
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