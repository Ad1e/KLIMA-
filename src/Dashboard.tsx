import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Settings,
  HelpCircle,
  LogOut,
  Phone,
  Cloud,
  AlertCircle,
  MessageSquare,
  Eye,
  Layers,
  TrendingUp,
  Bell,
  User,
} from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import CampusSummary from './CampusSummary';
import RiskMap from './RiskMap';
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
  const [mapMode, setMapMode] = useState('street');
  const [campusWeather, setCampusWeather] = useState<CampusWeather[]>(getFallbackCampusWeather());
  const [isLiveWeather, setIsLiveWeather] = useState(false);

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const navItems = [
    { id: 'local', label: 'Local Analysis', icon: LayoutDashboard, active: true },
    { id: 'regional', label: 'Regional View', icon: MapPin, active: false },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, active: false },
    { id: 'reports', label: 'Reports', icon: MessageSquare, active: false },
    { id: 'settings', label: 'Settings', icon: Settings, active: false },
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
      } catch {
        if (!isMounted) return;
        setCampusWeather(getFallbackCampusWeather());
        setIsLiveWeather(false);
      }
    };

    void loadWeather();
    return () => {
      isMounted = false;
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

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(45,212,191,0.2),transparent_34%),radial-gradient(circle_at_88%_3%,rgba(56,189,248,0.18),transparent_38%),linear-gradient(165deg,#f4f7fb_0%,#edf3fb_45%,#e8eef8_100%)]">
      {/* Sidebar */}
      <div className="flex h-screen w-72 shrink-0 flex-col rounded-none border-r border-slate-800/40 bg-[linear-gradient(180deg,#0f172a_0%,#13253f_45%,#0a1020_100%)] text-slate-100 shadow-[12px_0_45px_rgba(2,6,23,0.45)]">
        {/* Logo Card */}
        <div className="border-b border-slate-600/35 p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-300/25 bg-white/10 p-4 backdrop-blur-md">
            <img src={bsuLogo} alt="BSU Logo" className="w-10 h-10" />
            <div>
              <h3 className="text-sm font-bold tracking-[0.08em]">KLIMA</h3>
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/90">Risk Alert</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'border border-cyan-200/35 bg-cyan-300/20 text-cyan-50 shadow-[0_12px_26px_rgba(8,47,73,0.35)] backdrop-blur-sm'
                    : 'text-slate-200/90 hover:border hover:border-slate-300/20 hover:bg-white/10 hover:text-cyan-100'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-3 border-t border-slate-600/35 p-4">
          <div className="rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-amber-300" />
              <p className="text-xs font-semibold">Emergency</p>
            </div>
            <p className="text-sm font-bold tracking-wide">+63 917 XXX XXXX</p>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium transition-colors hover:bg-rose-800">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-screen flex-1 overflow-y-auto bg-[radial-gradient(circle_at_18%_14%,rgba(45,212,191,0.16),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.16),transparent_40%)]">
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
            <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-cyan-50 hover:text-cyan-700">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-700">
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

        {/* Dashboard Grid */}
        <div className="p-8">
          {/* 1. Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Local Risk Assessment</h1>
            <p className="mt-1 text-sm text-slate-600">As of March 18, 2026 • Batangas State University</p>
          </header>

          {/* 2. Campus Summary Cards */}
          <CampusSummary />

          {/* 3. The Map & Table Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Map */}
            <div className="col-span-12 lg:col-span-7">
              <div className="min-h-96 rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-cyan-50/40 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Risk Map</h3>
                  <div className="flex gap-2">
                    {[
                      { key: 'street', label: 'Street', icon: <Eye size={14} className="inline mr-1" /> },
                      {
                        key: 'satellite',
                        label: 'Satellite',
                        icon: <Layers size={14} className="inline mr-1" />,
                      },
                      { key: 'dark', label: 'Dark', icon: null },
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
                <RiskMap campusWeather={campusWeather} mapMode={mapMode} />
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
            <div className="col-span-12 lg:col-span-5">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Monitored Campuses</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{observationSummary.monitoredCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Total Rainfall</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{observationSummary.totalRain} mm</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Highest Rain Campus</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {observationSummary.topRainCampus?.name ?? 'N/A'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {observationSummary.topRainCampus?.rain ?? '0.00'} mm rain, chance{' '}
                      {observationSummary.topRainCampus?.rainPossibility ?? '0%'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Avg Humidity</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{observationSummary.avgHumidity}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Strongest Wind</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {observationSummary.strongestWind?.name ?? 'N/A'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {observationSummary.strongestWind?.windSpeed ?? '0'} km/h
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Campus Snapshot</p>
                  <div className="mt-2 space-y-2">
                    {campusWeather.slice(0, 4).map((campus) => (
                      <div key={campus.name} className="flex items-center justify-between rounded-lg border border-cyan-100/70 bg-cyan-50/45 px-2.5 py-2">
                        <p className="text-xs font-semibold text-slate-700">{campus.name}</p>
                        <p className="text-xs font-bold text-cyan-700">{campus.rain} mm</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="mt-6 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-cyan-50/40 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.09)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Temperature</h4>
                  <Cloud size={20} className="text-sky-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">28°C</p>
                <p className="mt-2 text-sm text-slate-600">↑2° from last hour</p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-amber-50/40 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.09)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Humidity</h4>
                  <AlertCircle size={20} className="text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">72%</p>
                <p className="mt-2 text-sm text-slate-600">Moderate level</p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-teal-50/45 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.09)] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Wind Speed</h4>
                  <TrendingUp size={20} className="text-teal-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">12 km/h</p>
                <p className="mt-2 text-sm text-slate-600">↓1 km/h trend</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}    