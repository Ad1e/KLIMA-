import {
  Clock, Trash2, Loader2, CloudRain, Wind, Thermometer, Eye,
  Droplets, Gauge, Compass, Waves, MapPin, CalendarDays,
  ChevronDown, CheckCheck,
} from 'lucide-react';
import { useState } from 'react';

const PARAMS = [
  { label: 'Rain', icon: CloudRain },
  { label: 'MSLP', icon: Gauge },
  { label: 'Humidity', icon: Droplets },
  { label: 'Temperature', icon: Thermometer },
  { label: 'Dewpoint', icon: Waves },
  { label: 'Heat Index', icon: Thermometer },
  { label: 'Wind Direction', icon: Compass },
  { label: 'Wind Speed', icon: Wind },
  { label: 'Visibility', icon: Eye },
];

const LOCATIONS = [
  { id: 'alangilan', label: 'Alangilan Campus', full: 'Batangas State University - Alangilan Campus' },
  { id: 'lipa', label: 'Lipa City Campus', full: 'Batangas State University - Lipa City Campus' },
  { id: 'main', label: 'Main Campus', full: 'Batangas State University - Main Campus' },
  { id: 'malvar', label: 'Malvar Campus', full: 'Batangas State University - Malvar Campus' },
  { id: 'nasugbu', label: 'Nasugbu Campus', full: 'Batangas State University - Nasugbu Campus' },
  { id: 'balayan', label: 'Balayan Campus', full: 'Batangas State University - Balayan Campus' },
  { id: 'sanjuan', label: 'San Juan Campus', full: 'Batangas State University - San Juan Campus' },
  { id: 'lobo', label: 'Lobo Campus', full: 'Batangas State University - Lobo Campus' },
];

type RecordEntry = {
  requested: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  params: string[];
  locations: string[];
  processing: string;
  result: string;
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes('process')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
        In Process
      </span>
    );
  }
  if (s.includes('queue')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        In Queue
      </span>
    );
  }
  if (s.includes('done')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-500">
      {status}
    </span>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{children}</p>
      {action}
    </div>
  );
}

