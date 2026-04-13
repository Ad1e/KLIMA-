import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, FileSearch, CloudLightning, HelpCircle, LogOut, Clock, Wind, CloudRain, Cloud, Thermometer, Droplets, Eye, AlertTriangle } from 'lucide-react';
import bsuLogo from './assets/bsu-logo.png';
import CampusSummary, { getCardStatus, computeRiskScore } from './CampusSummary';
import type { RiskLevel } from './CampusSummary';
import RiskMap from './RiskMap';
import EarthquakeAnalysis from './EarthquakeAnalysis';
import TropicalCycloneAnalysis from './TropicalCycloneAnalysis';
import DetailedSiteAnalysis from './DetailedSiteAnalysis';
import HelpSection from './help.tsx';
import Historical from './Historical';
import {
  fetchCampusWeather,
  generateFallbackCampusWeather,
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
  // Auto-tick the display time every minute
  const [displayTime, setDisplayTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setDisplayTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/')
  }, [onLogout, navigate]);

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
        setCampusWeather(generateFallbackCampusWeather());
        setIsLiveWeather(false);
        setLastUpdated(new Date());
      }
    };

    void loadWeather();
    const refreshId = setInterval(() => {
      void loadWeather();
    }, 10 * 60 * 1000); // 10 minutes — cache TTL is 5 min, so this is at most 1 real API call per interval

    return () => {
      isMounted = false;
      clearInterval(refreshId);
    };
  }, []);

  // Derive the overall system status color for the top bar
  const overallStatusColor = useMemo(() => {
    const levels = campusWeather.map(c => getCardStatus(c).level);
    if (levels.includes('danger') || levels.includes('risk')) return '#dc2626';
    if (levels.includes('warning')) return '#ea580c';
    if (levels.includes('monitor')) return '#d97706';
    return '#16a34a';
  }, [campusWeather]);

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
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
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
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive
                  ? 'border border-[#fbaf26]/55 bg-[#414042]/18 text-white shadow-[0_12px_28px_rgba(145,29,31,0.36)] backdrop-blur-md'
                  : 'border border-transparent text-white/90 hover:border-[#fbaf26]/35 hover:bg-[#414042]/10 hover:text-[#fbaf26]'
                  }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-[#414042]/20 text-white' : 'bg-[#414042]/28 text-white group-hover:bg-[#414042]/18'
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
      <div className="modern-scrollbar h-screen flex-1 overflow-y-auto dot-grid-bg">
        {/* 3px top status bar */}
        <div
          className="sticky top-0 z-30 h-[3px] w-full transition-colors duration-700"
          style={{ background: overallStatusColor }}
          aria-hidden="true"
        />
        {/* Header */}
        <div className="sticky top-[3px] z-20 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur-lg shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left: system status */}
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full" style={{ background: overallStatusColor }} />
              <div>
                <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>System Status</p>
                <p className="text-xs text-gray-500">All field sensors operational</p>
              </div>
            </div>
            {/* Right: timestamp + live badge */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">
                As of{' '}
                {displayTime.toLocaleString([], {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live Data
              </span>
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
              <h1 className="text-3xl font-extrabold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>Local Risk Assessment</h1>
              <p className="mt-1 text-sm text-gray-500">
                {lastUpdated
                  ? lastUpdated.toLocaleString([], {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                  : 'Loading live weather'}{' '}
                · Batangas State University
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
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d2232a]/15 bg-white/70 p-4 shadow-sm backdrop-blur-md">
                    {/* Risk Levels Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-[#414042]/60">Risk Status</span>
                      <div className="flex flex-wrap items-center gap-4">
                        {[
                          { label: 'Dangerous', color: 'bg-[#d2232a]' },
                          { label: 'Warning',   color: 'bg-[#ff922b]' },
                          { label: 'Caution',   color: 'bg-[#fbaf26]' },
                          { label: 'Safe',      color: 'bg-[#009748]' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5">
                            <div className={`h-2.5 w-2.5 rounded-full ${item.color} shadow-sm`}></div>
                            <span className="text-[11px] font-bold text-[#414042]">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-[#d2232a]/15 to-transparent" />

                    {/* Weather Hazards Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-[#414042]/60">Map Hazards</span>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                        {[
                          { label: 'Typhoon', Icon: Wind, hex: '#7c3aed' },
                          { label: 'Low Pressure', Icon: Cloud, hex: '#0ea5e9' },
                          { label: 'Tropical Cyclone', Icon: CloudRain, hex: '#06b6d4' },
                          { label: 'Thunderstorm', Icon: CloudLightning, hex: '#f59e0b' },
                        ].map(({ label, Icon, hex }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <Icon size={14} style={{ color: hex }} strokeWidth={2.5} />
                            <span className="text-[11px] font-bold text-[#414042]">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Section */}
              <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
                {/* Current Observations */}
                <div className="flex-1 flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white/90 to-gray-50/80 p-6 shadow-[0_8px_32px_rgba(31,38,135,0.06)] backdrop-blur-2xl">
                  
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between pb-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d2232a]/20 to-[#911d1f]/10 shadow-sm border border-[#d2232a]/20">
                        <Activity size={18} className="text-[#911d1f]" />
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight text-gray-800">Local Analysis</h3>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isLiveWeather
                          ? 'border-green-200 bg-green-50/80 text-green-700 shadow-[0_0_12px_rgba(22,163,74,0.15)]'
                          : 'border-amber-200 bg-amber-50/80 text-amber-700'
                      }`}
                    >
                      {isLiveWeather ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          LIVE API
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> FALLBACK
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                    {/* Selected Campus Glow Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm transition-all hover:bg-white/80">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10.5px] font-black uppercase tracking-widest text-gray-500">Target Focus</p>
                        {!selectedCampus && <p className="text-[10px] font-bold text-[#006193] animate-pulse">Click map to analyze</p>}
                      </div>
                      
                      {selectedCampus ? (
                        <div className="flex items-end justify-between">
                          <div>
                            <h4 className="text-2xl font-black tracking-tight text-gray-900 drop-shadow-sm">{selectedCampus.name}</h4>
                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-100/80 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                              <span className={`block h-2 w-2 rounded-full ${
                                selectedCampus.status.toLowerCase() === 'safe' ? 'bg-green-500' : 'bg-amber-500'
                              }`} />
                              {selectedCampus.status} Status
                            </div>
                          </div>
                          
                          {/* Sync Risk Score */}
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Risk Score</span>
                            <div className="flex items-baseline gap-0.5">
                              <span className={`text-4xl font-black leading-none tracking-tighter ${
                                computeRiskScore(selectedCampus) >= 75 ? 'text-[#d2232a]' : 
                                computeRiskScore(selectedCampus) >= 50 ? 'text-[#ff922b]' : 
                                computeRiskScore(selectedCampus) >= 25 ? 'text-[#fbaf26]' : 'text-[#009748]'
                              }`}>
                                {computeRiskScore(selectedCampus)}
                              </span>
                              <span className="text-sm font-bold text-gray-400">/100</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-[88px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                          <p className="text-sm font-semibold text-gray-400">No telemetry selected</p>
                        </div>
                      )}
                    </div>

                    {/* Exceeded Metrics (ALARMING DATA ONLY) */}
                    {(() => {
                      const METRICS = [
                        { key: 'heatIndex', label: 'Heat Index', unit: '°C', threshold: 33 },
                        { key: 'rain', label: 'Rainfall', unit: 'mm', threshold: 30 },
                        { key: 'windGust', label: 'Wind Gust', unit: 'km/h', threshold: 80 },
                        { key: 'dewpoint', label: 'Dew Point', unit: '°C', threshold: 28 },
                      ] as const;

                      type MetricKey = typeof METRICS[number]['key'];
                      const getMetricValue = (campus: CampusWeather, key: MetricKey): number | undefined => Number(campus[key]) || undefined;

                      const exceeded = selectedCampus ? [selectedCampus].flatMap(campus => {
                        const exceededMetrics = METRICS.filter(metric => {
                          const val = getMetricValue(campus, metric.key);
                          return val !== undefined && !isNaN(val) && val >= metric.threshold;
                        });
                        return exceededMetrics.length > 0 ? [{ campus, exceededMetrics }] : [];
                      }) : [];

                      if (exceeded.length === 0) return null;

                      return (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#d2232a]/80 flex items-center gap-1.5">
                            <AlertTriangle size={12} /> Active Threshold Alerts
                          </p>
                          {exceeded.map(({ campus, exceededMetrics }) => {
                            const risk = getCardStatus(campus).level;
                            const colors = {
                              safe: 'border-[#009748]/30 bg-[#009748]/5 text-[#007e42]',
                              monitor: 'border-[#fbaf26]/40 bg-[#fbaf26]/10 text-[#a17109]',
                              warning: 'border-[#ff922b]/40 bg-[#ff922b]/10 text-[#b85c00]',
                              danger: 'border-[#d2232a]/30 bg-[#d2232a]/10 text-[#911d1f]',
                              risk: 'border-[#d2232a]/30 bg-[#d2232a]/10 text-[#911d1f]',
                            }[risk];

                            return (
                              <div key={campus.name + '-exceeded'} className={`overflow-hidden rounded-2xl border ${colors} shadow-sm backdrop-blur-md`}>
                                <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-white/40">
                                  <span className="text-xs font-extrabold">{campus.name}</span>
                                  <span className="rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm">{risk}</span>
                                </div>
                                <div className="px-4 py-3">
                                  {exceededMetrics.map(metric => (
                                    <div key={metric.key} className="flex items-center justify-between py-1">
                                      <span className="flex items-center gap-1.5 text-[11px] font-bold opacity-80">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                                        {metric.label} Critical
                                      </span>
                                      <span className="text-[13px] font-black">{getMetricValue(campus, metric.key)} {metric.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-4 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                        <Activity size={14} className="absolute right-3 top-3 text-gray-300 transition-colors group-hover:text-blue-400" />
                        <p className="text-[9.5px] font-black uppercase tracking-widest text-gray-500">Monitored Grid</p>
                        <p className="mt-2 text-3xl font-black tracking-tight text-gray-800">{observationSummary.monitoredCount}</p>
                        <p className="mt-1 text-[10px] font-semibold text-gray-400">Total active campuses</p>
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-4 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                        <CloudRain size={14} className="absolute right-3 top-3 text-gray-300 transition-colors group-hover:text-cyan-400" />
                        <p className="text-[9.5px] font-black uppercase tracking-widest text-gray-500">Sys Rainfall</p>
                        <p className="mt-2 text-3xl font-black tracking-tight text-gray-800">{observationSummary.totalRain} <span className="text-xl text-gray-400">mm</span></p>
                        <p className="mt-1 text-[10px] font-semibold text-gray-400">Combined accumulation</p>
                      </div>
                    </div>

                    {/* Selected Campus Metrics Grid */}
                    {selectedCampus && (
                      <div className="pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Live Telemetry</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'heatIndex', label: 'Heat Index', unit: '°C', value: selectedCampus.heatIndex, Icon: Thermometer },
                            { key: 'windSpeed', label: 'Wind Spd', unit: 'km/h', value: selectedCampus.windSpeed, Icon: Wind },
                            { key: 'humidity', label: 'Humidity', unit: '%', value: selectedCampus.humidity, Icon: Droplets },
                            { key: 'visibility', label: 'Visibility', unit: 'km', value: selectedCampus.visibility, Icon: Eye },
                          ].map(metric => {
                            const risk: RiskLevel = getCardStatus({ ...selectedCampus, [metric.key]: metric.value }).level;
                            const colors = {
                              safe: 'border-[#009748]/20 bg-gradient-to-br from-[#009748]/5 to-transparent text-[#007e42]',
                              monitor: 'border-[#fbaf26]/30 bg-gradient-to-br from-[#fbaf26]/10 to-transparent text-[#92610a]',
                              warning: 'border-[#ff922b]/30 bg-gradient-to-br from-[#ff922b]/10 to-transparent text-[#b85c00]',
                              danger: 'border-[#d2232a]/25 bg-gradient-to-br from-[#d2232a]/5 to-transparent text-[#911d1f]',
                              risk: 'border-[#d2232a]/25 bg-gradient-to-br from-[#d2232a]/5 to-transparent text-[#911d1f]',
                            }[risk];

                            return (
                              <div key={metric.key} className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all hover:scale-[1.02] hover:shadow-sm ${colors}`}>
                                <metric.Icon size={14} className="absolute right-3 top-3 opacity-30" />
                                <p className="text-[9.5px] font-black uppercase tracking-widest opacity-70">{metric.label}</p>
                                <div className="mt-2 flex items-baseline gap-1">
                                  <p className="text-2xl font-black tracking-tight">{metric.value}</p>
                                  <p className="text-[10px] font-bold opacity-60">{metric.unit}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
