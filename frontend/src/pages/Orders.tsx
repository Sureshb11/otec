import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import MainLayout from '../components/MainLayout';
import Can from '../components/Can';
import { format } from 'date-fns';
import { getToolCategorySizes } from '../utils/toolCategorySizes';
import JobReportModal, { type JobReportData } from '../components/JobReportModal';
import OrderDetails from './OrderDetails';

// ─── Types ────────────────────────────────────────────────────────────────────

// 4-stage pipeline: Booked → In-Transit → Onsite → Job Done & Return
type KanbanColId = 'booked' | 'in-transit' | 'onsite' | 'job-done';

interface TrackingEvent {
  status: boolean;
  timestamp: string;
  markedBy: string;
  markedByRole?: string;
}

interface MachineTracking {
  leftYard: TrackingEvent;
  reachedOnsite: TrackingEvent;
  operationStarted: TrackingEvent; // true = Onsite ACTIVE, false = Onsite STANDBY
  isActive: boolean;
  lastUpdated: string;
}

type TrackingMap = Record<string, MachineTracking>;

// ─── Column Config ────────────────────────────────────────────────────────────

interface ColConfig {
  id: KanbanColId;
  label: string;
  description: string;
  topBar: string;
  dot: string;
  headerBg: string;
  bodyBg: string;
  apiStatus: string | null;
}

const COLUMNS: ColConfig[] = [
  {
    id: 'booked',
    label: 'Booked',
    description: 'Order confirmed · awaiting dispatch',
    topBar: 'bg-slate-500',
    dot: 'bg-slate-500',
    headerBg: 'bg-slate-50 dark:bg-slate-900/30',
    bodyBg: 'bg-slate-50/30 dark:bg-slate-900/10',
    apiStatus: 'booked',
  },
  {
    id: 'in-transit',
    label: 'In-Transit',
    description: 'Machine dispatched · en-route to rig',
    topBar: 'bg-blue-500',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-50 dark:bg-blue-900/20',
    bodyBg: 'bg-blue-50/30 dark:bg-blue-900/10',
    apiStatus: 'active',
  },
  {
    id: 'onsite',
    label: 'Onsite',
    description: 'Standby · awaiting start   /   Active · tools in operation',
    topBar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bodyBg: 'bg-emerald-50/30 dark:bg-emerald-900/10',
    apiStatus: null, // sub-state of 'active'
  },
  {
    id: 'job-done',
    label: 'Job Done & Return',
    description: 'Operation complete · tools returning to yard',
    topBar: 'bg-purple-500',
    dot: 'bg-purple-500',
    headerBg: 'bg-purple-50 dark:bg-purple-900/20',
    bodyBg: 'bg-purple-50/30 dark:bg-purple-900/10',
    apiStatus: 'job_done',
  },
];

const OPERATION_ROLES = ['OTEC Field Engineer', 'Rig Supervisor (Client side)', 'Site Coordinator', 'Operations Coordinator', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const nowStr = () =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).replace(',', '');

const emptyEvent = (): TrackingEvent => ({ status: false, timestamp: '', markedBy: '', markedByRole: '' });

const emptyTracking = (): MachineTracking => ({
  leftYard:         emptyEvent(),
  reachedOnsite:    emptyEvent(),
  operationStarted: emptyEvent(),
  isActive:         false,
  lastUpdated:      nowStr(),
});

/** Map backend status + local tracking → Kanban column. Returns null for statuses outside the pipeline. */
const getColId = (apiStatus: string, t: MachineTracking): KanbanColId | null => {
  switch (apiStatus) {
    case 'booked':   return 'booked';
    case 'active':   return t.reachedOnsite.status ? 'onsite' : 'in-transit';
    case 'job_done': return 'job-done';
    default:         return null; // draft / returned / cancelled → hidden
  }
};

const safeFormat = (d?: string) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
};


// ─── Standby Hours Calculator ──────────────────────────────────────────────────

