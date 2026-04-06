import { useState, useRef, useEffect } from 'react';
import MainLayout from '../components/MainLayout';

// ─── Types ───────────────────────────────────────────────────────────────────

type ColumnId = 'drafts' | 'booked' | 'active' | 'onsite' | 'job-done';

interface TrackingEvent {
  status: boolean;
  timestamp: string;
  markedBy: string;
  markedByRole?: string;
}

interface MachineTracking {
  leftYard: TrackingEvent;
  reachedOnsite: TrackingEvent;
  currentLocation?: { lat: number; lng: number; address: string };
  isActive: boolean;
  lastUpdated: string;
}

interface PipelineOrder {
  id: string;
  orderNumber: string;
  customer: string;
  rig: string;
  location: string;
  startDate: string;
  endDate: string;
  column: ColumnId;
  tracking: MachineTracking;
}

interface Customer { id: string; name: string; }
interface Location  { id: string; name: string; }
interface Rig       { id: string; name: string; }
interface Tool      { id: string; name: string; group: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: ColumnId; label: string; color: string; headerBg: string; dot: string }[] = [
  { id: 'drafts',   label: 'Drafts',            color: 'border-t-gray-400',   headerBg: 'bg-gray-50',   dot: 'bg-gray-400'   },
  { id: 'booked',   label: 'Booked',            color: 'border-t-yellow-400', headerBg: 'bg-yellow-50', dot: 'bg-yellow-400' },
  { id: 'active',   label: 'Active',            color: 'border-t-blue-500',   headerBg: 'bg-blue-50',   dot: 'bg-blue-500'   },
  { id: 'onsite',   label: 'Onsite',            color: 'border-t-green-500',  headerBg: 'bg-green-50',  dot: 'bg-green-500'  },
  { id: 'job-done', label: 'Job Done & Return', color: 'border-t-purple-500', headerBg: 'bg-purple-50', dot: 'bg-purple-500' },
];

const LEFT_YARD_ROLES = [
  'Yard Supervisor',
  'Logistics Manager',
  'Driver',
  'Operations Coordinator',
  'Other',
];

const ONSITE_ROLES = [
  'Rig Supervisor (Client side)',
  'OTEC Field Engineer',
  'Site Coordinator',
  'Driver',
  'Operations Coordinator',
  'Other',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).replace(',', '');

const emptyTracking = (): MachineTracking => ({
  leftYard:     { status: false, timestamp: '', markedBy: '', markedByRole: '' },
  reachedOnsite:{ status: false, timestamp: '', markedBy: '', markedByRole: '' },
  isActive:     false,
  lastUpdated:  now(),
});

// ─── Mock seed data ───────────────────────────────────────────────────────────

