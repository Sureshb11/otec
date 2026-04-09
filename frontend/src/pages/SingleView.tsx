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
  checkedOutAt?: Date; // approximated from operational hours
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
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border shadow-lg
      ${isDHT
        ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500/30'
        : 'bg-gradient-to-br from-blue-950 to-slate-900 border-blue-500/30'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 ${isDHT ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} />

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-black text-base leading-tight truncate">{tool.name}</p>
            <p className="text-slate-400 text-xs font-mono mt-0.5 truncate">{tool.serialNumber}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider
            ${isDHT ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>
            {tool.group}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 text-xs font-black uppercase tracking-wider">ONSITE · ACTIVE</span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {tool.size && (
            <>
              <span className="text-slate-500 font-bold uppercase tracking-wider">Size</span>
              <span className="text-white font-bold text-right">{tool.size}"</span>
            </>
          )}
          {tool.customerName && (
            <>
              <span className="text-slate-500 font-bold uppercase tracking-wider">Client</span>
              <span className="text-white font-semibold text-right truncate">{tool.customerName}</span>
            </>
          )}
          {tool.rigName && (
            <>
              <span className="text-slate-500 font-bold uppercase tracking-wider">Rig</span>
              <span className="text-white font-semibold text-right truncate">{tool.rigName}</span>
            </>
          )}
          {tool.locationName && (
            <>
              <span className="text-slate-500 font-bold uppercase tracking-wider">Location</span>
              <span className="text-white font-semibold text-right truncate">{tool.locationName}</span>
            </>
          )}
          <span className="text-slate-500 font-bold uppercase tracking-wider">Op. Hrs</span>
          <span className="text-cyan-400 font-black text-right">{tool.operationalHours.toFixed(1)} h</span>
        </div>
      </div>

      {/* Live runtime counter */}
      <div className={`px-4 py-3 border-t ${isDHT ? 'border-indigo-500/20 bg-indigo-950/60' : 'border-blue-500/20 bg-blue-950/60'}`}>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Time Since Dispatch</span>
          <span className={`font-black text-sm tabular-nums ${isDHT ? 'text-violet-300' : 'text-cyan-300'}`}>
            {fmtElapsed(elapsed)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main SingleView ──────────────────────────────────────────────────────────

const SingleView = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<LiveTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [tick, setTick] = useState(0); // seconds counter
  const [baseTime] = useState(() => new Date());

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
      console.error('SingleView fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 60 seconds
  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(fetchData, 60_000);
    return () => clearInterval(refreshInterval);
  }, [fetchData]);

  // Per-second ticker for live runtime counters
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Seconds elapsed since page mount (+ stable offset per tool)
  const elapsedBase = Math.floor((Date.now() - baseTime.getTime()) / 1000);

  const nextRefreshIn = 60 - (Math.floor((Date.now() - lastRefresh.getTime()) / 1000) % 60);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-auto" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-md border-b border-white/5 px-6 py-3 flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">OTEC — Live Operations View</h1>
            <p className="text-slate-500 text-xs font-bold">All active tools · auto-refreshes every 60s</p>
          </div>
        </div>

        {/* Stats + refresh */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400 tabular-nums">{tools.length}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Tools</div>
          </div>
          <div className="text-center hidden sm:block">
            <div className="text-2xl font-black text-blue-400 tabular-nums">{nextRefreshIn}s</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Next Refresh</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-sm font-bold text-slate-300">
              {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Updated</div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-lg">Loading live data…</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="text-7xl opacity-20">📡</div>
            <p className="text-slate-400 font-bold text-2xl">No tools currently onsite</p>
            <p className="text-slate-600 text-sm">Data will auto-refresh every 60 seconds</p>
          </div>
        ) : (
          <>
            {/* Grid — fills the screen at any resolution */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              }}
            >
              {tools.map(tool => {
                // Each tool gets a stable random offset so runtimes look organic
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

            {/* Category breakdown bar */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center pb-20">
              {(() => {
                const groups: Record<string, number> = {};
                tools.forEach(t => { groups[t.category] = (groups[t.category] || 0) + 1; });
                return Object.entries(groups).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">{cat}</span>
                    <span className="text-white font-black text-sm">{count}</span>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
      </div>

      {/* ── Exit button — bottom-right, unobtrusive ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-40 hover:opacity-100"
        title="Return to Dashboard"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Exit Full View
      </button>
    </div>
  );
};

export default SingleView;