const calcStandbyHours = (reachedTs: string, startedTs?: string): string => {
  if (!reachedTs) return '—';
  try {
    // Parse the timestamp format "DD Mon YYYY HH:MM am/pm"
    const reached = new Date(reachedTs);
    const end     = startedTs ? new Date(startedTs) : new Date();
    if (isNaN(reached.getTime())) return '—';
    const diffMs = end.getTime() - reached.getTime();
    if (diffMs < 0) return '0h 0m';
    const hours = Math.floor(diffMs / 3600000);
    const mins  = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  } catch { return '—'; }
};

// ─── Confirm Action Modal ─────────────────────────────────────────────────────

type ActionType = 'dispatch' | 'cancel' | 'reached' | 'start' | 'complete' | 'return';

interface ConfirmActionModalProps {
  actionType: ActionType;
  orderNumber: string;
  customerName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<ActionType, { title: string; message: string; confirmLabel: string; iconBg: string; iconColor: string; buttonBg: string; icon: JSX.Element }> = {
  dispatch: {
    title: 'Dispatch — Left from Yard',
    message: 'This will mark the machine as dispatched and move the order to In-Transit.',
    confirmLabel: 'Dispatch Now',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonBg: 'from-blue-600 to-blue-700',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  },
  cancel: {
    title: 'Cancel Order',
    message: 'This order will be cancelled and removed from the pipeline. This action cannot be undone.',
    confirmLabel: 'Cancel Order',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    buttonBg: 'from-rose-600 to-rose-500',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  },
  reached: {
    title: 'Reached Onsite',
    message: 'Mark the machine as arrived at the rig site. The order will move to Onsite (Standby).',
    confirmLabel: 'Mark Arrived',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    buttonBg: 'from-emerald-600 to-emerald-700',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  start: {
    title: 'Start Job',
    message: 'Start the operation. Once started, the job must be completed before the order can proceed.',
    confirmLabel: 'Start Job',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    buttonBg: 'from-emerald-600 to-emerald-700',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  complete: {
    title: 'Complete Job',
    message: 'Mark the job as complete. The order will move to Job Done & Return.',
    confirmLabel: 'Complete Job',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    buttonBg: 'from-purple-600 to-purple-700',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  return: {
    title: 'Return Tools',
    message: 'Release tools back to yard. This will complete the order lifecycle.',
    confirmLabel: 'Return Tools',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    buttonBg: 'from-purple-600 to-purple-700',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
  },
};

const ConfirmActionModal = ({ actionType, orderNumber, customerName, onClose, onConfirm, isLoading }: ConfirmActionModalProps) => {
  const cfg = ACTION_CONFIG[actionType];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/20 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl ${cfg.iconBg} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
            <span className={cfg.iconColor}>{cfg.icon}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{cfg.title}</h2>
          <div className="mt-3 space-y-1">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              #{orderNumber} · {customerName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cfg.message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl font-bold transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className={`flex-1 py-3 bg-gradient-to-r ${cfg.buttonBg} text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2`}>
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: any;
  colId: KanbanColId;
  tracking: MachineTracking;
  onTrackingChange: (orderId: string, t: MachineTracking) => void;
  hasHardcopy?: boolean;
  onAction: (orderId: string, action: ActionType) => void;
  onView?: (id: string) => void;
}

const OrderCard = ({ order, colId, tracking, hasHardcopy, onAction, onView }: OrderCardProps) => {
  const col           = COLUMNS.find(c => c.id === colId)!;
  const isOnsite      = colId === 'onsite';

  // Onsite sub-state
  const isStandby     = isOnsite && !tracking.operationStarted.status;
  const isActive      = isOnsite &&  tracking.operationStarted.status;

  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);


  // Get menu items based on column
  const getMenuItems = (): { label: string; action: ActionType; color: string; icon: JSX.Element }[] => {
    switch (colId) {
      case 'booked':
        return [
          { label: 'Left from Yard', action: 'dispatch', color: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10',
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg> },
          { label: 'Cancel Order', action: 'cancel', color: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10',
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> },
        ];
      case 'in-transit':
        return [
          { label: 'Reached Onsite', action: 'reached', color: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg> },
        ];
      case 'onsite':
        return isStandby
          ? [{ label: 'Start Job', action: 'start', color: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
               icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg> }]
          : [{ label: 'Complete Job', action: 'complete', color: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10',
               icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }];
      case 'job-done':
        return [
          { label: 'Return Tools', action: 'return', color: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10',
            icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> },
        ];
      default: return [];
    }
  };

  return (
    <div onClick={() => onView?.(order.id)}
      className="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-md transition-all duration-200 cursor-pointer select-none">
      <div className={`h-1 rounded-t-xl ${col.topBar}`} />
      <div className="p-3.5 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md truncate">#{order.orderNumber}</span>
            {hasHardcopy && (
              <span title="Signed hardcopy attached" className="text-emerald-500 dark:text-emerald-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </span>
            )}
            {colId === 'in-transit' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> IN-TRANSIT
              </span>
            )}
            {isStandby && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> STANDBY
              </span>
            )}
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span> ACTIVE
              </span>
            )}
          </div>
          {/* Three-dot menu */}
          <div className="relative shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 bg-white dark:bg-boxdark rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1 min-w-[160px]">
                {getMenuItems().map(item => (
                  <button key={item.action}
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction(order.id, item.action); }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${item.color}`}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer */}
        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{order.customer?.name || 'Unknown Customer'}</p>

        {/* Meta */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
            <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{order.rig?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="truncate">{order.location?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>{safeFormat(order.startDate)} → {safeFormat(order.endDate)}</span>
          </div>
        </div>

        {/* ── Onsite Machine Tracking Summary ── */}
        {isOnsite && (
          <div className="border-t border-slate-100 dark:border-white/5 pt-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Machine Tracking</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Left Yard</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 text-[11px]">{tracking.leftYard.timestamp || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Reached Onsite</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 text-[11px]">{tracking.reachedOnsite.timestamp || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-white/10 pt-1.5">
                <span className="text-orange-600 dark:text-orange-400 font-bold">Standby Hours</span>
                <span className="font-black text-orange-700 dark:text-orange-300 text-[11px]">
                  {calcStandbyHours(tracking.reachedOnsite.timestamp, tracking.operationStarted.status ? tracking.operationStarted.timestamp : undefined)}
                </span>
              </div>
              {isActive && tracking.operationStarted.timestamp && (
                <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-white/10 pt-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Job Started</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300 text-[11px]">{tracking.operationStarted.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Done: show hardcopy status */}
        {colId === 'job-done' && hasHardcopy && (
          <div className="border-t border-slate-100 dark:border-white/5 pt-2.5">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              Signed hardcopy attached
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── New Order Modal ──────────────────────────────────────────────────────────

interface NewOrderModalProps {
  customers: any[];
  locations: any[];
  rigs: any[];
  tools: any[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const NewOrderModal = ({ customers, locations, rigs, tools, isSaving, onClose, onSave }: NewOrderModalProps) => {
  const [custId,     setCustId]    = useState('');
  const [locId,      setLocId]     = useState('');
  const [rigId,      setRigId]     = useState('');
  const [rigText,    setRigText]   = useState('');
  const [showRigSuggestions, setShowRigSuggestions] = useState(false);
  const [wellNumber, setWellNumber] = useState('');
  const [startDate,  setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate]   = useState('');
  const [toolSearch, setToolSearch]= useState('');
  const [selTools,   setSelTools]  = useState<{ toolId: string; size: string }[]>([]);
  const [isCreatingRig, setIsCreatingRig] = useState(false);

  // Filter rigs based on typed text
  const filteredRigs = rigs.filter((r: any) =>
    r.name.toLowerCase().includes(rigText.toLowerCase())
  );

  // Check if exact match exists
  const exactRigMatch = rigs.find((r: any) => r.name.toLowerCase() === rigText.trim().toLowerCase());

  const handleRigSelect = (rig: any) => {
    setRigId(rig.id);
    setRigText(rig.name);
    setShowRigSuggestions(false);
  };

  const handleRigInputChange = (value: string) => {
    setRigText(value);
    setRigId(''); // clear ID — will be resolved on save
    setShowRigSuggestions(value.length > 0);
  };

  const filtered = tools.filter((t: any) => {
    const q = toolSearch.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.serialNumber?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q)
    );
  });
  const trsTools = filtered.filter((t: any) => t.type === 'TRS');
  const dhtTools = filtered.filter((t: any) => t.type === 'DHT');

  const toggleTool = (toolId: string, toolName: string) => {
    setSelTools(prev => {
      const found = prev.find(i => i.toolId === toolId);
      if (found) return prev.filter(i => i.toolId !== toolId);
      const sizes = getToolCategorySizes(toolName);
      return [...prev, { toolId, size: sizes?.[0] ?? '' }];
    });
  };

  const changeSize = (toolId: string, size: string) =>
    setSelTools(prev => prev.map(i => i.toolId === toolId ? { ...i, size } : i));

  const handleSave = async () => {
    if (!custId || !locId || !rigText.trim() || selTools.length === 0) {
      alert('Please fill in Customer, Location, Rig, and select at least one Tool.');
      return;
    }

    let finalRigId = rigId;

    // If no rigId selected (user typed a new rig name), auto-create it
    if (!finalRigId) {
      // Check if an exact match exists (user may have typed an existing name without clicking suggestion)
      const match = rigs.find((r: any) => r.name.toLowerCase() === rigText.trim().toLowerCase());
      if (match) {
        finalRigId = match.id;
      } else {
        // Auto-create the rig
        try {
          setIsCreatingRig(true);
          const newRig = await apiClient.rigs.create({
            name: rigText.trim(),
            type: 'TRS', // default type
            status: 'active',
            locationId: locId || undefined,
            customerId: custId || undefined,
          });
          finalRigId = newRig.id;
        } catch (err: any) {
          console.error('Failed to auto-create rig:', err);
          alert(err?.response?.data?.message || 'Failed to create new rig. Please try again.');
          return;
        } finally {
          setIsCreatingRig(false);
        }
      }
    }

    onSave({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      customerId:  custId,
      locationId:  locId,
      rigId:       finalRigId,
      wellNumber:  wellNumber.trim() || undefined,
      status:      'booked',
      startDate:   startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate:     endDate   ? new Date(endDate).toISOString()   : new Date(Date.now() + 7 * 86400000).toISOString(),
      items: selTools.map(i => ({ toolId: i.toolId, size: i.size || undefined, quantity: 1 })),
    });

    // Auto-update rig with well number if provided
    if (wellNumber.trim() && finalRigId) {
      apiClient.rigs.update(finalRigId, { wellNumber: wellNumber.trim() }).catch(err =>
        console.error('Failed to update rig well number:', err)
      );
    }
  };

  const ToolRow = ({ tool }: { tool: any }) => {
    const sel   = selTools.find(i => i.toolId === tool.id);
    const sizes = getToolCategorySizes(tool.name);
    return (
      <div className="flex items-center hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0">
        <div className="w-[28%] px-3 py-2.5 text-sm text-slate-900 dark:text-white font-medium truncate">{tool.name}</div>
        <div className="w-[18%] px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">{tool.category || '—'}</div>
        <div className="w-[18%] px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{tool.serialNumber || '—'}</div>
        <div className="w-[22%] px-3 py-2.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">{tool.description || '—'}</div>
        <div className="w-[14%] px-3 py-2.5 flex items-center justify-center gap-2">
          <input type="checkbox" checked={!!sel} onChange={() => toggleTool(tool.id, tool.name)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
          {sel && (
            sizes && sizes.length > 0 ? (
              <select value={sel.size} onChange={e => changeSize(tool.id, e.target.value)}
                className="w-20 px-1.5 py-0.5 text-[10px] border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-boxdark">
                {sizes.map((s: string) => <option key={s} value={s}>{s}"</option>)}
              </select>
            ) : (
              <input type="text" placeholder='Size' value={sel.size} onChange={e => changeSize(tool.id, e.target.value)}
                className="w-20 px-1.5 py-0.5 text-[10px] border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-boxdark" />
            )
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20 dark:border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Rental Order</h2>
              <p className="text-xs text-slate-400 font-medium">
                Order will be created as <span className="font-bold text-blue-600 dark:text-blue-400">Booked</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Order Details Section */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Order Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Customer <span className="text-red-500">*</span></label>
                <select value={custId} onChange={e => setCustId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all">
                  <option value="">-- Select customer --</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Location <span className="text-red-500">*</span></label>
                <select value={locId} onChange={e => setLocId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all">
                  <option value="">-- Select location --</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Rig <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={rigText}
                onChange={e => handleRigInputChange(e.target.value)}
                onFocus={() => rigText.length > 0 && setShowRigSuggestions(true)}
                onBlur={() => setTimeout(() => setShowRigSuggestions(false), 200)}
                placeholder="Type rig name..."
                className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
              />
              {rigText.trim() && !exactRigMatch && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New rig — auto-created on save
                </p>
              )}
              {showRigSuggestions && filteredRigs.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-boxdark rounded-xl shadow-xl border border-slate-200 dark:border-white/10 max-h-40 overflow-y-auto">
                  {filteredRigs.map((r: any) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={() => handleRigSelect(r)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{r.name}</span>
                      {r.location?.name && <span className="text-[10px] text-slate-400 font-bold">{r.location.name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Well No</label>
              <input
                type="text"
                value={wellNumber}
                onChange={e => setWellNumber(e.target.value)}
                placeholder="e.g. W-101"
                className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Start Date</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Tools <span className="text-red-500">*</span>
                <span className="text-slate-300 font-medium ml-1 normal-case tracking-normal">(select at least one)</span>
              </h4>
            </div>
            <div className="relative mb-3">
              <input value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Search by name, category, description, or item code..."
                className="w-full border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white/50 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all" />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-meta-4/50">
                <div className="w-[28%] px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Tool Name</div>
                <div className="w-[18%] px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</div>
                <div className="w-[18%] px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Item Code</div>
                <div className="w-[22%] px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Description</div>
                <div className="w-[14%] px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase text-center tracking-wider">Select</div>
              </div>
              {trsTools.length > 0 && <>
                <div className="px-4 py-1.5 bg-blue-50 dark:bg-blue-500/5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">TRS</div>
                {trsTools.map((t: any) => <ToolRow key={t.id} tool={t} />)}
              </>}
              {dhtTools.length > 0 && <>
                <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">DHT</div>
                {dhtTools.map((t: any) => <ToolRow key={t.id} tool={t} />)}
              </>}
              {trsTools.length === 0 && dhtTools.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">No tools found</div>
              )}
            </div>
            {selTools.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {selTools.length} tool{selTools.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5">
          <button onClick={onClose} disabled={isSaving}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || isCreatingRig || !custId || !locId || !rigText.trim() || selTools.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Orders = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: orders    = [], isLoading } = useQuery({ queryKey: ['orders'],    queryFn: apiClient.orders.getAll,    refetchInterval: 30000 });
  const { data: customers = [] }            = useQuery({ queryKey: ['customers'], queryFn: apiClient.customers.getAll });
  const { data: locations = [] }            = useQuery({ queryKey: ['locations'], queryFn: apiClient.locations.getAll });
  const { data: rigs      = [] }            = useQuery({ queryKey: ['rigs'],      queryFn: apiClient.rigs.getAll      });
  const { data: tools     = [] }            = useQuery({ queryKey: ['tools'],     queryFn: apiClient.tools.getAll     });

  const createMutation = useMutation({
    mutationFn: apiClient.orders.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); setShowModal(false); },
    onError:   () => alert('Failed to create order. Please try again.'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.orders.updateStatus(id, status),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    onError:    () => alert('Failed to update order status.'),
  });


  const [selectedPopupOrderId, setSelectedPopupOrderId] = useState<string | null>(null);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [trackingMap,      setTrackingMapRaw]   = useState<TrackingMap>(() => {
    try { return JSON.parse(localStorage.getItem('otec_tracking_map') || '{}'); } catch { return {}; }
  });
  const setTrackingMap = (updater: TrackingMap | ((prev: TrackingMap) => TrackingMap)) => {
    setTrackingMapRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('otec_tracking_map', JSON.stringify(next));
      return next;
    });
  };

  const [showModal,        setShowModal]        = useState(() => !!(location.state as any)?.openNewOrder);
  const [reportOrder,      setReportOrder]      = useState<any | null>(null);
  const [reportTracking,   setReportTracking]   = useState<MachineTracking | null>(null);
  const [confirmAction,    setConfirmAction]    = useState<{ orderId: string; action: ActionType } | null>(null);
  // Map of orderId → hardcopy filename, persisted across re-renders
  const [hardcopyMap,      setHardcopyMapRaw]   = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('otec_hardcopy_map') || '{}'); } catch { return {}; }
  });
  const setHardcopyMap = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    setHardcopyMapRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('otec_hardcopy_map', JSON.stringify(next));
      return next;
    });
  };

  const search      = searchTerm.toLowerCase();
  const allOrders   = Array.isArray(orders) ? orders : [];
  const getTracking = (id: string) => trackingMap[id] ?? emptyTracking();

  // Only show orders that belong on the Kanban board (exclude returned, cancelled, draft).
  // Also auto-clear job_done orders after 24h — they linger on the board for a day
  // after being marked complete, then drop off automatically.
  const JOB_DONE_TTL_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const boardOrders = allOrders.filter((o: any) => {
    const col = getColId(o.status, getTracking(o.id));
    if (col === null) return false;
    if (col === 'job-done') {
      const stamp = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
      if (stamp && now - stamp >= JOB_DONE_TTL_MS) return false;
    }
    return true;
  });

  const filteredOrders = boardOrders.filter((o: any) =>
    !search ||
    (o.customer?.name || '').toLowerCase().includes(search) ||
    (o.orderNumber    || '').toLowerCase().includes(search) ||
    (o.rig?.name      || '').toLowerCase().includes(search) ||
    (o.location?.name || '').toLowerCase().includes(search)
  );

  const colOrders = (colId: KanbanColId) =>
    filteredOrders.filter((o: any) => getColId(o.status, getTracking(o.id)) === colId);

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleAction = (orderId: string, action: ActionType) => {
    setConfirmAction({ orderId, action });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { orderId, action } = confirmAction;
    const order = allOrders.find((o: any) => o.id === orderId);
    if (!order) { setConfirmAction(null); return; }
    const curr = getTracking(orderId);

    switch (action) {
      case 'dispatch': {
        // Booked → In-Transit: mark leftYard, set status active
        const t: MachineTracking = {
          ...curr,
          leftYard: { status: true, timestamp: nowStr(), markedBy: '', markedByRole: '' },
          reachedOnsite: emptyEvent(),
          operationStarted: emptyEvent(),
          isActive: true,
          lastUpdated: nowStr(),
        };
        setTrackingMap(prev => ({ ...prev, [orderId]: t }));
        updateStatusMutation.mutate({ id: orderId, status: 'active' });
        break;
      }
      case 'cancel': {
        // Booked → Cancelled
        updateStatusMutation.mutate({ id: orderId, status: 'cancelled' });
        setTrackingMap(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        break;
      }
      case 'reached': {
        // In-Transit → Onsite (Standby): mark reachedOnsite
        const t: MachineTracking = {
          ...curr,
          reachedOnsite: { status: true, timestamp: nowStr(), markedBy: '', markedByRole: '' },
          operationStarted: emptyEvent(),
          isActive: false,
          lastUpdated: nowStr(),
        };
        setTrackingMap(prev => ({ ...prev, [orderId]: t }));
        // Status stays 'active' — column is determined by tracking
        break;
      }
      case 'start': {
        // Onsite Standby → Onsite Active: mark operationStarted
        const t: MachineTracking = {
          ...curr,
          operationStarted: { status: true, timestamp: nowStr(), markedBy: OPERATION_ROLES[0], markedByRole: OPERATION_ROLES[0] },
          isActive: true,
          lastUpdated: nowStr(),
        };
        setTrackingMap(prev => ({ ...prev, [orderId]: t }));
        // Persist operational-runtime start on the backend so the Dashboard timer
        // ticks from this moment instead of the earlier Onsite-drop (activatedAt).
        apiClient.orders.startOperation(orderId)
          .catch(err => console.error('Failed to start operation timer:', err));
        break;
      }
      case 'complete': {
        // Onsite Active → Job Done: show report modal
        const t: MachineTracking = { ...curr, isActive: false, lastUpdated: nowStr() };
        setTrackingMap(prev => ({ ...prev, [orderId]: t }));
        setReportOrder(order);
        setReportTracking(t);
        break;
      }
      case 'return': {
        // Job Done → Returned
        apiClient.orders.updateStatus(orderId, 'returned')
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setTrackingMap(prev => {
              const next = { ...prev };
              delete next[orderId];
              return next;
            });
          })
          .catch(() => alert('Failed to return order.'));
        break;
      }
    }
    setConfirmAction(null);
  };

  /** Called when the report modal confirms "Job Done" */
  const handleReportConfirm = (reportData: JobReportData) => {
    if (!reportOrder) return;
    // Persist hardcopy filename if uploaded
    if (reportData.hardcopyFileName) {
      setHardcopyMap(prev => ({ ...prev, [reportOrder.id]: reportData.hardcopyFileName! }));
    }
    // Move to job_done — keep it visible in the "Job Done & Return" column
    // Tools are released when the order is explicitly returned from that column
    const orderId = reportOrder.id;
    if (reportOrder.status !== 'job_done') {
      apiClient.orders.updateStatus(orderId, 'job_done')
        .then(() => queryClient.invalidateQueries({ queryKey: ['orders'] }))
        .catch(() => alert('Failed to update order status to Job Done.'));
    } else {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
    setReportOrder(null);
    setReportTracking(null);
  };

  const handleTrackingChange = (orderId: string, t: MachineTracking) =>
    setTrackingMap(prev => ({ ...prev, [orderId]: t }));



  if (isLoading) {
    return (
      <MainLayout headerContent={<h1 className="text-2xl font-black text-slate-800 dark:text-white">Orders</h1>}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-slate-500">Loading orders…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900 dark:from-white dark:via-blue-400 dark:to-white bg-clip-text text-transparent tracking-tight">
              Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Booked → In-Transit → Onsite (Standby / Active) → Job Done &amp; Return
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search orders…"
                className="pl-9 pr-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl text-sm bg-white/80 dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none w-56 shadow-sm"
              />
            </div>
            <Can module="orders" action="add">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </button>
            </Can>
          </div>
        </div>
      }
    >
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-boxdark border border-slate-100 dark:border-white/5 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
            <span className="text-slate-700 dark:text-slate-300">{col.label}</span>
            <span className="text-slate-400 font-normal">({colOrders(col.id).length})</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Kanban Board — 4 columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-300px)]">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className={`flex flex-col min-w-[280px] w-[280px] shrink-0 rounded-2xl border-t-4 shadow-sm transition-all duration-150 ${
              col.topBar.replace('bg-', 'border-t-')
            }`}
          >
            {/* Column header */}
            <div className={`${col.headerBg} px-4 py-3 rounded-t-xl border-b border-slate-100 dark:border-white/5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{col.label}</span>
                  {col.id === 'onsite' && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded">Standby</span>
                      <span className="text-slate-300 dark:text-slate-600 text-[10px]">/</span>
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white dark:bg-boxdark px-2 py-0.5 rounded-full shadow-sm border border-slate-100 dark:border-white/5">
                  {colOrders(col.id).length}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{col.description}</p>
            </div>

            {/* Cards */}
            <div className={`flex-1 p-3 space-y-3 overflow-y-auto ${col.bodyBg}`}>
              {colOrders(col.id).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-xs text-slate-400 dark:text-slate-600">No orders</p>
                </div>
              ) : (
                colOrders(col.id).map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    colId={col.id}
                    tracking={getTracking(order.id)}
                    onTrackingChange={handleTrackingChange}
                    hasHardcopy={!!hardcopyMap[order.id]}
                    onAction={handleAction}
                    onView={setSelectedPopupOrderId}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewOrderModal
          customers={Array.isArray(customers) ? customers : []}
          locations={Array.isArray(locations)  ? locations  : []}
          rigs={Array.isArray(rigs)             ? rigs       : []}
          tools={Array.isArray(tools)           ? tools      : []}
          isSaving={createMutation.isLoading as boolean}
          onClose={() => setShowModal(false)}
          onSave={data => createMutation.mutate(data)}
        />
      )}

      {/* ── Job Report Modal — shown when dragging to Job Done ── */}
      {reportOrder && (
        <JobReportModal
          reportData={{
            reportNumber: `RPT-${reportOrder.orderNumber}-${Date.now().toString().slice(-4)}`,
            orderId:        reportOrder.id,
            orderNumber:    reportOrder.orderNumber,
            customerName:   reportOrder.customer?.name  ?? '—',
            locationName:   reportOrder.location?.name  ?? '',
            rigName:        reportOrder.rig?.name        ?? '',
            jobStartDate:   reportOrder.startDate        ?? '',
            jobEndDate:     reportOrder.endDate ?? reportOrder.returnedAt ?? new Date().toISOString(),
            tools: Array.isArray(reportOrder.items)
              ? reportOrder.items.map((item: any) => ({
                  toolId:       item.toolId,
                  toolName:     item.tool?.name ?? `Tool ${item.toolId}`,
                  serialNumber: item.tool?.serialNumber ?? '',
                  size:         item.tool?.size ?? '',
                  quantity:     item.quantity ?? 1,
                }))
              : [],
            assignedPersonnel: '',
            notes:             reportOrder.notes ?? '',
            operationSummary:  '',
            returnCondition:   'Good',
            hoursOnsite: reportTracking?.operationStarted?.timestamp
              ? `Since ${reportTracking.operationStarted.timestamp}`
              : '',
            signedOffBy: '',
          }}
          onClose={() => { setReportOrder(null); setReportTracking(null); }}
          onConfirm={handleReportConfirm}
        />
      )}

      {selectedPopupOrderId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPopupOrderId(null)} />
          <div className="relative bg-white dark:bg-boxdark rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10">
            <OrderDetails orderIdProp={selectedPopupOrderId} isModal={true} onClose={() => setSelectedPopupOrderId(null)} />
          </div>
        </div>
      )}

      {/* ── Confirm Action Modal ── */}
      {confirmAction && (() => {
        const order = allOrders.find((o: any) => o.id === confirmAction.orderId);
        if (!order) return null;
        return (
          <ConfirmActionModal
            actionType={confirmAction.action}
            orderNumber={order.orderNumber}
            customerName={order.customer?.name || 'Unknown'}
            onClose={() => setConfirmAction(null)}
            onConfirm={executeAction}
          />
        );
      })()}

    </MainLayout>
  );
};

export default Orders;
