import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import MainLayout from '../components/MainLayout';
import { format } from 'date-fns';
import { getToolCategorySizes } from '../utils/toolCategorySizes';
import JobReportModal, { type JobReportData } from '../components/JobReportModal';

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
    topBar: 'bg-yellow-400',
    dot: 'bg-yellow-400',
    headerBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    bodyBg: 'bg-yellow-50/30 dark:bg-yellow-900/10',
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

const LEFT_YARD_ROLES  = ['Yard Supervisor', 'Logistics Manager', 'Driver', 'Operations Coordinator', 'Other'];
const ONSITE_ROLES     = ['Rig Supervisor (Client side)', 'OTEC Field Engineer', 'Site Coordinator', 'Driver', 'Operations Coordinator', 'Other'];
const OPERATION_ROLES  = ['OTEC Field Engineer', 'Rig Supervisor (Client side)', 'Site Coordinator', 'Operations Coordinator', 'Other'];

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

/** Map backend status + local tracking → Kanban column. */
const getColId = (apiStatus: string, t: MachineTracking): KanbanColId => {
  switch (apiStatus) {
    case 'booked':   return 'booked';
    case 'active':   return t.reachedOnsite.status ? 'onsite' : 'in-transit';
    case 'job_done': return 'job-done';
    default:         return 'booked'; // returned / cancelled → hidden
  }
};

const safeFormat = (d?: string) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
};

// ─── TrackingRow ──────────────────────────────────────────────────────────────

interface TrackingRowProps {
  label: string;
  event: TrackingEvent;
  roles: string[];
  markLabel?: string;
  onChange: (updated: TrackingEvent) => void;
}

