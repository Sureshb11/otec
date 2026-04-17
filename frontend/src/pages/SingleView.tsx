import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Operational runtime (SAP PM / Maximo pattern): accumulated running seconds
  // across all Start/Stop cycles + timestamp of current open segment (if any).
  // Separate from the order-level deployment timestamp (activatedAt).
  totalSeconds: number;
  operationStartedAt: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtElapsed = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const fmtClock = (d: Date) =>
  d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconSize = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Ruler */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 7h18M3 7l2-2M3 7l2 2M21 7l-2-2M21 7l-2 2M3 17h18M7 7v10M11 7v4M15 7v10M19 7v4" />
  </svg>
);

const IconClient = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Office building */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconRig = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {/* Derrick / rig tower */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 2l-4 8h2v4h-2l-2 8h12l-2-8h-2v-4h2L12 2zm0 0v14" />
  </svg>
);

const IconLocation = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconClock = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCategory = () => (
  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconFullscreen = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const IconExitFullscreen = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
  </svg>
);

const IconTV = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconArrowLeft = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IconNoTools = () => (
  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ─── Tool Tile ────────────────────────────────────────────────────────────────

interface ToolTileProps {
  tool: LiveTool;
  now: number; // Date.now() snapshot from parent — avoids per-tile setInterval
}

const ToolTile = ({ tool, now }: ToolTileProps) => {
  const isDHT = tool.group === 'DHT';

  // Runtime = accumulated completed segments + the currently open segment (if Start is active).
  // null means operator has never pressed Start — render "Not tracked".
  const base = tool.totalSeconds || 0;
  const openSec = tool.operationStartedAt
    ? Math.max(0, Math.floor((now - new Date(tool.operationStartedAt).getTime()) / 1000))
    : 0;
  const elapsedSec = (base > 0 || tool.operationStartedAt) ? base + openSec : null;

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border shadow-lg
      transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group
      ${isDHT
        ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/30 hover:border-indigo-400/60'
        : 'bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border-blue-500/30 hover:border-blue-400/60'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 ${isDHT
        ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500'
        : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500'}`}
      />

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-sm leading-tight truncate">{tool.name}</p>
            <p className="text-slate-500 text-[10px] font-mono mt-0.5 truncate">{tool.serialNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider
              ${isDHT
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/20'}`}>
              {tool.group}
            </span>
          </div>
        </div>

        {/* Category + Status row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconCategory />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">
              {tool.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Onsite</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="space-y-2 text-[11px]">
          {tool.size && (
            <InfoRow icon={<IconSize />} label="Size" value={`${tool.size}"`} />
          )}
          {tool.customerName && (
            <InfoRow icon={<IconClient />} label="Client" value={tool.customerName} truncate />
          )}
          {tool.rigName && (
            <InfoRow icon={<IconRig />} label="Rig" value={tool.rigName} truncate />
          )}
          {tool.locationName && (
            <InfoRow icon={<IconLocation />} label="Location" value={tool.locationName} truncate />
          )}
          <InfoRow
            icon={<IconClock />}
            label="Op. Hrs"
            value={`${tool.operationalHours.toFixed(1)} h`}
            valueClass="text-cyan-400 font-black"
          />
        </div>
      </div>

      {/* Live runtime counter */}
      <div className={`px-4 py-2.5 border-t ${isDHT ? 'border-indigo-500/20 bg-indigo-950/60' : 'border-blue-500/20 bg-blue-950/60'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
            </span>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Runtime</span>
          </div>
          {elapsedSec !== null ? (
            <span className={`font-black text-sm tabular-nums tracking-wider ${isDHT ? 'text-violet-300' : 'text-cyan-300'}`}>
              {fmtElapsed(elapsedSec)}
            </span>
          ) : (
            <span className="text-slate-600 text-[10px] font-bold italic">Not tracked</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow = ({
  icon, label, value, truncate = false, valueClass = 'text-white font-semibold',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
  valueClass?: string;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
      {icon}
      {label}
    </span>
    <span className={`text-right ${truncate ? 'truncate max-w-[130px]' : ''} ${valueClass}`}>
      {value}
    </span>
  </div>
);

// ─── Category Section Header ──────────────────────────────────────────────────

const CategoryHeader = ({ category, count, group }: { category: string; count: number; group: 'TRS' | 'DHT' }) => (
  <div className="col-span-full flex items-center gap-3 mt-4 mb-1 first:mt-0">
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border
      ${group === 'TRS'
        ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}
    >
      <span className={`w-2 h-2 rounded-full ${group === 'TRS' ? 'bg-blue-400' : 'bg-indigo-400'} animate-pulse`} />
      {category}
      <span className="ml-1 font-black tabular-nums text-white">{count}</span>
    </div>
    <div className="flex-1 h-px bg-white/5" />
  </div>
);

// ─── Main ToolBoard ──────────────────────────────────────────────────────────

const TRS_CATS = ['CRT', 'Torque Sub', 'Power Tong', 'Jam Unit', 'HPU', 'Filup Tool', 'Safety Clamp', 'Elevators', 'Slips', 'Spider Elevators'];

const ToolBoard = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<LiveTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setLastRefresh] = useState(new Date());
  const [now, setNow] = useState(Date.now());
  const [filterGroup, setFilterGroup] = useState<'all' | 'TRS' | 'DHT'>('all');
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(60);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [toolsData, ordersData] = await Promise.all([
        apiClient.tools.getAll(),
        apiClient.orders.getAll().catch(() => []),
      ]);

      // Build toolId → runtime map from active orders. Runtime tracks the
      // operator-controlled Start/Stop cycle (operationStartedAt +
      // totalOperationalSeconds), NOT the order deployment timestamp.
      const runtimeMap: Record<string, { totalSeconds: number; operationStartedAt: string | null }> = {};
      if (Array.isArray(ordersData)) {
        ordersData.forEach((order: any) => {
          if (order.status === 'active' && Array.isArray(order.items)) {
            const info = {
              totalSeconds: Number(order.totalOperationalSeconds) || 0,
              operationStartedAt: order.operationStartedAt || null,
            };
            order.items.forEach((item: any) => {
              if (item.toolId) runtimeMap[item.toolId] = info;
            });
          }
        });
      }

      if (Array.isArray(toolsData)) {
        const onsite: LiveTool[] = toolsData
          .filter((t: any) => t.status === 'onsite')
          .map((t: any) => {
            // Use category field directly; fall back to description parsing for legacy data
            let cat = t.category || 'Other';
            if (cat === 'Other' && t.description?.startsWith('Imported from ')) {
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
              totalSeconds: runtimeMap[t.id]?.totalSeconds ?? 0,
              operationStartedAt: runtimeMap[t.id]?.operationStartedAt ?? null,
            };
          });
        setTools(onsite);
        setLastRefresh(new Date());
        setCountdown(60);
      }
    } catch (err) {
      console.error('[ToolBoard] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(refreshInterval);
  }, [fetchData]);

  // Clock + elapsed timer: tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setCurrentTime(new Date());
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const trsCount = tools.filter(t => t.group === 'TRS').length;
  const dhtCount = tools.filter(t => t.group === 'DHT').length;
  const filteredTools = filterGroup === 'all' ? tools : tools.filter(t => t.group === filterGroup);

  // Group by category, preserving TRS/DHT order
  const categoryGroups: { category: string; group: 'TRS' | 'DHT'; tools: LiveTool[] }[] = [];
  if (groupByCategory) {
    // Sort: TRS first, then DHT, then unknown
    const sorted = [...filteredTools].sort((a, b) => {
      const aIdx = TRS_CATS.includes(a.category) ? 0 : 1;
      const bIdx = TRS_CATS.includes(b.category) ? 0 : 1;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.category.localeCompare(b.category);
    });
    const seen: Record<string, number> = {};
    sorted.forEach(t => {
      if (seen[t.category] === undefined) {
        seen[t.category] = categoryGroups.length;
        categoryGroups.push({ category: t.category, group: TRS_CATS.includes(t.category) ? 'TRS' : 'DHT', tools: [] });
      }
      categoryGroups[seen[t.category]].tools.push(t);
    });
  }

  const trackedCount = filteredTools.filter(t => t.operationStartedAt || t.totalSeconds > 0).length;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-white overflow-auto"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 md:px-6 py-3 max-w-[2400px] mx-auto">
          <div className="flex items-center justify-between gap-4">

            {/* Logo + title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
                <IconTV />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black text-white tracking-wide flex items-center gap-2 flex-wrap">
                  Tool Board
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Live
                  </span>
                </h1>
                <p className="text-slate-500 text-[10px] font-bold hidden sm:block">
                  {fmtDate(currentTime)} &middot; auto-refresh {countdown}s
                </p>
              </div>
            </div>

            {/* Live clock */}
            <div className="hidden md:flex flex-col items-center shrink-0">
              <div className="text-2xl font-black text-white tabular-nums tracking-wider font-mono">
                {fmtClock(currentTime)}
              </div>
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">KWT</div>
            </div>

            {/* Group filter tabs */}
            <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5 shrink-0">
              {([
                { id: 'all' as const, label: 'All',  count: tools.length },
                { id: 'TRS' as const, label: 'TRS',  count: trsCount },
                { id: 'DHT' as const, label: 'DHT',  count: dhtCount },
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
            <div className="flex items-center gap-3 md:gap-5 shrink-0">
              <StatPill label="Active" value={filteredTools.length} color="emerald" />
              <StatPill label="TRS" value={trsCount} color="blue" className="hidden sm:flex" />
              <StatPill label="DHT" value={dhtCount} color="indigo" className="hidden md:flex" />
              <StatPill label="Tracked" value={trackedCount} color="violet" className="hidden lg:flex" />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Group toggle */}
              <button
                onClick={() => setGroupByCategory(v => !v)}
                title={groupByCategory ? 'Disable category grouping' : 'Enable category grouping'}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  groupByCategory
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                </svg>
                <span className="hidden xl:inline">Group</span>
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                title="Refresh now"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-bold transition-all disabled:opacity-40"
              >
                <span className={refreshing ? 'animate-spin' : ''}><IconRefresh /></span>
                <span className="hidden xl:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-bold transition-all"
              >
                {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
                <span className="hidden xl:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for next refresh */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-none"
            style={{ width: `${((60 - countdown) / 60) * 100}%` }}
          />
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
          <div className="flex flex-col items-center justify-center h-[70vh] gap-5">
            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <IconNoTools />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-black text-xl mb-1">No tools currently on site</p>
              <p className="text-slate-600 text-sm font-medium">Data refreshes every 60 seconds</p>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-bold hover:bg-blue-600/30 transition-colors"
            >
              <IconRefresh />
              Refresh Now
            </button>
          </div>

        ) : groupByCategory ? (
          // ── Grouped by category ──
          <div className="space-y-2">
            {categoryGroups.map(({ category, group, tools: catTools }) => (
              <div key={category}>
                <CategoryHeader category={category} count={catTools.length} group={group} />
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))' }}
                >
                  {catTools.map(tool => (
                    <ToolTile key={tool.id} tool={tool} now={now} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        ) : (
          // ── Flat grid ──
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))' }}
          >
            {filteredTools.map(tool => (
              <ToolTile key={tool.id} tool={tool} now={now} />
            ))}
          </div>
        )}

        {/* ── Footer stats bar ── */}
        {!loading && filteredTools.length > 0 && (
          <div className="mt-8 mb-20 flex flex-wrap items-center justify-center gap-3">
            {(() => {
              const groups: Record<string, { count: number; group: 'TRS' | 'DHT' }> = {};
              filteredTools.forEach(t => {
                if (!groups[t.category]) groups[t.category] = { count: 0, group: TRS_CATS.includes(t.category) ? 'TRS' : 'DHT' };
                groups[t.category].count++;
              });
              return Object.entries(groups)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([cat, { count, group }]) => (
                  <div
                    key={cat}
                    className={`flex items-center gap-2.5 border rounded-xl px-4 py-2.5 transition-colors cursor-default
                      ${group === 'TRS'
                        ? 'bg-blue-500/5 border-blue-500/15 hover:bg-blue-500/10'
                        : 'bg-indigo-500/5 border-indigo-500/15 hover:bg-indigo-500/10'}`}
                  >
                    <span className={`w-2 h-2 rounded-full animate-pulse ${group === 'TRS' ? 'bg-blue-400' : 'bg-indigo-400'}`} />
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{cat}</span>
                    <span className={`font-black text-sm tabular-nums ${group === 'TRS' ? 'text-blue-300' : 'text-indigo-300'}`}>{count}</span>
                  </div>
                ));
            })()}
          </div>
        )}
      </div>

      {/* ── Exit button ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-40 hover:opacity-100"
        title="Return to Dashboard"
      >
        <IconArrowLeft />
        Dashboard
      </button>
    </div>
  );
};

// ─── StatPill ─────────────────────────────────────────────────────────────────

const STAT_COLORS = {
  emerald: 'text-emerald-400',
  blue:    'text-blue-400',
  indigo:  'text-indigo-400',
  violet:  'text-violet-400',
  cyan:    'text-cyan-400',
};

const StatPill = ({
  label, value, color, className = '',
}: {
  label: string;
  value: number;
  color: keyof typeof STAT_COLORS;
  className?: string;
}) => (
  <div className={`text-center ${className}`}>
    <div className={`text-2xl font-black tabular-nums ${STAT_COLORS[color]}`}>{value}</div>
    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

export default ToolBoard;
