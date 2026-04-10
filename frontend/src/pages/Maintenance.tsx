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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Log Maintenance</h3>
          <p className="text-xs text-slate-400 font-bold">{tool.name} · {tool.serialNumber}</p>
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

export const MaintenanceOverview = () => {
  const [tools, setTools] = useState<MaintainedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'status' | 'name' | 'date'>('status');
  const [groupFilter, setGroupFilter] = useState<'All' | 'TRS' | 'DHT'>('All');

  useEffect(() => {
    apiClient.tools.getAll().then((data: any[]) => {
      setTools(Array.isArray(data) ? data.map(mapTool) : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const overdue  = tools.filter(t => getDueStatus(t.nextDueDate) === 'overdue').length;
  const dueSoon  = tools.filter(t => getDueStatus(t.nextDueDate) === 'due-soon').length;
  const ok       = tools.filter(t => getDueStatus(t.nextDueDate) === 'ok').length;

  const sorted = useMemo(() => {
    const filtered = groupFilter === 'All' ? tools : tools.filter(t => t.group === groupFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'status') {
        const order: DueStatus[] = ['overdue', 'due-soon', 'ok'];
        return order.indexOf(getDueStatus(a.nextDueDate)) - order.indexOf(getDueStatus(b.nextDueDate));
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.nextDueDate.localeCompare(b.nextDueDate);
    });
  }, [tools, sortBy, groupFilter]);

  if (loading) return (
    <MainLayout><div className="flex items-center justify-center h-64 text-slate-400 font-bold">Loading…</div></MainLayout>
  );

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

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Overdue', count: overdue, color: 'from-red-500 to-red-600', icon: '🔴', light: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/20' },
          { label: 'Due Soon', count: dueSoon, color: 'from-amber-400 to-amber-500', icon: '🟡', light: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20' },
          { label: 'Up to Date', count: ok, color: 'from-emerald-500 to-emerald-600', icon: '🟢', light: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20' },
        ].map(({ label, count, color, icon, light }) => (
          <div key={label} className={`glass-premium dark:bg-boxdark/90 rounded-2xl border shadow-xl p-5 flex items-center gap-4 ${light}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg text-xl`}>{icon}</div>
            <div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{count}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Group filter */}
        {(['All', 'TRS', 'DHT'] as const).map(g => (
          <button key={g} onClick={() => setGroupFilter(g)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${groupFilter === g
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-boxdark border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4'}`}>
            {g}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
          {[{ id: 'status', label: 'Status (Overdue first)' }, { id: 'name', label: 'Name' }, { id: 'date', label: 'Due Date' }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === s.id
                ? 'bg-slate-800 dark:bg-slate-600 text-white'
                : 'bg-white dark:bg-boxdark border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-meta-4'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools table */}
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-meta-4/50 border-b border-slate-100 dark:border-white/5">
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Tool</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Op. Hours</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Last Service</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Next Due</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Due Status</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {sorted.map(tool => {
              const dueStatus = getDueStatus(tool.nextDueDate);
              const dueCfg = DUE_CONFIG[dueStatus];
              const lastService = tool.history.length > 0 ? tool.history[0] : null;
              return (
                <tr key={tool.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-meta-4/30 ${dueCfg.rowBg}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800 dark:text-white">{tool.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{tool.serialNumber}{tool.size ? ` · ${tool.size}"` : ''}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">{tool.category}</span>
                    <span className={`ml-1 text-xs font-black px-1.5 py-0.5 rounded ${tool.group === 'TRS' ? 'text-blue-500' : 'text-indigo-500'}`}>{tool.group}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${STATUS_BADGE[tool.currentStatus]}`}>{tool.currentStatus}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-blue-600 dark:text-blue-400 tabular-nums">{tool.operationalHours.toLocaleString()} h</td>
                  <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400 text-xs">{lastService ? safeFmt(lastService.date) : '—'}</td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-300 text-xs font-semibold">{safeFmt(tool.nextDueDate)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg ${dueCfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dueCfg.dot} ${dueStatus === 'overdue' ? 'animate-pulse' : ''}`} />
                      {dueCfg.label}
                      {dueStatus !== 'ok' && (
                        <span className="font-normal opacity-70">
                          {Math.abs(differenceInDays(parseISO(tool.nextDueDate), new Date()))}d
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/maintenance/${tool.id}`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          <p className="text-xs text-slate-400 font-mono">{tool.serialNumber}{tool.size ? ` · ${tool.size}"` : ''}</p>
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
                { label: 'Size', value: tool.size ? `${tool.size}"` : '—' },
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
                <div className="text-5xl opacity-20">🔧</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 text-center">Set Due Date</h3>
            <div className="mb-6">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">Next Maintenance Date</label>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none" />
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[1, 3, 6].map(m => (
                <button key={m} onClick={() => setNewDueDate(fmtISO(addMonths(today, m)))}
                  className="py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-meta-4/80 transition-colors">
                  +{m} month{m > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSetDueModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">Cancel</button>
              <button onClick={handleSetDue}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MaintenanceOverview;