const TrackingRow = ({ label, event, roles, markLabel = 'Mark', onChange }: TrackingRowProps) => {
  const [otherText, setOtherText] = useState('');
  const handleMark   = () => onChange({ status: true,  timestamp: nowStr(), markedBy: roles[0], markedByRole: roles[0] });
  const handleUnmark = () => onChange({ status: false, timestamp: '',       markedBy: '',       markedByRole: ''       });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {event.status ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {label}: Done
            </span>
          ) : (
            <span className="text-slate-400 text-xs font-medium">{label}: Pending</span>
          )}
        </div>
        {event.status
          ? <button onClick={handleUnmark} className="text-xs text-red-500 hover:text-red-700 font-medium">Undo</button>
          : <button onClick={handleMark}   className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md hover:bg-blue-700 font-medium transition-colors">{markLabel}</button>
        }
      </div>
      {event.status && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{event.timestamp}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">By:</span>
            <select
              value={event.markedBy}
              onChange={e => onChange({ ...event, markedBy: e.target.value })}
              className="text-xs border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-slate-700 dark:text-white bg-white dark:bg-boxdark focus:ring-1 focus:ring-blue-400 focus:outline-none"
            >
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
            {event.markedBy === 'Other' && (
              <input
                value={otherText}
                onChange={e => { setOtherText(e.target.value); onChange({ ...event, markedByRole: e.target.value }); }}
                placeholder="Specify…"
                className="text-xs border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 w-24 focus:ring-1 focus:ring-blue-400 focus:outline-none dark:bg-boxdark dark:text-white"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: any;
  colId: KanbanColId;
  tracking: MachineTracking;
  onDragStart: (id: string) => void;
  onTrackingChange: (orderId: string, t: MachineTracking) => void;
  hasHardcopy?: boolean;
}

const OrderCard = ({ order, colId, tracking, onDragStart, onTrackingChange, hasHardcopy }: OrderCardProps) => {
  const col           = COLUMNS.find(c => c.id === colId)!;
  const isInTransit   = colId === 'in-transit';
  const isOnsite      = colId === 'onsite';
  const isTracked     = isInTransit || isOnsite;

  // Onsite sub-state
  const isStandby     = isOnsite && !tracking.operationStarted.status;
  const isActive      = isOnsite &&  tracking.operationStarted.status;

  const [expanded, setExpanded] = useState(isTracked);
  useEffect(() => { if (isTracked) setExpanded(true); }, [isTracked]);

  const update = (patch: Partial<MachineTracking>) =>
    onTrackingChange(order.id, { ...tracking, ...patch, lastUpdated: nowStr() });

  return (
    <div
      draggable
      onDragStart={() => onDragStart(order.id)}
      className="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Accent bar */}
      <div className={`h-1 rounded-t-xl ${col.topBar}`} />

      <div className="p-3.5 space-y-2.5">

        {/* Header: order number + sub-status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md truncate">
              #{order.orderNumber}
            </span>
            {/* Paperclip icon when signed hardcopy is attached */}
            {hasHardcopy && (
              <span title="Signed hardcopy attached" className="text-emerald-500 dark:text-emerald-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </span>
            )}
          </div>

          {isInTransit && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              IN-TRANSIT
            </span>
          )}

          {/* Onsite: show STANDBY or ACTIVE */}
          {isStandby && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              STANDBY
            </span>
          )}
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              ACTIVE
            </span>
          )}
        </div>

        {/* Customer name */}
        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
          {order.customer?.name || 'Unknown Customer'}
        </p>

        {/* Meta fields */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
            <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{order.rig?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{order.location?.name || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{safeFormat(order.startDate)} → {safeFormat(order.endDate)}</span>
          </div>
        </div>

        {/* ── Machine Tracking ── */}
        {isTracked && (
          <div className="border-t border-slate-100 dark:border-white/5 pt-2.5">

            {/* Toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors mb-2"
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Machine Tracking
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-normal">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">

                {/* ── In-Transit ── */}
                {isInTransit && (
                  <>
                    <TrackingRow
                      label="Left Yard"
                      event={tracking.leftYard}
                      roles={LEFT_YARD_ROLES}
                      markLabel="Mark Left"
                      onChange={ev => update({ leftYard: ev, isActive: true })}
                    />
                    <div className="border-t border-slate-200 dark:border-white/10 pt-2">
                      <TrackingRow
                        label="Reached Onsite"
                        event={tracking.reachedOnsite}
                        roles={ONSITE_ROLES}
                        markLabel="Mark Arrived"
                        onChange={ev => update({ reachedOnsite: ev })}
                      />
                    </div>
                  </>
                )}

                {/* ── Onsite (Standby or Active) ── */}
                {isOnsite && (
                  <>
                    {/* Read-only journey summary */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Left Yard
                        {tracking.leftYard.timestamp && (
                          <span className="ml-auto text-slate-400 dark:text-slate-500 font-normal text-[10px]">{tracking.leftYard.timestamp}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Reached Onsite
                        {tracking.reachedOnsite.timestamp && (
                          <span className="ml-auto text-slate-400 dark:text-slate-500 font-normal text-[10px]">{tracking.reachedOnsite.timestamp}</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-2">
                      {/* STANDBY → button to start operation */}
                      {isStandby && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Tools Standby
                          </span>
                          <button
                            onClick={() => update({
                              operationStarted: { status: true, timestamp: nowStr(), markedBy: OPERATION_ROLES[0], markedByRole: OPERATION_ROLES[0] },
                              isActive: true,
                            })}
                            className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-md hover:bg-emerald-700 font-bold transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Operation
                          </button>
                        </div>
                      )}

                      {/* ACTIVE → operation details + stop button */}
                      {isActive && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              Tools Active · Operating
                            </span>
                            <button
                              onClick={() => update({ operationStarted: emptyEvent(), isActive: false })}
                              className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-medium transition-colors"
                            >
                              Stop
                            </button>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                            <p>Started: <span className="font-medium text-slate-700 dark:text-slate-200">{tracking.operationStarted.timestamp}</span></p>
                            {tracking.operationStarted.markedBy && (
                              <p>By: <span className="font-medium text-slate-700 dark:text-slate-200">{tracking.operationStarted.markedBy}</span></p>
                            )}
                          </div>
                          {/* Change the "started by" role */}
                          <select
                            value={tracking.operationStarted.markedBy}
                            onChange={e => update({ operationStarted: { ...tracking.operationStarted, markedBy: e.target.value } })}
                            className="w-full text-xs border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-slate-700 dark:text-white bg-white dark:bg-boxdark focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          >
                            {OPERATION_ROLES.map(r => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-500 pt-0.5 border-t border-slate-200 dark:border-white/5">
                  Updated: {tracking.lastUpdated}
                </p>
              </div>
            )}
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
  const [startDate,  setStartDate] = useState('');
  const [endDate,    setEndDate]   = useState('');
  const [toolSearch, setToolSearch]= useState('');
  const [selTools,   setSelTools]  = useState<{ toolId: string; size: string }[]>([]);

  const filtered = tools.filter((t: any) =>
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    (t.type && t.type.toLowerCase().includes(toolSearch.toLowerCase()))
  );
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

  const handleSave = () => {
    if (!custId || !locId || !rigId || selTools.length === 0) {
      alert('Please fill in Customer, Location, Rig, and select at least one Tool.');
      return;
    }
    onSave({
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      customerId:  custId,
      locationId:  locId,
      rigId:       rigId,
      status:      'booked',   // ← new orders land directly in Booked
      startDate:   startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate:     endDate   ? new Date(endDate).toISOString()   : new Date(Date.now() + 7 * 86400000).toISOString(),
      items: selTools.map(i => ({ toolId: i.toolId, size: i.size || undefined, quantity: 1 })),
    });
  };

  const ToolRow = ({ tool }: { tool: any }) => {
    const sel   = selTools.find(i => i.toolId === tool.id);
    const sizes = getToolCategorySizes(tool.name);
    return (
      <div className="flex items-center hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors">
        <div className="flex-1 px-4 py-3 text-sm text-slate-900 dark:text-white flex items-center justify-between gap-2">
          <span>{tool.name}</span>
          {sel && (
            sizes && sizes.length > 0 ? (
              <select value={sel.size} onChange={e => changeSize(tool.id, e.target.value)}
                className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-boxdark">
                {sizes.map((s: string) => <option key={s} value={s}>{s}"</option>)}
              </select>
            ) : (
              <input type="text" placeholder='Size (e.g. 5")' value={sel.size} onChange={e => changeSize(tool.id, e.target.value)}
                className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white dark:bg-boxdark" />
            )
          )}
        </div>
        <div className="w-16 px-4 py-3 text-center">
          <input type="checkbox" checked={!!sel} onChange={() => toggleTool(tool.id, tool.name)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-900">
          <div>
            <h2 className="text-base font-black text-white">New Rental Order</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Order will be created as <span className="font-bold text-yellow-300">Booked</span>
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Customer <span className="text-red-500">*</span></label>
              <select value={custId} onChange={e => setCustId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <option value="">— Select customer —</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Location <span className="text-red-500">*</span></label>
              <select value={locId} onChange={e => setLocId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <option value="">— Select location —</option>
                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Rig <span className="text-red-500">*</span></label>
              <select value={rigId} onChange={e => setRigId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none">
                <option value="">— Select rig —</option>
                {rigs.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Tools <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1">(select at least one)</span>
              </label>
              <input value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Search tools…"
                className="w-44 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-boxdark dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-meta-4/50">
                <div className="flex-1 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Tool Name</div>
                <div className="w-16 px-4 py-2 text-xs font-bold text-slate-500 uppercase text-center">Select</div>
              </div>
              {trsTools.length > 0 && <>
                <div className="px-4 py-1.5 bg-slate-50 dark:bg-meta-4 text-xs font-black text-slate-500 uppercase tracking-widest">TRS</div>
                {trsTools.map((t: any) => <ToolRow key={t.id} tool={t} />)}
              </>}
              {dhtTools.length > 0 && <>
                <div className="px-4 py-1.5 bg-slate-50 dark:bg-meta-4 text-xs font-black text-slate-500 uppercase tracking-widest">DHT</div>
                {dhtTools.map((t: any) => <ToolRow key={t.id} tool={t} />)}
              </>}
              {trsTools.length === 0 && dhtTools.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">No tools found</div>
              )}
            </div>
            {selTools.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
                {selTools.length} tool{selTools.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-boxdark-2">
          <button onClick={onClose} disabled={isSaving}
            className="px-5 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || !custId || !locId || !rigId || selTools.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-blue-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
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
  const [dragId,           setDragId]           = useState<string | null>(null);
  const [dragOver,         setDragOver]         = useState<KanbanColId | null>(null);
  const [showModal,        setShowModal]        = useState(false);
  const [reportOrder,      setReportOrder]      = useState<any | null>(null);   // order awaiting job-done confirmation
  const [reportTracking,   setReportTracking]   = useState<MachineTracking | null>(null);
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

  const filteredOrders = allOrders.filter((o: any) =>
    !search ||
    (o.customer?.name || '').toLowerCase().includes(search) ||
    (o.orderNumber    || '').toLowerCase().includes(search) ||
    (o.rig?.name      || '').toLowerCase().includes(search) ||
    (o.location?.name || '').toLowerCase().includes(search)
  );

  const colOrders = (colId: KanbanColId) =>
    filteredOrders.filter((o: any) => getColId(o.status, getTracking(o.id)) === colId);

  const handleDrop = (targetColId: KanbanColId) => {
    if (!dragId) return;
    const order = allOrders.find((o: any) => o.id === dragId);
    if (!order) { setDragId(null); setDragOver(null); return; }

    const targetCol = COLUMNS.find(c => c.id === targetColId)!;
    const curr      = getTracking(dragId);
    let t: MachineTracking = { ...curr, lastUpdated: nowStr() };

    switch (targetColId) {
      case 'booked':
        t = emptyTracking();
        break;
      case 'in-transit':
        t = {
          ...t,
          leftYard:         curr.leftYard.status ? curr.leftYard : { status: true, timestamp: nowStr(), markedBy: '', markedByRole: '' },
          reachedOnsite:    emptyEvent(),
          operationStarted: emptyEvent(),
          isActive: true,
        };
        break;
      case 'onsite':
        t = {
          ...t,
          leftYard:         curr.leftYard.status      ? curr.leftYard      : { status: true, timestamp: nowStr(), markedBy: '', markedByRole: '' },
          reachedOnsite:    curr.reachedOnsite.status ? curr.reachedOnsite : { status: true, timestamp: nowStr(), markedBy: '', markedByRole: '' },
          operationStarted: emptyEvent(), // always start at Standby when dropping to Onsite
          isActive: false,
        };
        setTrackingMap(prev => ({ ...prev, [dragId]: t }));
        if (targetCol.apiStatus && order.status !== targetCol.apiStatus) {
          updateStatusMutation.mutate({ id: dragId, status: targetCol.apiStatus });
        }
        setDragId(null);
        setDragOver(null);
        return;

      case 'job-done': {
        // ── Intercept: show report modal before closing the job ──
        t = { ...t, isActive: false };
        setTrackingMap(prev => ({ ...prev, [dragId]: t }));
        setReportOrder(order);
        setReportTracking(t);
        setDragId(null);
        setDragOver(null);
        return;
      }
    }

    setTrackingMap(prev => ({ ...prev, [dragId]: t }));

    if (targetCol.apiStatus && order.status !== targetCol.apiStatus) {
      updateStatusMutation.mutate({ id: dragId, status: targetCol.apiStatus });
    }

    setDragId(null);
    setDragOver(null);
  };

  /** Called when the report modal confirms "Job Done" */
  const handleReportConfirm = (reportData: JobReportData) => {
    if (!reportOrder) return;
    // Persist hardcopy filename if uploaded
    if (reportData.hardcopyFileName) {
      setHardcopyMap(prev => ({ ...prev, [reportOrder.id]: reportData.hardcopyFileName! }));
    }
    // Now actually update the API status
    if (reportOrder.status !== 'job_done') {
      updateStatusMutation.mutate({ id: reportOrder.id, status: 'job_done' });
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
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              New Order
            </button>
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
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.id)}
            className={`flex flex-col min-w-[280px] w-[280px] shrink-0 rounded-2xl border-t-4 transition-all duration-150 ${
              col.topBar.replace('bg-', 'border-t-')
            } ${
              dragOver === col.id
                ? 'ring-2 ring-blue-400 shadow-xl bg-blue-50/60 dark:bg-blue-900/20'
                : 'shadow-sm'
            }`}
          >
            {/* Column header */}
            <div className={`${col.headerBg} px-4 py-3 rounded-t-xl border-b border-slate-100 dark:border-white/5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{col.label}</span>
                  {/* Onsite: show both sub-status labels */}
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
                <div className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${
                  dragOver === col.id
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-white/10'
                }`}>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Drop here</p>
                </div>
              ) : (
                colOrders(col.id).map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    colId={col.id}
                    tracking={getTracking(order.id)}
                    onDragStart={setDragId}
                    onTrackingChange={handleTrackingChange}
                    hasHardcopy={!!hardcopyMap[order.id]}
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
    </MainLayout>
  );
};

export default Orders;