export default function HistoricalData() {
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [records, setRecords] = useState<RecordEntry[]>([
    {
      requested: 'March 13, 2026, 6:08 PM',
      start: '2026-03-09',
      end: '2026-03-12',
      startTime: '00:00',
      endTime: '23:59',
      params: ['MSLP', 'Humidity', 'Temperature', 'Dewpoint', 'Heat Index', 'Wind Direction', 'Wind Speed', 'Visibility'],
      locations: ['Alangilan Campus', 'Lipa Campus'],
      processing: 'Processing',
      result: 'In Process',
    },
    {
      requested: 'March 17, 2026, 10:51 AM',
      start: '2026-03-03',
      end: '2026-03-12',
      startTime: '06:00',
      endTime: '18:00',
      params: ['Rain'],
      locations: ['Alangilan Campus'],
      processing: 'In Queue',
      result: 'In Queue',
    },
  ]);

  const dateError = startDate && endDate && new Date(startDate) > new Date(endDate);
  const canSubmit = !!(startDate && endDate && !dateError && selectedParams.length > 0 && selectedLocations.length > 0);

  function toggleParam(label: string) {
    setSelectedParams(p => p.includes(label) ? p.filter(x => x !== label) : [...p, label]);
  }

  function toggleLocation(id: string) {
    setSelectedLocations(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      const now = new Date();
      const fmt = now.toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      });
      const locLabels = selectedLocations.map(id => LOCATIONS.find(l => l.id === id)?.label ?? id);
      setRecords(prev => [{
        requested: fmt,
        start: startDate,
        end: endDate,
        startTime,
        endTime,
        params: [...selectedParams],
        locations: locLabels,
        processing: 'In Queue',
        result: 'In Queue',
      }, ...prev]);
      setLoading(false);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2200);
      setSelectedParams([]);
      setSelectedLocations([]);
      setStartDate(''); setEndDate(''); setStartTime(''); setEndTime('');
    }, 900);
  }

  function handleDelete(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    setRecords(prev => prev.filter((_, i) => i !== idx));
    if (expandedRow === idx) setExpandedRow(null);
  }

  function fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 transition ' +
    'focus:border-[#d2232a] focus:ring-2 focus:ring-[#d2232a]/10 focus:bg-white focus:outline-none ' +
    'hover:border-gray-300';

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-10 py-6 flex items-center gap-5 shadow-md">
        <div className="h-8 w-8 rounded-lg bg-[#d2232a] flex items-center justify-center shadow-sm shadow-red-300 flex-shrink-0">
          <Clock size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 leading-none">Historical Data</h1>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">Batangas State University Weather System</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-medium text-emerald-700 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Online
        </span>
      </header>

      <div className="max-w-full mx-auto px-2 md:px-8 py-10 space-y-8">

        {/* ── Request Form Card ── */}
        <div className="rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#d2232a]/8 shadow-[0_20px_65px_rgba(65,64,66,0.12)] backdrop-blur-sm overflow-hidden p-6 md:p-10">

          {/* Card header */}
          <div className="px-6 py-4 border-b border-[#d2232a]/15 flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={14} className="text-[#d2232a]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#414042] tracking-tight">New Data Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-2 space-y-4">

            {/* Date / Time */}
            <div>
              <SectionLabel>Date &amp; time range</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { label: 'Start Date', type: 'date', value: startDate, onChange: setStartDate },
                  { label: 'End Date',   type: 'date', value: endDate,   onChange: setEndDate   },
                  { label: 'Start Time', type: 'time', value: startTime, onChange: setStartTime },
                  { label: 'End Time',   type: 'time', value: endTime,   onChange: setEndTime   },
                ] as const).map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-[#414042] mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={e => f.onChange(e.target.value)}
                      className={inputClass + ' text-base py-2 px-3 bg-white/90 ' + (dateError && (f.label === 'Start Date' || f.label === 'End Date') ? ' border-red-300 bg-red-50' : '')}
                    />
                  </div>
                ))}
              </div>
              {dateError && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  End date must be after start date.
                </p>
              )}
            </div>

            {/* Parameters */}
            <div>
              <SectionLabel
                action={
                  <div className="flex items-center gap-3">
                    {selectedParams.length > 0 && (
                      <button type="button" onClick={() => setSelectedParams([])}
                        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                        Clear
                      </button>
                    )}
                    {selectedParams.length < PARAMS.length && (
                      <button type="button" onClick={() => setSelectedParams(PARAMS.map(p => p.label))}
                        className="text-[11px] text-gray-400 hover:text-[#d2232a] transition-colors">
                        All
                      </button>
                    )}
                  </div>
                }
              >
                Weather parameters {selectedParams.length > 0 && <span className="text-[#d2232a] ml-1">· {selectedParams.length}</span>}
              </SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {PARAMS.map(({ label, icon: Icon }) => {
                  const active = selectedParams.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleParam(label)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold border transition-all select-none shadow-sm ${
                        active
                          ? 'bg-[#d2232a] border-[#d2232a] text-white shadow-[0_4px_16px_rgba(210,35,42,0.10)]'
                          : 'bg-white/90 border-gray-200 text-[#414042] hover:border-[#d2232a]/40 hover:text-[#d2232a] hover:bg-red-50/60'
                      }`}
                    >
                      <Icon size={11} className="flex-shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locations */}
            <div>
              <SectionLabel
                action={
                  <div className="flex items-center gap-3">
                    {selectedLocations.length > 0 && (
                      <button type="button" onClick={() => setSelectedLocations([])}
                        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                        Clear
                      </button>
                    )}
                    {selectedLocations.length < LOCATIONS.length && (
                      <button type="button" onClick={() => setSelectedLocations(LOCATIONS.map(l => l.id))}
                        className="text-[11px] text-gray-400 hover:text-[#1a3a6b] transition-colors">
                        All
                      </button>
                    )}
                  </div>
                }
              >
                Campus locations {selectedLocations.length > 0 && <span className="text-blue-600 ml-1">· {selectedLocations.length}</span>}
              </SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {LOCATIONS.map(({ id, label }) => {
                  const active = selectedLocations.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleLocation(id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold border transition-all select-none shadow-sm ${
                        active
                          ? 'bg-[#1a3a6b] border-[#1a3a6b] text-white shadow-[0_4px_16px_rgba(26,58,107,0.10)]'
                          : 'bg-white/90 border-gray-200 text-[#414042] hover:border-[#1a3a6b]/40 hover:text-[#1a3a6b] hover:bg-blue-50/60'
                      }`}
                    >
                      <MapPin size={11} className="flex-shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit row */}
            <div className="flex items-center justify-between pt-3 border-t border-[#d2232a]/15">
              <p className="text-base text-gray-400 hidden sm:block">
                {canSubmit ? 'All fields are filled — ready to submit.' : 'Complete all fields to submit.'}
              </p>
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={`ml-auto inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-base font-bold transition-all shadow-sm ${
                  justSubmitted
                    ? 'bg-emerald-500 text-white pointer-events-none'
                    : canSubmit && !loading
                    ? 'bg-[#d2232a] text-white hover:bg-[#b81e22] active:scale-95 shadow shadow-red-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading
                  ? <><Loader2 size={20} className="animate-spin" /> Processing…</>
                  : justSubmitted
                  ? <><CheckCheck size={20} /> Submitted!</>
                  : <><Clock size={20} /> Submit Request</>
                }
              </button>
            </div>

          </form>
        </div>

        {/* ── Saved Records ── */}
        <div className="rounded-3xl border border-[#d2232a]/20 bg-gradient-to-br from-white/95 to-[#911d1f]/8 shadow-[0_20px_65px_rgba(65,64,66,0.12)] backdrop-blur-sm overflow-hidden p-6 md:p-10">
          <div className="px-6 py-4 border-b border-[#d2232a]/15 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#414042] tracking-tight">Saved Records</h2>
            <span className="rounded-full bg-[#fbaf26]/15 px-3 py-0.5 text-base font-bold text-[#fbaf26] tabular-nums">
              {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <Clock size={24} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">No records yet</p>
              <p className="text-xs text-gray-300 mt-1">Submit a request above to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-base">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {['Date Requested', 'Date Range', 'Parameters', 'Locations', 'Processing', 'Result', ''].map((h, i) => (
                      <th key={i} className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <>
                      <tr
                        key={`r${i}`}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        className={`border-b border-gray-50 transition-colors cursor-pointer rounded-2xl ${
                          expandedRow === i ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Date requested */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-base text-gray-700 font-semibold">{rec.requested}</span>
                        </td>

                        {/* Date range */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-base font-bold text-gray-800">{fmtDate(rec.start)}</p>
                          <p className="text-xs text-gray-400">→ {fmtDate(rec.end)}</p>
                        </td>

                        {/* Parameters chips */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 max-w-[240px]">
                            {rec.params.slice(0, 3).map(p => (
                              <span key={p} className="inline-block rounded-xl bg-[#d2232a]/10 border border-[#d2232a]/30 px-2.5 py-0.5 text-sm font-semibold text-[#d2232a]">
                                {p}
                              </span>
                            ))}
                            {rec.params.length > 3 && (
                              <span className="inline-block rounded-xl bg-[#414042]/10 px-2.5 py-0.5 text-sm font-semibold text-[#414042]">
                                +{rec.params.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location chips */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 max-w-[200px]">
                            {rec.locations.map(l => (
                              <span key={l} className="inline-block rounded-xl bg-[#1a3a6b]/10 border border-[#1a3a6b]/30 px-2.5 py-0.5 text-sm font-semibold text-[#1a3a6b]">
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4"><StatusBadge status={rec.processing} /></td>
                        <td className="px-6 py-4"><StatusBadge status={rec.result} /></td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={e => handleDelete(e, i)}
                              title="Delete"
                              className="inline-flex items-center rounded-xl p-2 text-red-500 hover:text-white hover:bg-red-500 border border-transparent hover:border-red-500 transition-all"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                            <ChevronDown
                              size={20}
                              className={`text-gray-300 transition-transform duration-200 ${expandedRow === i ? 'rotate-180 text-blue-400' : ''}`}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded detail row ── */}
                      {expandedRow === i && (
                        <tr key={`e${i}`} className="border-b border-blue-100 bg-blue-50/40 rounded-2xl">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Full Date Range</p>
                                <p className="text-lg font-bold text-gray-800">{fmtDate(rec.start)} — {fmtDate(rec.end)}</p>
                                {rec.startTime && (
                                  <p className="text-base text-gray-400 mt-2">
                                    {rec.startTime} → {rec.endTime || 'N/A'}
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                  All Parameters <span className="text-gray-300">({rec.params.length})</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {rec.params.map(p => (
                                    <span key={p} className="inline-block rounded-xl bg-[#d2232a]/10 border border-[#d2232a]/30 px-2.5 py-0.5 text-sm font-semibold text-[#d2232a]">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">All Locations</p>
                                <div className="space-y-2">
                                  {rec.locations.map(l => (
                                    <div key={l} className="flex items-center gap-2 text-sm text-[#1a3a6b]">
                                      <MapPin size={14} className="text-[#1a3a6b] flex-shrink-0" />
                                      {l}
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-base text-gray-400 pb-4 mt-6">
          Reports are sent automatically at <span className="font-bold">6:00 AM</span> &amp; <span className="font-bold">6:00 PM</span> daily.
        </p>

      </div>
    </div>
  );
}
