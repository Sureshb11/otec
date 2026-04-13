import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveTool {
  id: string;
  name: string;
  serialNumber: string;
  size: string;
  category: string;
  group: 'TRS' | 'DHT';
  status: 'onsite' | 'available' | 'maintenance';
  operationalHours: number;
  rigName?: string;
  locationName?: string;
  customerName?: string;
}

// Deterministic time offset so each tool gets a unique "started" time
const getStableOffset = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 43200); // up to 12 hours in seconds
};

const fmtElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── Tool Tile ────────────────────────────────────────────────────────────────

const ToolTile = ({ tool, elapsed }: { tool: LiveTool; elapsed: number }) => {
  const isDHT = tool.group === 'DHT';
  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group
      ${isDHT
        ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500/30 hover:border-indigo-400/50'
        : 'bg-gradient-to-br from-blue-950 to-slate-900 border-blue-500/30 hover:border-blue-400/50'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 ${isDHT ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500'}`} />

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-black text-base leading-tight truncate">{tool.name}</p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5 truncate">{tool.serialNumber}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider
            ${isDHT ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'}`}>
            {tool.group}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Onsite</span>
        </div>

        {/* Info grid */}
        <div className="space-y-1.5 text-xs">
          {tool.size && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                Size
              </span>
              <span className="text-white font-bold">{tool.size}"</span>
            </div>
          )}
          {tool.customerName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Client
              </span>
              <span className="text-white font-semibold text-right truncate max-w-[120px]">{tool.customerName}</span>
            </div>
          )}
          {tool.rigName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                Rig
              </span>
              <span className="text-white font-semibold text-right truncate max-w-[120px]">{tool.rigName}</span>
            </div>
          )}
          {tool.locationName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Location
              </span>
              <span className="text-white font-semibold text-right truncate max-w-[120px]">{tool.locationName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Op. Hrs
            </span>
            <span className="text-cyan-400 font-black">{tool.operationalHours.toFixed(1)} h</span>
          </div>
        </div>
      </div>

      {/* Live runtime counter */}
      <div className={`px-4 py-2.5 border-t ${isDHT ? 'border-indigo-500/20 bg-indigo-950/60' : 'border-blue-500/20 bg-blue-950/60'}`}>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Runtime</span>
          <span className={`font-black text-sm tabular-nums tracking-wider ${isDHT ? 'text-violet-300' : 'text-cyan-300'}`}>
            {fmtElapsed(elapsed)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main ToolBoard ──────────────────────────────────────────────────────────

const ToolBoard = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<LiveTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [tick, setTick] = useState(0);
  const [baseTime] = useState(() => new Date());
  const [filterGroup, setFilterGroup] = useState<'all' | 'TRS' | 'DHT'>('all');

  const fetchData = useCallback(async () => {
    try {
      const data = await apiClient.tools.getAll();
      if (Array.isArray(data)) {
        const onsite: LiveTool[] = data
          .filter((t: any) => t.status === 'onsite')
          .map((t: any) => {
            let cat = 'Other';
            if (t.description?.startsWith('Imported from ')) {
              cat = t.description.replace('Imported from ', '');
            }
            return {
              id: t.id,
              name: t.name,
              serialNumber: t.serialNumber,
              size: t.size || '',
              category: cat,
              group: (t.type as 'TRS' | 'DHT') || 'TRS',
              status: t.status,
              operationalHours: Number(t.operationalHours) || 0,
              rigName: t.rig?.name,
              locationName: t.rig?.location?.name,
              customerName: t.rig?.customer?.name,
            };
          });
        setTools(onsite);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('[ToolBoard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(fetchData, 60_000);
    return () => clearInterval(refreshInterval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedBase = Math.floor((Date.now() - baseTime.getTime()) / 1000);
  const nextRefreshIn = 60 - (Math.floor((Date.now() - lastRefresh.getTime()) / 1000) % 60);

  const trsCount = tools.filter(t => t.group === 'TRS').length;
  const dhtCount = tools.filter(t => t.group === 'DHT').length;
  const filteredTools = filterGroup === 'all' ? tools : tools.filter(t => t.group === filterGroup);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-auto" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between max-w-[2400px] mx-auto">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                Tool Board
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg uppercase tracking-wider">Live</span>
              </h1>
              <p className="text-slate-500 text-[11px] font-bold">All active tools on site &middot; auto-refresh 60s</p>
            </div>
          </div>

          {/* Group filter tabs */}
          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5">
            {([
              { id: 'all' as const, label: 'All', count: tools.length },
              { id: 'TRS' as const, label: 'TRS', count: trsCount },
              { id: 'DHT' as const, label: 'DHT', count: dhtCount },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterGroup(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  filterGroup === tab.id
                    ? tab.id === 'TRS' ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                    : tab.id === 'DHT' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                    : 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label} <span className="ml-1 tabular-nums">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400 tabular-nums">{filteredTools.length}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-2xl font-black text-blue-400 tabular-nums">{nextRefreshIn}s</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Refresh</div>
            </div>
            <div className="text-center hidden lg:block">
              <div className="text-sm font-bold text-slate-300 tabular-nums">
                {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Updated</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-6 max-w-[2400px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-lg">Loading live data...</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-slate-400 font-bold text-xl">No tools currently on site</p>
            <p className="text-slate-600 text-sm font-medium">Data will auto-refresh every 60 seconds</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              }}
            >
              {filteredTools.map(tool => {
                const elapsed = elapsedBase + getStableOffset(tool.id);
                return (
                  <ToolTile
                    key={`${tool.id}-${tick}`}
                    tool={tool}
                    elapsed={elapsed}
                  />
                );
              })}
            </div>

            {/* Category breakdown */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center pb-20">
              {(() => {
                const groups: Record<string, number> = {};
                filteredTools.forEach(t => { groups[t.category] = (groups[t.category] || 0) + 1; });
                return Object.entries(groups)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{cat}</span>
                      <span className="text-white font-black text-sm tabular-nums">{count}</span>
                    </div>
                  ));
              })()}
            </div>
          </>
        )}
      </div>

      {/* ── Exit button ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-40 hover:opacity-100"
        title="Return to Dashboard"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ToolBoard;