const SEED_ORDERS: PipelineOrder[] = [
  {
    id: 'ord-1', orderNumber: '#ORD-637194',
    customer: 'Kuwait Oil Company', rig: 'Rig 101',
    location: 'North Kuwait', startDate: '01 Apr 2026', endDate: '14 Apr 2026',
    column: 'active',
    tracking: {
      leftYard: { status: true,  timestamp: '04 Apr 2026 09:15 AM', markedBy: 'Yard Supervisor' },
      reachedOnsite: { status: false, timestamp: '', markedBy: '' },
      currentLocation: { lat: 29.3759, lng: 47.9774, address: '29.3759°N, 47.9774°E – 45 km from rig' },
      isActive: true, lastUpdated: now(),
    },
  },
  {
    id: 'ord-2', orderNumber: '#ORD-512830',
    customer: 'Burgan Energy', rig: 'Rig 45',
    location: 'West Kuwait', startDate: '03 Apr 2026', endDate: '17 Apr 2026',
    column: 'onsite',
    tracking: {
      leftYard:      { status: true, timestamp: '02 Apr 2026 07:30 AM', markedBy: 'Logistics Manager' },
      reachedOnsite: { status: true, timestamp: '03 Apr 2026 14:00 PM', markedBy: 'OTEC Field Engineer' },
      currentLocation: { lat: 29.1004, lng: 47.7032, address: '29.1004°N, 47.7032°E – 12 km from rig' },
      isActive: true, lastUpdated: now(),
    },
  },
  {
    id: 'ord-3', orderNumber: '#ORD-481023',
    customer: 'Kuwait Oil Company', rig: 'Rig 22',
    location: 'South East Kuwait', startDate: '10 Apr 2026', endDate: '24 Apr 2026',
    column: 'booked',
    tracking: emptyTracking(),
  },
  {
    id: 'ord-4', orderNumber: '#ORD-399017',
    customer: 'Gulf Drilling', rig: 'Rig 77',
    location: 'Gas Field', startDate: '15 Mar 2026', endDate: '30 Mar 2026',
    column: 'job-done',
    tracking: {
      leftYard:      { status: true, timestamp: '14 Mar 2026 06:00 AM', markedBy: 'Driver' },
      reachedOnsite: { status: true, timestamp: '15 Mar 2026 11:00 AM', markedBy: 'Rig Supervisor (Client side)' },
      isActive: false, lastUpdated: now(),
    },
  },
  {
    id: 'ord-5', orderNumber: '#ORD-211456',
    customer: 'KNPC Services', rig: 'Rig 9',
    location: 'North Kuwait', startDate: '20 Apr 2026', endDate: '04 May 2026',
    column: 'drafts',
    tracking: emptyTracking(),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TrackingRowProps {
  label: string;
  event: TrackingEvent;
  roles: string[];
  editable: boolean;
  onChange: (updated: TrackingEvent) => void;
}

const TrackingRow = ({ label, event, roles, editable, onChange }: TrackingRowProps) => {
  const [otherText, setOtherText] = useState('');
  const isOther = event.markedBy === 'Other';

  const handleMark = () => {
    onChange({ status: true, timestamp: now(), markedBy: roles[0], markedByRole: roles[0] });
  };

  const handleUnmark = () => {
    onChange({ status: false, timestamp: '', markedBy: '', markedByRole: '' });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {event.status ? (
            <span className="inline-flex items-center space-x-1 text-green-700 font-medium text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{label}: Yes</span>
            </span>
          ) : (
            <span className="text-gray-400 text-xs font-medium">{label}: No</span>
          )}
        </div>
        {editable && (
          event.status ? (
            <button onClick={handleUnmark} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
              Undo
            </button>
          ) : (
            <button onClick={handleMark} className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-md hover:bg-primary-700 font-medium transition-colors">
              Mark
            </button>
          )
        )}
      </div>

      {event.status && (
        <div className="pl-0 space-y-1">
          <p className="text-xs text-gray-500">{event.timestamp}</p>
          {editable ? (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-500 shrink-0">By:</span>
              <select
                value={event.markedBy}
                onChange={e => onChange({ ...event, markedBy: e.target.value })}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
              >
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>
              {isOther && (
                <input
                  value={otherText}
                  onChange={e => { setOtherText(e.target.value); onChange({ ...event, markedByRole: e.target.value }); }}
                  placeholder="Specify..."
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-24 focus:ring-1 focus:ring-primary-400 focus:outline-none"
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              By: <span className="font-medium text-gray-700">{event.markedBy || '—'}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface OrderCardProps {
  order: PipelineOrder;
  onDragStart: (id: string) => void;
  onUpdate: (updated: PipelineOrder) => void;
}

const OrderCard = ({ order, onDragStart, onUpdate }: OrderCardProps) => {
  const isTracked = order.column === 'active' || order.column === 'onsite';
  const [expanded, setExpanded] = useState(isTracked);
  const [lastSeen, setLastSeen] = useState(order.tracking.lastUpdated);

  // Simulate "last updated" ticking for active/onsite cards
  useEffect(() => {
    if (!isTracked) return;
    const timer = setInterval(() => {
      setLastSeen(now());
      onUpdate({ ...order, tracking: { ...order.tracking, lastUpdated: now() } });
    }, 30000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracked, order.id]);

  const updateLeftYard = (ev: TrackingEvent) => {
    onUpdate({ ...order, tracking: { ...order.tracking, leftYard: ev } });
  };
  const updateReachedOnsite = (ev: TrackingEvent) => {
    onUpdate({ ...order, tracking: { ...order.tracking, reachedOnsite: ev } });
  };

  const colMeta = COLUMNS.find(c => c.id === order.column)!;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(order.id)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Card top accent bar */}
      <div className={`h-1 rounded-t-xl ${colMeta.dot.replace('bg-', 'bg-')}`} />

      <div className="p-3.5 space-y-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
            {order.orderNumber}
          </span>
          {isTracked && (
            <span className={`inline-flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full ${order.tracking.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {order.tracking.isActive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
              )}
              <span>{order.tracking.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </span>
          )}
        </div>

        {/* Company */}
        <p className="text-sm font-semibold text-gray-800 leading-tight">{order.customer}</p>

        {/* Fields */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
            <span className="font-medium text-gray-600">{order.rig}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{order.location}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{order.startDate} → {order.endDate}</span>
          </div>
        </div>

        {/* Machine Tracking Section */}
        {(isTracked || order.tracking.leftYard.status || order.tracking.reachedOnsite.status) && (
          <div className="border-t border-gray-100 pt-2.5">
            {/* Section header */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-primary-700 transition-colors mb-2"
            >
              <div className="flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Machine Tracking</span>
                {isTracked && (
                  <span className="flex items-center space-x-1 text-green-600 font-normal">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <span>Live</span>
                  </span>
                )}
              </div>
              <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded && (
              <div className="space-y-3 bg-gray-50 rounded-lg p-2.5">
                {/* Left Yard */}
                <TrackingRow
                  label="Left Yard"
                  event={order.tracking.leftYard}
                  roles={LEFT_YARD_ROLES}
                  editable={isTracked}
                  onChange={updateLeftYard}
                />

                {/* Reached Onsite */}
                <TrackingRow
                  label="Reached Onsite"
                  event={order.tracking.reachedOnsite}
                  roles={ONSITE_ROLES}
                  editable={isTracked}
                  onChange={updateReachedOnsite}
                />

                {/* Current Location */}
                {order.tracking.currentLocation && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Current Location</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{order.tracking.currentLocation.address}</p>
                    <a
                      href={`https://www.google.com/maps?q=${order.tracking.currentLocation.lat},${order.tracking.currentLocation.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View on Map</span>
                    </a>
                  </div>
                )}

                {/* Last updated */}
                <p className="text-xs text-gray-400 pt-0.5">
                  Updated: {lastSeen}
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
  onClose: () => void;
  onSave: (order: PipelineOrder) => void;
}

const customers: Customer[] = [{ id: '1', name: 'Kuwait Oil Company' }, { id: '2', name: 'Burgan Energy' }, { id: '3', name: 'Gulf Drilling' }, { id: '4', name: 'KNPC Services' }];
const locations: Location[] = [{ id: '1', name: 'North Kuwait' }, { id: '2', name: 'West Kuwait' }, { id: '3', name: 'South East Kuwait' }, { id: '4', name: 'Gas Field' }];
const rigs: Rig[] = Array.from({ length: 100 }, (_, i) => ({ id: `rig-${i + 1}`, name: `Rig ${i + 1}` }));
const tools: Tool[] = [
  { id: 'trs-crt',         name: 'CRT',            group: 'TRS' },
  { id: 'trs-power-tong',  name: 'POWER TONG',     group: 'TRS' },
  { id: 'trs-jam-unit',    name: 'JAM UNIT',        group: 'TRS' },
  { id: 'trs-filup-tool',  name: 'FILUP TOOL',      group: 'TRS' },
  { id: 'trs-handling',    name: 'HANDLING TOOLS',  group: 'TRS' },
  { id: 'dht-reamers',     name: 'REAMERS',         group: 'DHT' },
  { id: 'dht-anti-stick',  name: 'ANTI STICK SLIP', group: 'DHT' },
  { id: 'dht-scrapper',    name: 'SCRAPPER',        group: 'DHT' },
  { id: 'dht-jars',        name: 'JARS',            group: 'DHT' },
  { id: 'dht-ctrl-valve',  name: 'CONTROL VALVE',   group: 'DHT' },
  { id: 'dht-torque',      name: 'TORQUE REDUCER',  group: 'DHT' },
];

const NewOrderModal = ({ onClose, onSave }: NewOrderModalProps) => {
  const [custId, setCustId]   = useState('');
  const [locId,  setLocId]    = useState('');
  const [rigId,  setRigId]    = useState('');
  const [selTools, setSelTools] = useState<string[]>([]);
  const [toolQ, setToolQ]     = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const trsTools = tools.filter(t => t.group === 'TRS' && t.name.toLowerCase().includes(toolQ.toLowerCase()));
  const dhtTools = tools.filter(t => t.group === 'DHT' && t.name.toLowerCase().includes(toolQ.toLowerCase()));

  const toggleTool = (id: string) =>
    setSelTools(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    if (!custId || !locId || !rigId || selTools.length === 0) {
      alert('Please fill in Customer, Location, Rig, and at least one Tool.');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    const loc  = locations.find(l => l.id === locId);
    const rig  = rigs.find(r => r.id === rigId);
    const pad  = String(100000 + Math.floor(Math.random() * 900000));
    onSave({
      id: `ord-${Date.now()}`,
      orderNumber: `#ORD-${pad}`,
      customer: cust?.name || '',
      location: loc?.name  || '',
      rig:      rig?.name  || '',
      startDate: startDate ? new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      endDate:   endDate   ? new Date(endDate).toLocaleDateString('en-GB',   { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      column: 'drafts',
      tracking: emptyTracking(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">New Machine Rental Order</h2>
            <p className="text-xs text-blue-200 mt-0.5">All fields marked * are required</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Customer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Customer *</label>
            <select value={custId} onChange={e => setCustId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
            <select value={locId} onChange={e => setLocId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Rig */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rig *</label>
            <select value={rigId} onChange={e => setRigId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none">
              <option value="">— Select rig —</option>
              {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            </div>
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tools * <span className="text-gray-400 font-normal">(select at least one)</span></label>
            <input value={toolQ} onChange={e => setToolQ(e.target.value)} placeholder="Search tools..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary-400 focus:outline-none" />
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {[{ label: 'TRS', items: trsTools }, { label: 'DHT', items: dhtTools }].map(grp => grp.items.length > 0 && (
                <div key={grp.label}>
                  <div className="px-3 py-1.5 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">{grp.label}</div>
                  {grp.items.map(t => (
                    <label key={t.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer space-x-2">
                      <input type="checkbox" checked={selTools.includes(t.id)} onChange={() => toggleTool(t.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-400" />
                      <span className="text-sm text-gray-700">{t.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            {selTools.length > 0 && (
              <p className="text-xs text-primary-600 mt-1 font-medium">{selTools.length} tool(s) selected</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-semibold hover:from-primary-500 hover:to-primary-600 transition-all shadow-sm">
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const OrdersPipeline = () => {
  const [orders, setOrders] = useState<PipelineOrder[]>(SEED_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<ColumnId | null>(null);

  const filtered = orders.filter(o =>
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.rig.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colOrders = (col: ColumnId) => filtered.filter(o => o.column === col);

  const handleDragStart = (id: string) => { dragId.current = id; };

  const handleDrop = (col: ColumnId) => {
    if (!dragId.current) return;
    setOrders(prev => prev.map(o =>
      o.id === dragId.current ? { ...o, column: col } : o
    ));
    dragId.current = null;
    setDragOver(null);
  };

  const handleUpdate = (updated: PipelineOrder) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const handleNewOrder = (order: PipelineOrder) => {
    setOrders(prev => [...prev, order]);
    setShowModal(false);
  };

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent mb-1">
              Orders Pipeline
            </h1>
            <p className="text-sm text-gray-500">Real-time machine rental tracking across all stages</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-primary-400 focus:outline-none w-56 shadow-sm"
              />
            </div>
            {/* New Order button */}
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-500 hover:to-primary-600 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Order</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Summary badges */}
      <div className="flex items-center space-x-3 mb-5 flex-wrap gap-y-2">
        {COLUMNS.map(col => (
          <div key={col.id} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${col.headerBg} border border-${col.dot.replace('bg-', '')}/20`}>
            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
            <span className="text-gray-700">{col.label}</span>
            <span className="text-gray-500 font-normal">({colOrders(col.id).length})</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-400 font-medium">
          {orders.length} total order{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.id)}
            className={`flex flex-col min-w-[260px] w-[260px] shrink-0 rounded-2xl border-t-4 ${col.color} transition-all duration-150 ${
              dragOver === col.id
                ? 'bg-blue-50/80 ring-2 ring-primary-300 shadow-lg'
                : 'bg-white/60 shadow-sm'
            }`}
          >
            {/* Column header */}
            <div className={`${col.headerBg} px-4 py-3 rounded-t-xl border-b border-gray-100`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-gray-700">{col.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
                  {colOrders(col.id).length}
                </span>
              </div>
              {col.id === 'active' && (
                <p className="text-xs text-gray-400 mt-1 leading-tight">Machine dispatched, not yet onsite</p>
              )}
              {col.id === 'onsite' && (
                <p className="text-xs text-gray-400 mt-1 leading-tight">Machine reached client rig location</p>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {colOrders(col.id).length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${dragOver === col.id ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200'}`}>
                  <p className="text-xs text-gray-400">Drop here</p>
                </div>
              ) : (
                colOrders(col.id).map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onDragStart={handleDragStart}
                    onUpdate={handleUpdate}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewOrderModal
          onClose={() => setShowModal(false)}
          onSave={handleNewOrder}
        />
      )}
    </MainLayout>
  );
};

export default OrdersPipeline;
