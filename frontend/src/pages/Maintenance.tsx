/**
 * Maintenance Module
 *
 * Structure:
 *  /maintenance            → MaintenanceOverview (all tools with due dates)
 *  /maintenance/:toolId    → MaintenanceTool (detail + history + log)
 *
 * This component exports both views.
 * The router renders Overview at /maintenance and detail at /maintenance/:toolId.
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { format, differenceInDays, addMonths, parseISO } from 'date-fns';
import { apiClient } from '../api/apiClient';
import { parseToolSizes } from '../utils/toolCategorySizes';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MaintenanceRecord {
  id: string;
  date: string;          // ISO date
  type: 'Routine' | 'Repair' | 'Inspection' | 'Calibration' | 'Overhaul';
  technician: string;
  notes: string;
  hoursAtService?: number;
}

export interface MaintainedTool {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  group: 'TRS' | 'DHT';
  size?: string;
  currentStatus: 'Available' | 'In Use' | 'Under Maintenance';
  operationalHours: number;
  nextDueDate: string;      // ISO date — null means never set
  maintenanceInterval: number; // months
  history: MaintenanceRecord[];
}

type DueStatus = 'overdue' | 'due-soon' | 'ok';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = new Date();
const fmtISO = (d: Date) => d.toISOString().split('T')[0];

// Map backend tool to MaintainedTool shape
const mapTool = (t: any): MaintainedTool => ({
  id: t.id,
  name: t.name,
  serialNumber: t.serialNumber,
  category: t.category || '—',
  group: t.type as 'TRS' | 'DHT',
  size: t.size,
  currentStatus: t.status === 'available' ? 'Available' : t.status === 'onsite' ? 'In Use' : 'Under Maintenance',
  operationalHours: Number(t.operationalHours) || 0,
  nextDueDate: t.nextMaintenanceDate ? t.nextMaintenanceDate.split('T')[0] : '',
  maintenanceInterval: t.maintenanceIntervalMonths || 6,
  history: [],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDueStatus = (dueDateISO: string): DueStatus => {
  if (!dueDateISO) return 'ok';
  const days = differenceInDays(parseISO(dueDateISO), new Date());
  if (days < 0) return 'overdue';
  if (days <= 30) return 'due-soon';
  return 'ok';
};

const DUE_CONFIG: Record<DueStatus, { label: string; badge: string; dot: string; rowBg: string }> = {
  overdue:  { label: 'OVERDUE',   badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30',   dot: 'bg-red-500',   rowBg: 'bg-red-50/50 dark:bg-red-900/10' },
  'due-soon': { label: 'DUE SOON', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500', rowBg: 'bg-amber-50/40 dark:bg-amber-900/10' },
  ok:       { label: 'OK',        badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500', rowBg: '' },
};

const STATUS_BADGE: Record<string, string> = {
  'Available':        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  'In Use':           'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  'Under Maintenance':'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
};

const safeFmt = (iso: string) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), 'dd MMM yyyy'); } catch { return iso; }
};

// ─── LogMaintenanceModal ──────────────────────────────────────────────────────

interface LogModalProps {
  tool: MaintainedTool;
  onClose: () => void;
  onSave: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

const LogMaintenanceModal = ({ tool, onClose, onSave }: LogModalProps) => {
  const [rec, setRec] = useState<Omit<MaintenanceRecord, 'id'>>({
    date: fmtISO(today),
    type: 'Routine',
    technician: '',
    notes: '',
    hoursAtService: tool.operationalHours,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-lg border border-white/20 dark:border-white/5" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Log Maintenance</h3>
              <p className="text-xs text-slate-400 font-medium">{tool.name} · {tool.serialNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Date</label>
              <input type="date" value={rec.date} onChange={e => setRec({ ...rec, date: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Type</label>
              <select value={rec.type} onChange={e => setRec({ ...rec, type: e.target.value as any })}
                className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none">
                {['Routine', 'Repair', 'Inspection', 'Calibration', 'Overhaul'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Technician</label>
            <input type="text" value={rec.technician} placeholder="Technician name"
              onChange={e => setRec({ ...rec, technician: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Hours at Service</label>
            <input type="number" value={rec.hoursAtService}
              onChange={e => setRec({ ...rec, hoursAtService: Number(e.target.value) })}
              className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Notes</label>
            <textarea rows={3} value={rec.notes} placeholder="What was done, parts replaced, issues found…"
              onChange={e => setRec({ ...rec, notes: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { if (!rec.technician || !rec.notes) return alert('Fill in technician and notes.'); onSave(rec); }}
            className="flex-1 py-3 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">Save Record</button>
        </div>
      </div>
    </div>
  );
};

// ─── MaintenanceOverview ──────────────────────────────────────────────────────

// Compact size display: parses the tool.size compatibility string and
// shows just the first spec + "+N" if there are more. Imported tools
// have multi-line specs stored as comma-separated strings; the old code
// blindly appended `"` which broke for those.
const formatToolSize = (size?: string): string => {
  if (!size) return '';
  const parts = parseToolSizes(size);
  if (!parts || parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} +${parts.length - 1}`;
};

export const MaintenanceOverview = () => {
  const [tools, setTools] = useState<MaintainedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'status' | 'name' | 'category' | 'opHours' | 'lastService' | 'nextDue'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [groupFilter, setGroupFilter] = useState<'All' | 'TRS' | 'DHT'>('All');
  const [dueFilter, setDueFilter] = useState<'all' | DueStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    apiClient.tools.getAll().then((data: any[]) => {
      setTools(Array.isArray(data) ? data.map(mapTool) : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const overdue  = tools.filter(t => getDueStatus(t.nextDueDate) === 'overdue').length;
  const dueSoon  = tools.filter(t => getDueStatus(t.nextDueDate) === 'due-soon').length;
  const ok       = tools.filter(t => getDueStatus(t.nextDueDate) === 'ok').length;

  const onSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    let list = tools;
    if (groupFilter !== 'All') list = list.filter(t => t.group === groupFilter);
    if (dueFilter !== 'all') list = list.filter(t => getDueStatus(t.nextDueDate) === dueFilter);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.serialNumber.toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => {
      let v = 0;
      if (sortKey === 'status') {
        const order: DueStatus[] = ['overdue', 'due-soon', 'ok'];
        v = order.indexOf(getDueStatus(a.nextDueDate)) - order.indexOf(getDueStatus(b.nextDueDate));
      } else if (sortKey === 'name') {
        v = a.name.localeCompare(b.name);
      } else if (sortKey === 'category') {
        v = (a.category || '').localeCompare(b.category || '');
      } else if (sortKey === 'opHours') {
        v = a.operationalHours - b.operationalHours;
      } else if (sortKey === 'lastService') {
        const aD = a.history[0]?.date || '';
        const bD = b.history[0]?.date || '';
        v = aD.localeCompare(bD);
      } else if (sortKey === 'nextDue') {
        v = a.nextDueDate.localeCompare(b.nextDueDate);
      }
      return sortDir === 'asc' ? v : -v;
    });
  }, [tools, sortKey, sortDir, groupFilter, dueFilter, searchTerm]);

  if (loading) return (
    <MainLayout><div className="flex items-center justify-center h-64 text-slate-400 font-bold">Loading…</div></MainLayout>
  );

  // KPI card definition — also wired as the due-status filter
  const kpis: { key: 'all' | DueStatus; label: string; count: number; color: string; light: string }[] = [
    { key: 'all',       label: 'All Tools',  count: tools.length, color: 'from-slate-500 to-slate-600',   light: 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-500/20' },
    { key: 'overdue',   label: 'Overdue',    count: overdue,      color: 'from-red-500 to-red-600',       light: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/20' },
    { key: 'due-soon',  label: 'Due Soon',   count: dueSoon,      color: 'from-amber-400 to-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20' },
    { key: 'ok',        label: 'Up to Date', count: ok,           color: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20' },
  ];

  const sortIndicator = (k: typeof sortKey) =>
    sortKey === k ? <span className="text-[8px] ml-0.5">{sortDir === 'asc' ? '▲' : '▼'}</span> : null;

  return (
    <MainLayout headerContent={
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
          Maintenance
        </h1>
        <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
          Track service schedules and maintenance history for all tools
        </p>
      </div>
    }>

      {/* KPI row — clickable filter chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {kpis.map(({ key, label, count, color, light }) => {
          const active = dueFilter === key;
          return (
            <button
              key={key}
              onClick={() => setDueFilter(key)}
              className={`text-left rounded-2xl border shadow-md p-4 flex items-center gap-3 transition-all ${light} ${
                active
                  ? 'ring-2 ring-blue-500/40 shadow-lg -translate-y-0.5'
                  : 'hover:shadow-lg hover:-translate-y-0.5 opacity-90 hover:opacity-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md shrink-0`}>
                {key === 'overdue' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {key === 'due-soon' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {key === 'ok' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {key === 'all' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{count}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls row: search + group filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, serial, or category…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white/60 dark:bg-meta-4 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-boxdark border border-slate-200 dark:border-white/10 rounded-xl p-1">
          {(['All', 'TRS', 'DHT'] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                groupFilter === g
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-meta-4'
              }`}>
              {g}
            </button>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {sorted.length} of {tools.length}
        </div>
      </div>

      {/* Tools table — sort via column headers */}
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-meta-4/50 border-b border-slate-100 dark:border-white/5">
              <th onClick={() => onSort('name')} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Tool {sortIndicator('name')}
              </th>
              <th onClick={() => onSort('category')} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Category {sortIndicator('category')}
              </th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Tool Status</th>
              <th onClick={() => onSort('opHours')} className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Op. Hours {sortIndicator('opHours')}
              </th>
              <th onClick={() => onSort('lastService')} className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Last Service {sortIndicator('lastService')}
              </th>
              <th onClick={() => onSort('nextDue')} className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Next Due {sortIndicator('nextDue')}
              </th>
              <th onClick={() => onSort('status')} className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white whitespace-nowrap">
                Due Status {sortIndicator('status')}
              </th>
              <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <p className="font-bold text-slate-400">No tools match the current filter.</p>
                  {(searchTerm || dueFilter !== 'all' || groupFilter !== 'All') && (
                    <button
                      onClick={() => { setSearchTerm(''); setDueFilter('all'); setGroupFilter('All'); }}
                      className="mt-3 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                    >
                      Reset filters
                    </button>
                  )}
                </td>
              </tr>
            ) : sorted.map(tool => {
              const dueStatus = getDueStatus(tool.nextDueDate);
              const dueCfg = DUE_CONFIG[dueStatus];
              const lastService = tool.history.length > 0 ? tool.history[0] : null;
              const sizeStr = formatToolSize(tool.size);
              return (
                <tr key={tool.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-meta-4/30 ${dueCfg.rowBg}`}>
                  <td className="px-5 py-3.5 max-w-[280px]">
                    <p className="font-bold text-slate-800 dark:text-white truncate" title={tool.name}>{tool.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate" title={`${tool.serialNumber}${sizeStr ? ' · ' + sizeStr : ''}`}>
                      {tool.serialNumber}{sizeStr ? ` · ${sizeStr}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">{tool.category}</span>
                    <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded ${tool.group === 'TRS' ? 'text-blue-500' : 'text-indigo-500'}`}>{tool.group}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${STATUS_BADGE[tool.currentStatus]}`}>{tool.currentStatus}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-blue-600 dark:text-blue-400 tabular-nums whitespace-nowrap">{tool.operationalHours.toLocaleString()} h</td>
                  <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{lastService ? safeFmt(lastService.date) : '—'}</td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">{safeFmt(tool.nextDueDate)}</td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg ${dueCfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dueCfg.dot} ${dueStatus === 'overdue' ? 'animate-pulse' : ''}`} />
                      {dueCfg.label}
                      {dueStatus !== 'ok' && tool.nextDueDate && (
                        <span className="font-normal opacity-70">
                          {Math.abs(differenceInDays(parseISO(tool.nextDueDate), new Date()))}d
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
                      to={`/maintenance/${tool.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Open maintenance detail and log service"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Log / View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </MainLayout>
  );
};

// ─── MaintenanceToolDetail ────────────────────────────────────────────────────

export const MaintenanceToolDetail = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<MaintainedTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSetDueModal, setShowSetDueModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (!toolId) return;
    apiClient.tools.getById(toolId).then((data: any) => {
      setTool(mapTool(data));
    }).catch(console.error).finally(() => setLoading(false));
  }, [toolId]);

  if (loading) return (
    <MainLayout><div className="flex items-center justify-center h-64 text-slate-400 font-bold">Loading…</div></MainLayout>
  );

  if (!tool) return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400 text-lg font-bold">Tool not found</p>
        <Link to="/maintenance" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">← Back to Overview</Link>
      </div>
    </MainLayout>
  );

  const dueStatus = getDueStatus(tool.nextDueDate);
  const dueCfg = DUE_CONFIG[dueStatus];
  const daysUntil = tool.nextDueDate ? differenceInDays(parseISO(tool.nextDueDate), new Date()) : null;

  const handleLogSave = async (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = { ...record, id: `h-${Date.now()}` };
    // Auto-advance next due date by interval and persist to API
    const nextDue = fmtISO(addMonths(parseISO(record.date), tool.maintenanceInterval));
    try {
      await apiClient.tools.update(tool.id, { nextMaintenanceDate: nextDue });
      setTool(prev => prev ? { ...prev, history: [newRecord, ...prev.history], nextDueDate: nextDue } : prev);
    } catch (err) {
      console.error('Failed to update next due date:', err);
    }
    setShowLogModal(false);
  };

  const handleSetDue = async () => {
    if (!newDueDate) return;
    try {
      await apiClient.tools.update(tool.id, { nextMaintenanceDate: newDueDate });
      setTool(prev => prev ? { ...prev, nextDueDate: newDueDate } : prev);
    } catch (err) {
      console.error('Failed to set due date:', err);
    }
    setShowSetDueModal(false);
    setNewDueDate('');
  };

  const TYPE_COLOR: Record<string, string> = {
    Routine: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    Repair: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    Inspection: 'bg-slate-100 dark:bg-meta-4 text-slate-600 dark:text-slate-300',
    Calibration: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    Overhaul: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <MainLayout headerContent={
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/maintenance')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm font-bold transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Maintenance
        </button>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">{tool.name}</h1>
          <p className="text-xs text-slate-400 font-mono">
            {tool.serialNumber}
            {formatToolSize(tool.size) ? ` · ${formatToolSize(tool.size)}` : ''}
          </p>
        </div>
      </div>
    }>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Tool info + due date ── */}
        <div className="space-y-5">

          {/* Info card */}
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Tool Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Category', value: tool.category },
                { label: 'Group', value: tool.group },
                { label: 'Size', value: formatToolSize(tool.size) || '—' },
                { label: 'Op. Hours', value: `${tool.operationalHours.toLocaleString()} hrs` },
                { label: 'Interval', value: `Every ${tool.maintenanceInterval} months` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 font-bold">{label}</span>
                  <span className="font-bold text-slate-800 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg ${STATUS_BADGE[tool.currentStatus]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {tool.currentStatus}
              </span>
            </div>
          </div>

          {/* Due date card */}
          <div className={`rounded-2xl shadow-xl border p-5 ${dueCfg.rowBg || 'glass-premium dark:bg-boxdark/90 border-white/20 dark:border-white/5'}`}>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Next Maintenance Due</h3>

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{safeFmt(tool.nextDueDate)}</div>
                {daysUntil !== null && (
                  <div className={`text-xs font-bold mt-0.5 ${
                    daysUntil < 0 ? 'text-red-600 dark:text-red-400'
                    : daysUntil <= 30 ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400'
                  }`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `In ${daysUntil} days`}
                  </div>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg ${dueCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dueCfg.dot} ${dueStatus === 'overdue' ? 'animate-pulse' : ''}`} />
                {dueCfg.label}
              </span>
            </div>

            {/* Visual indicator bar */}
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-meta-4 overflow-hidden mb-4">
              <div className={`h-full rounded-full transition-all duration-500 ${
                dueStatus === 'overdue'   ? 'bg-red-500 w-full'
                : dueStatus === 'due-soon' ? 'bg-amber-400 w-4/5'
                : 'bg-emerald-500 w-1/2'
              }`} />
            </div>

            <button onClick={() => { setNewDueDate(tool.nextDueDate || fmtISO(today)); setShowSetDueModal(true); }}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Set / Update Due Date
            </button>
          </div>

          {/* Log Maintenance button */}
          <button onClick={() => setShowLogModal(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Maintenance
          </button>
        </div>

        {/* ── Right: History ── */}
        <div className="lg:col-span-2">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Maintenance History</h3>
              <span className="text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                {tool.history.length} record{tool.history.length !== 1 ? 's' : ''}
              </span>
            </div>

            {tool.history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="opacity-20"><svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                <p className="text-slate-400 font-bold">No maintenance records yet</p>
                <button onClick={() => setShowLogModal(true)} className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">Log the first service</button>
              </div>
            ) : (
              <div className="space-y-4">
                {tool.history.map((rec, i) => (
                  <div key={rec.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-white/10 last:border-0 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`} />

                    <div className="bg-white/60 dark:bg-boxdark/60 rounded-xl border border-slate-100 dark:border-white/5 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${TYPE_COLOR[rec.type] || ''}`}>{rec.type.toUpperCase()}</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{safeFmt(rec.date)}</span>
                        </div>
                        {rec.hoursAtService && (
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">{rec.hoursAtService.toLocaleString()} hrs</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 mb-1">
                        Technician: <span className="text-slate-700 dark:text-slate-200">{rec.technician}</span>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{rec.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogModal && <LogMaintenanceModal tool={tool} onClose={() => setShowLogModal(false)} onSave={handleLogSave} />}

      {/* Set Due Date Modal */}
      {showSetDueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-boxdark rounded-2xl w-full max-w-sm shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Set Due Date</h3>
                  <p className="text-xs text-slate-400 font-medium">Next maintenance schedule</p>
                </div>
              </div>
              <button onClick={() => setShowSetDueModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">Next Maintenance Date</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
              </div>
              <div className="mb-5 grid grid-cols-3 gap-2">
                {[1, 3, 6].map(m => (
                  <button key={m} onClick={() => setNewDueDate(fmtISO(addMonths(today, m)))}
                    className="py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-meta-4/80 transition-colors border border-slate-200 dark:border-white/5">
                    +{m} month{m > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowSetDueModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSetDue}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all">Save</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MaintenanceOverview;
