
import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import Can from '../components/Can';
import { apiClient } from '../api/apiClient';

// ─── Shared category data ─────────────────────────────────────────────────────

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  'CRT': 'CRT',
  'Torque Sub': 'TORQUE SUB',
  'Power Tong': 'POWER TONG',
  'Jam Unit': 'JAM UNIT',
  'HPU': 'HPU',
  'Filup Tool': 'FILUP TOOL',
  'Safety Clamp': 'SAFETY CLAMP',
  'Elevators': 'ELEVATORS',
  'Slips': 'SLIPS',
  'Spider Elevators': 'SPIDER ELEVATORS',
  'Bucking': 'BUCKING',
  'Reamers': 'REAMERS',
  'Anti Stick Slip': 'ANTI STICK SLIP',
  'Scrapper': 'SCRAPPER',
  'Jars': 'JARS',
  'Circulating DHT': 'CIRCULATING'
};

const TRS_CATEGORIES = ['CRT', 'Torque Sub', 'Power Tong', 'Jam Unit', 'HPU', 'Filup Tool', 'Safety Clamp', 'Elevators', 'Slips', 'Spider Elevators'];
const DHT_CATEGORIES = ['Bucking', 'Reamers', 'Anti Stick Slip', 'Scrapper', 'Jars', 'Circulating DHT'];

// ─── Consumables sub-section ──────────────────────────────────────────────────

// Backed by the `inventory` table. The `import-tools.ts` script also writes
// TRS/DHT *tool* aggregates into that table — those are filtered out here so
// the consumables view only shows real consumable items.
interface Consumable {
  id: string;
  itemName: string;
  category: string;
  subCategory: string | null;
  quantity: number;
  unit: string | null;
  minStock: number;
  location: string | null;
  description: string | null;
}

type ConsumableForm = Omit<Consumable, 'id'> & { id?: string };

const blankConsumable = (): ConsumableForm => ({
  itemName: '',
  category: '',
  subCategory: null,
  quantity: 0,
  unit: 'pcs',
  minStock: 5,
  location: 'Warehouse',
  description: null,
});

// ─── OperationalInventory ─────────────────────────────────────────────────────
// Asset-level tool management. One row per tool in the `tools` table, with
// full CRUD wired to /tools.

interface ToolRow {
  id: string;
  name: string;
  type: 'TRS' | 'DHT';
  category: string | null;
  serialNumber: string;
  size: string | null;
  status: 'available' | 'in_transit' | 'onsite' | 'maintenance';
  description: string | null;
  manufacturerSn: string | null;
  partNo: string | null;
  manufacturer: string | null;
  country: string | null;
  hsCode: string | null;
  cooNumber: string | null;
  netWeight: number | null;
  receivedDate: string | null;
  invoiceNumber: string | null;
  poNumber: string | null;
  uom: string | null;
  catalogue: boolean;
  rig?: { name?: string } | null;
}

type ToolFormState = Omit<ToolRow, 'id' | 'rig'> & { id?: string };

const blankForm = (category = 'CRT'): ToolFormState => ({
  name: '',
  type: 'TRS',
  category,
  serialNumber: '',
  size: '',
  status: 'available',
  description: '',
  manufacturerSn: '',
  partNo: '',
  manufacturer: '',
  country: '',
  hsCode: '',
  cooNumber: '',
  netWeight: null,
  receivedDate: '',
  invoiceNumber: '',
  poNumber: '',
  uom: '',
  catalogue: false,
});

const STATUS_BADGE: Record<ToolRow['status'], { label: string; bg: string; dot: string }> = {
  available:   { label: 'Yard',       bg: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',         dot: 'bg-sky-500' },
  in_transit:  { label: 'In-Transit', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',     dot: 'bg-blue-500' },
  onsite:      { label: 'Onsite',     bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  maintenance: { label: 'Service',    bg: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',     dot: 'bg-rose-500' },
};

const OperationalInventory = () => {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('CRT');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ToolRow['status']>('all');
  const [sortKey, setSortKey] = useState<keyof ToolRow>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToolFormState>(blankForm());
  const [confirmDelete, setConfirmDelete] = useState<ToolRow | null>(null);
  const [detailsTool, setDetailsTool] = useState<ToolRow | null>(null);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const data = await apiClient.tools.getAll();
      setTools(Array.isArray(data) ? (data as ToolRow[]) : []);
      setError(null);
    } catch {
      setError('Failed to load tools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTools(); }, []);

  // Per-category breakdown (total + status split) for the sidebar mini-bars.
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; yard: number; in_transit: number; onsite: number; service: number }> = {};
    tools.forEach(t => {
      if (!t.category) return;
      if (!map[t.category]) map[t.category] = { total: 0, yard: 0, in_transit: 0, onsite: 0, service: 0 };
      map[t.category].total += 1;
      if (t.status === 'available') map[t.category].yard += 1;
      else if (t.status === 'in_transit') map[t.category].in_transit += 1;
      else if (t.status === 'onsite') map[t.category].onsite += 1;
      else if (t.status === 'maintenance') map[t.category].service += 1;
    });
    return map;
  }, [tools]);

  // Tools in the selected category
  const inCategory = useMemo(() =>
    tools.filter(t => (t.category || '').toLowerCase() === selectedCategory.toLowerCase()),
    [tools, selectedCategory]
  );

  // Apply search + status filter + sort
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = inCategory.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        t.serialNumber.toLowerCase().includes(term) ||
        (t.size || '').toLowerCase().includes(term) ||
        (t.manufacturer || '').toLowerCase().includes(term) ||
        (t.partNo || '').toLowerCase().includes(term) ||
        (t.manufacturerSn || '').toLowerCase().includes(term)
      );
    });
    list = [...list].sort((a, b) => {
      const av = (a[sortKey] ?? '') as any;
      const bv = (b[sortKey] ?? '') as any;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), undefined, { numeric: true })
        : String(bv).localeCompare(String(av), undefined, { numeric: true });
    });
    return list;
  }, [inCategory, searchTerm, statusFilter, sortKey, sortDir]);

  const onSort = (key: keyof ToolRow) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Status counts within selected category
  const statusCounts = useMemo(() => ({
    all: inCategory.length,
    available: inCategory.filter(t => t.status === 'available').length,
    in_transit: inCategory.filter(t => t.status === 'in_transit').length,
    onsite: inCategory.filter(t => t.status === 'onsite').length,
    maintenance: inCategory.filter(t => t.status === 'maintenance').length,
  }), [inCategory]);

  // ─── Form handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    const trsLike = TRS_CATEGORIES.includes(selectedCategory);
    setEditingId(null);
    setForm({ ...blankForm(selectedCategory), type: trsLike ? 'TRS' : 'DHT' });
    setShowFormModal(true);
  };

  const openEdit = (t: ToolRow) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      type: t.type,
      category: t.category,
      serialNumber: t.serialNumber,
      size: t.size,
      status: t.status,
      description: t.description,
      manufacturerSn: t.manufacturerSn,
      partNo: t.partNo,
      manufacturer: t.manufacturer,
      country: t.country,
      hsCode: t.hsCode,
      cooNumber: t.cooNumber,
      netWeight: t.netWeight,
      receivedDate: t.receivedDate ? t.receivedDate.slice(0, 10) : '',
      invoiceNumber: t.invoiceNumber,
      poNumber: t.poNumber,
      uom: t.uom,
      catalogue: t.catalogue,
    });
    setShowFormModal(true);
  };

  const updateForm = <K extends keyof ToolFormState>(k: K, v: ToolFormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Name is required');
    if (!form.serialNumber.trim()) return alert('Serial number is required');
    // Coerce empty strings to null so backend clears the column. Using undefined
    // would cause axios/JSON to drop the field entirely, leaving the old value.
    const orNull = (v: string | null | undefined) => {
      const s = (v ?? '').trim();
      return s === '' ? null : s;
    };
    const payload: any = {
      ...form,
      name: form.name.trim(),
      serialNumber: form.serialNumber.trim(),
      size: orNull(form.size),
      description: orNull(form.description),
      manufacturerSn: orNull(form.manufacturerSn),
      partNo: orNull(form.partNo),
      manufacturer: orNull(form.manufacturer),
      country: orNull(form.country),
      hsCode: orNull(form.hsCode),
      cooNumber: orNull(form.cooNumber),
      netWeight: form.netWeight ?? null,
      receivedDate: form.receivedDate || null,
      invoiceNumber: orNull(form.invoiceNumber),
      poNumber: orNull(form.poNumber),
      uom: orNull(form.uom),
    };
    try {
      setSaving(true);
      if (editingId) {
        const updated = await apiClient.tools.update(editingId, payload);
        setTools(prev => prev.map(t => (t.id === editingId ? { ...t, ...updated } : t)));
      } else {
        const created = await apiClient.tools.create(payload);
        setTools(prev => [...prev, created]);
      }
      setShowFormModal(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setSaving(true);
      await apiClient.tools.delete(confirmDelete.id);
      setTools(prev => prev.filter(t => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-semibold">Loading Tools...</p>
      </div>
    </div>
  );
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ── SIDEBAR ── */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-3 lg:sticky lg:top-0 lg:max-h-[calc(100vh-180px)] overflow-y-auto">
            {/* TRS */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5 px-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em]">TRS</span>
                <span className="ml-auto text-[9px] font-black text-slate-400 tabular-nums">
                  {TRS_CATEGORIES.reduce((sum, c) => sum + (categoryBreakdown[c]?.total || 0), 0)}
                </span>
              </div>
              <div className="space-y-0.5">
                {TRS_CATEGORIES.map(cat => (
                  <CategoryButton
                    key={cat}
                    label={CATEGORY_DISPLAY_MAP[cat] || cat}
                    breakdown={categoryBreakdown[cat]}
                    active={selectedCategory === cat}
                    group="TRS"
                    onClick={() => { setSelectedCategory(cat); setSearchTerm(''); setStatusFilter('all'); }}
                  />
                ))}
              </div>
            </div>
            {/* DHT */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">DHT</span>
                <span className="ml-auto text-[9px] font-black text-slate-400 tabular-nums">
                  {DHT_CATEGORIES.reduce((sum, c) => sum + (categoryBreakdown[c]?.total || 0), 0)}
                </span>
              </div>
              <div className="space-y-0.5">
                {DHT_CATEGORIES.map(cat => (
                  <CategoryButton
                    key={cat}
                    label={CATEGORY_DISPLAY_MAP[cat] || cat}
                    breakdown={categoryBreakdown[cat]}
                    active={selectedCategory === cat}
                    group="DHT"
                    onClick={() => { setSelectedCategory(cat); setSearchTerm(''); setStatusFilter('all'); }}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <section className="flex-1 min-w-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6 min-h-[calc(100vh-180px)]">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 border-b border-slate-100/60 dark:border-white/5">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg shadow-md ${
                  TRS_CATEGORIES.includes(selectedCategory)
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                    : 'bg-gradient-to-br from-indigo-600 to-violet-600'
                }`}>
                  {TRS_CATEGORIES.includes(selectedCategory) ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{CATEGORY_DISPLAY_MAP[selectedCategory] || selectedCategory}</h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {TRS_CATEGORIES.includes(selectedCategory) ? 'TRS Group' : 'DHT Group'} · Showing {filtered.length} of {inCategory.length}
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 items-center w-full xl:w-auto">
                <div className="relative flex-1 xl:flex-initial">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search name, serial, mfr, part no..."
                    className="pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white/60 dark:bg-meta-4 dark:text-white w-full xl:w-72" />
                </div>
                <Can module="inventory" action="add">
                  <button onClick={openCreate}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-blue-400 shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-base leading-none">+</span> Add Tool
                  </button>
                </Can>
              </div>
            </div>

            {/* Status filter chips */}
            <div className="mt-4 mb-4 flex flex-wrap gap-2">
              <FilterChip label="All"     count={statusCounts.all}          active={statusFilter === 'all'}         onClick={() => setStatusFilter('all')}         accent="slate" />
              <FilterChip label="Yard"       count={statusCounts.available}    active={statusFilter === 'available'}    onClick={() => setStatusFilter('available')}    accent="sky" />
              <FilterChip label="In-Transit" count={statusCounts.in_transit}  active={statusFilter === 'in_transit'}  onClick={() => setStatusFilter('in_transit')}  accent="blue" />
              <FilterChip label="Onsite"     count={statusCounts.onsite}       active={statusFilter === 'onsite'}      onClick={() => setStatusFilter('onsite')}      accent="emerald" />
              <FilterChip label="Service"    count={statusCounts.maintenance}  active={statusFilter === 'maintenance'} onClick={() => setStatusFilter('maintenance')} accent="rose" />
            </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-meta-4/40 border-b border-slate-100 dark:border-white/5">
                  {([
                    ['name',           'Name',          'w-[34%]'],
                    ['serialNumber',   'Serial',        'w-[15%]'],
                    ['size',           'Size',          'w-[6%]'],
                    ['manufacturer',   'Manufacturer',  'w-[8%]'],
                    ['partNo',         'Part No',       'w-[7%]'],
                    ['country',        'Country',       'w-[5%]'],
                    ['status',         'Status',        'w-[7%]'],
                    ['receivedDate',   'Received',      'w-[8%]'],
                  ] as const).map(([key, label, width]) => (
                    <th key={key} onClick={() => onSort(key as keyof ToolRow)}
                      className={`${width} text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-white overflow-hidden`}>
                      <span className="inline-flex items-center gap-1 truncate max-w-full">
                        <span className="truncate">{label}</span>
                        {sortKey === key && (<span className="text-[8px] flex-shrink-0">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
                      </span>
                    </th>
                  ))}
                  <th className="w-[10%] px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="mb-3 opacity-40"><svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                      <p className="font-bold text-slate-400 text-base">No tools in this view</p>
                      <button onClick={openCreate} className="mt-3 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">+ Add the first tool</button>
                    </td>
                  </tr>
                ) : filtered.map(t => {
                  const status = STATUS_BADGE[t.status];
                  return (
                    <tr key={t.id} onClick={() => setDetailsTool(t)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-meta-4/30">
                      <td className="px-3 py-3 max-w-0">
                        <div className="font-bold text-slate-800 dark:text-white text-[15px] truncate" title={t.name}>{t.name}</div>
                        {t.description && t.description !== t.name && (
                          <div className="text-[10px] text-slate-400 truncate" title={t.description}>{t.description}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.serialNumber}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-semibold text-[12px] whitespace-nowrap">{t.size || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[12px] truncate max-w-0" title={t.manufacturer || ''}>{t.manufacturer || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate max-w-0" title={t.partNo || ''}>{t.partNo || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-[12px] whitespace-nowrap">{t.country || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${status.bg}`}>
                          <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
                        {t.receivedDate ? new Date(t.receivedDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <Can module="inventory" action="edit">
                          <button onClick={() => openEdit(t)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md mr-1 transition-colors">
                            Edit
                          </button>
                        </Can>
                        <Can module="inventory" action="delete">
                          <button onClick={() => setConfirmDelete(t)}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                            Delete
                          </button>
                        </Can>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowFormModal(false)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-boxdark px-8 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 z-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{editingId ? 'Edit Tool' : 'Add Tool'}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                {editingId ? `Editing ${form.serialNumber}` : 'Create a new tool asset'}
              </p>
            </div>
            <div className="px-8 py-6 space-y-6">
              {/* CORE */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Core</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Name *" value={form.name} onChange={v => updateForm('name', v)} placeholder="e.g. CRTi2 Active Set 750T" />
                  <FormField label="Serial Number *" value={form.serialNumber} onChange={v => updateForm('serialNumber', v)} placeholder="e.g. OTEC-CRT-0750-005" mono />
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Type *</label>
                    <select value={form.type} onChange={e => updateForm('type', e.target.value as 'TRS' | 'DHT')}
                      className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white">
                      <option value="TRS">TRS</option>
                      <option value="DHT">DHT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Category</label>
                    <select value={form.category || ''} onChange={e => updateForm('category', e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white">
                      <option value="">— None —</option>
                      <optgroup label="TRS">
                        {TRS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="DHT">
                        {DHT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <FormField label="Size" value={form.size || ''} onChange={v => updateForm('size', v)} placeholder='e.g. 7 5/8" or 750T' />
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Status</label>
                    <select value={form.status} onChange={e => updateForm('status', e.target.value as ToolRow['status'])}
                      className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white">
                      <option value="available">Yard (Available)</option>
                      <option value="in_transit">In-Transit (Order Booked)</option>
                      <option value="onsite">Onsite (Active Order)</option>
                      <option value="maintenance">Service / Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PROCUREMENT */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Procurement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Manufacturer" value={form.manufacturer || ''} onChange={v => updateForm('manufacturer', v)} placeholder="e.g. McCoy" />
                  <FormField label="Manufacturer SN" value={form.manufacturerSn || ''} onChange={v => updateForm('manufacturerSn', v)} mono />
                  <FormField label="Part Number" value={form.partNo || ''} onChange={v => updateForm('partNo', v)} mono />
                  <FormField label="Country" value={form.country || ''} onChange={v => updateForm('country', v)} placeholder="e.g. USA" />
                  <FormField label="HS Code" value={form.hsCode || ''} onChange={v => updateForm('hsCode', v)} mono />
                  <FormField label="COO Number" value={form.cooNumber || ''} onChange={v => updateForm('cooNumber', v)} mono />
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Net Weight (kg)</label>
                    <input type="number" step="0.001" value={form.netWeight ?? ''} onChange={e => updateForm('netWeight', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Received Date</label>
                    <input type="date" value={form.receivedDate || ''} onChange={e => updateForm('receivedDate', e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                  </div>
                  <FormField label="Invoice Number" value={form.invoiceNumber || ''} onChange={v => updateForm('invoiceNumber', v)} mono />
                  <FormField label="PO Number" value={form.poNumber || ''} onChange={v => updateForm('poNumber', v)} mono />
                  <FormField label="UOM" value={form.uom || ''} onChange={v => updateForm('uom', v)} placeholder="e.g. EACH" />
                  <label className="flex items-center gap-2 mt-7 cursor-pointer">
                    <input type="checkbox" checked={form.catalogue} onChange={e => updateForm('catalogue', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">In Catalogue</span>
                  </label>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description / Notes</h4>
                <textarea value={form.description || ''} onChange={e => updateForm('description', e.target.value)} rows={3}
                  placeholder="Free-text notes about this tool..."
                  className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-medium text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white resize-y" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-boxdark px-8 py-4 border-t border-slate-100 dark:border-white/5 flex gap-3 z-10">
              <button onClick={() => setShowFormModal(false)} disabled={saving}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg disabled:opacity-50">
                {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Tool')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setConfirmDelete(null)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Delete Tool?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-white">{confirmDelete.name}</span><br />
                <span className="font-mono text-xs">{confirmDelete.serialNumber}</span>
              </p>
              <p className="text-xs text-rose-500 font-bold mt-3">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={saving}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl shadow-lg disabled:opacity-50">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {detailsTool && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailsTool(null)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl w-full max-w-2xl shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-7 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">{detailsTool.name}</h3>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detailsTool.serialNumber}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[detailsTool.status].bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGE[detailsTool.status].dot}`} />
                  {STATUS_BADGE[detailsTool.status].label}
                </span>
              </div>
            </div>
            <div className="px-7 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailRow label="Type" value={detailsTool.type} />
              <DetailRow label="Category" value={detailsTool.category} />
              <DetailRow label="Size" value={detailsTool.size} />
              <DetailRow label="Manufacturer" value={detailsTool.manufacturer} />
              <DetailRow label="Manufacturer SN" value={detailsTool.manufacturerSn} mono />
              <DetailRow label="Part No" value={detailsTool.partNo} mono />
              <DetailRow label="Country" value={detailsTool.country} />
              <DetailRow label="HS Code" value={detailsTool.hsCode} mono />
              <DetailRow label="COO Number" value={detailsTool.cooNumber} mono />
              <DetailRow label="Net Weight" value={detailsTool.netWeight ? `${detailsTool.netWeight} kg` : null} />
              <DetailRow label="Received" value={detailsTool.receivedDate ? new Date(detailsTool.receivedDate).toLocaleDateString() : null} />
              <DetailRow label="Invoice" value={detailsTool.invoiceNumber} mono />
              <DetailRow label="PO" value={detailsTool.poNumber} mono />
              <DetailRow label="UOM" value={detailsTool.uom} />
              <DetailRow label="Catalogue" value={detailsTool.catalogue ? 'Yes' : 'No'} />
              <DetailRow label="Rig" value={detailsTool.rig?.name} />
              {detailsTool.description && (
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Description</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{detailsTool.description}</p>
                </div>
              )}
            </div>
            <div className="px-7 py-4 border-t border-slate-100 dark:border-white/5 flex gap-3 justify-end">
              <button onClick={() => setDetailsTool(null)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl text-sm">Close</button>
              <button onClick={() => { openEdit(detailsTool); setDetailsTool(null); }}
                className="px-5 py-2.5 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-md text-sm">
                Edit Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Operational Inventory presentation helpers ─────────────────────────────

type Accent = 'slate' | 'sky' | 'blue' | 'emerald' | 'rose';

const ACCENT_STYLES: Record<Accent, { ring: string; text: string; soft: string; dot: string; bar: string }> = {
  slate:   { ring: 'ring-slate-200 dark:ring-white/10',     text: 'text-slate-800 dark:text-white',     soft: 'bg-slate-100 text-slate-600 dark:bg-meta-4 dark:text-slate-300',         dot: 'bg-slate-400',   bar: 'bg-slate-400' },
  sky:     { ring: 'ring-sky-200 dark:ring-sky-500/20',     text: 'text-sky-700 dark:text-sky-300',     soft: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',             dot: 'bg-sky-500',     bar: 'bg-sky-400' },
  blue:    { ring: 'ring-blue-200 dark:ring-blue-500/20',   text: 'text-blue-700 dark:text-blue-300',   soft: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',         dot: 'bg-blue-500',    bar: 'bg-blue-500' },
  emerald: { ring: 'ring-emerald-200 dark:ring-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  rose:    { ring: 'ring-rose-200 dark:ring-rose-500/20',   text: 'text-rose-700 dark:text-rose-300',   soft: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',         dot: 'bg-rose-500',    bar: 'bg-rose-500' },
};

const CategoryButton = ({ label, breakdown, active, group, onClick }: {
  label: string;
  breakdown?: { total: number; yard: number; onsite: number; service: number };
  active: boolean;
  group: 'TRS' | 'DHT';
  onClick: () => void;
}) => {
  const total = breakdown?.total || 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
        active
          ? group === 'TRS'
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent shadow-sm'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm'
          : 'bg-white/60 border-transparent text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:text-slate-300 dark:hover:bg-meta-4'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-bold leading-tight">{label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black tabular-nums ${
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
        }`}>
          {total}
        </span>
      </div>
    </button>
  );
};

const FilterChip = ({ label, count, active, onClick, accent }: {
  label: string; count: number; active: boolean; onClick: () => void; accent: Accent;
}) => {
  const s = ACCENT_STYLES[accent];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-2 border ${
        active
          ? `${s.soft} border-transparent shadow-sm ring-1 ${s.ring}`
          : 'bg-slate-50 text-slate-500 border-transparent dark:bg-meta-4 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-meta-4/80'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
      <span className="tabular-nums opacity-80">{count}</span>
    </button>
  );
};

// ─── Small reusable form pieces ─────────────────────────────────────────────

const FormField = ({ label, value, onChange, placeholder, mono = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) => (
  <div>
    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
    <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      className={`w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white ${mono ? 'font-mono' : ''}`} />
  </div>
);

const DetailRow = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => (
  <div>
    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
    <div className={`text-sm font-semibold text-slate-700 dark:text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>
      {value || <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}
    </div>
  </div>
);

// ─── ConsumablesInventory ─────────────────────────────────────────────────────

const ConsumablesInventory = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConsumableForm>(blankConsumable());
  const [confirmDelete, setConfirmDelete] = useState<Consumable | null>(null);
  const [catFilter, setCatFilter] = useState('All');

  const fetchConsumables = async () => {
    try {
      setLoading(true);
      const list = await apiClient.inventory.getAll();
      // Exclude TRS/DHT tool aggregates written by the import script.
      const consumablesOnly = (list as any[]).filter(
        i => i.category !== 'TRS' && i.category !== 'DHT'
      );
      setConsumables(consumablesOnly);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsumables(); }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(consumables.map(c => c.category))).sort()],
    [consumables]
  );

  const filtered = useMemo(() => consumables.filter(c =>
    (catFilter === 'All' || c.category === catFilter) &&
    (!searchTerm
      || c.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      || c.category.toLowerCase().includes(searchTerm.toLowerCase())
      || c.location?.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [consumables, catFilter, searchTerm]);

  const lowCount = consumables.filter(c => c.quantity <= c.minStock).length;

  const updateForm = <K extends keyof ConsumableForm>(k: K, v: ConsumableForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm(blankConsumable());
    setShowFormModal(true);
  };

  const openEdit = (c: Consumable) => {
    setEditingId(c.id);
    setForm({
      itemName: c.itemName,
      category: c.category,
      subCategory: c.subCategory,
      quantity: c.quantity,
      unit: c.unit,
      minStock: c.minStock,
      location: c.location,
      description: c.description,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.itemName.trim()) return alert('Item name is required');
    if (!form.category.trim()) return alert('Category is required');
    // Coerce empty strings to null so backend clears the column. Using
    // undefined would cause axios/JSON to drop the field entirely, leaving
    // the old value in place — same bug we hit on the tools form.
    const orNull = (v: string | null | undefined) => {
      const s = (v ?? '').trim();
      return s === '' ? null : s;
    };
    const payload: any = {
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      subCategory: orNull(form.subCategory),
      quantity: form.quantity,
      unit: orNull(form.unit),
      minStock: form.minStock,
      location: orNull(form.location),
      description: orNull(form.description),
    };
    try {
      setSaving(true);
      if (editingId) {
        const updated = await apiClient.inventory.update(editingId, payload);
        setConsumables(prev => prev.map(c => (c.id === editingId ? { ...c, ...updated } : c)));
      } else {
        const created = await apiClient.inventory.create(payload);
        setConsumables(prev => [...prev, created]);
      }
      setShowFormModal(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setSaving(true);
      await apiClient.inventory.delete(confirmDelete.id);
      setConsumables(prev => prev.filter(c => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Consumables</h2>
            <p className="text-sm text-slate-400 mt-1">Non-tracked items — tape, gloves, lubricants, fasteners</p>
            {lowCount > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-black border border-rose-200 dark:border-rose-500/30">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {lowCount} item{lowCount !== 1 ? 's' : ''} at or below reorder level
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search consumables..."
                className="pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white/60 dark:bg-meta-4 dark:text-white w-48" />
            </div>
            <button onClick={openCreate}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Add Item
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catFilter === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-meta-4 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-meta-4/80'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
        {error && (
          <div className="px-5 py-3 bg-rose-50 text-rose-700 text-sm font-semibold border-b border-rose-200">
            {error}
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-meta-4/50 border-b border-slate-100 dark:border-white/5">
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Item Name</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Qty</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Unit</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Reorder At</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Location</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mb-3 opacity-40"><svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                  <p className="font-bold text-slate-400 text-base">No consumables yet</p>
                  <button onClick={openCreate} className="mt-3 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">+ Add the first item</button>
                </td>
              </tr>
            ) : filtered.map(item => {
              const isLow = item.quantity <= item.minStock;
              return (
                <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-meta-4/30 ${isLow ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''}`}>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-white">
                    {isLow && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-pulse" />}
                    {item.itemName}
                    {item.description && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">{item.category}</span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-black text-lg tabular-nums ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-400 text-xs font-bold uppercase">{item.unit || '—'}</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 text-sm font-medium tabular-nums">{item.minStock}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{item.location || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reorder
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(item)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md mr-1 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setConfirmDelete(item)}
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowFormModal(false)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-boxdark px-8 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 z-10">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{editingId ? 'Edit Consumable' : 'Add Consumable'}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                {editingId ? `Editing ${form.itemName}` : 'Create a new consumable item'}
              </p>
            </div>
            <div className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Item Name *" value={form.itemName} onChange={v => updateForm('itemName', v)} placeholder="e.g. Teflon Tape" />
                <FormField label="Category *" value={form.category} onChange={v => updateForm('category', v)} placeholder="e.g. PPE, Lubricants" />
                <FormField label="Sub-Category" value={form.subCategory ?? ''} onChange={v => updateForm('subCategory', v)} placeholder="optional" />
                <FormField label="Unit" value={form.unit ?? ''} onChange={v => updateForm('unit', v)} placeholder="e.g. pcs, kg, litre" />
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Quantity</label>
                  <input type="number" value={form.quantity}
                    onChange={e => updateForm('quantity', Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Reorder Level</label>
                  <input type="number" value={form.minStock}
                    onChange={e => updateForm('minStock', Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                </div>
                <FormField label="Location" value={form.location ?? ''} onChange={v => updateForm('location', v)} placeholder="e.g. Warehouse A, Shelf 3" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Description</label>
                <textarea value={form.description ?? ''} onChange={e => updateForm('description', e.target.value)} rows={3}
                  placeholder="Notes, supplier info, brand…"
                  className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-boxdark px-8 py-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
              <button onClick={() => setShowFormModal(false)} disabled={saving}
                className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="px-8 py-2.5 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setConfirmDelete(null)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Delete Consumable?</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{confirmDelete.itemName}</p>
              <p className="text-xs text-slate-400 mt-1">{confirmDelete.category}</p>
              <p className="text-xs text-rose-500 font-bold mt-3">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} disabled={saving}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl shadow-lg disabled:opacity-50">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Inventory (tab wrapper) ──────────────────────────────────────────────────

type Tab = 'operational' | 'consumables';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState<Tab>('operational');

  return (
    <MainLayout headerContent={
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
          Inventory
        </h1>
        <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
          Track tools and consumables across all categories
        </p>
      </div>
    }>
      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-boxdark/80 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm w-fit mb-6">
        <button
          onClick={() => setActiveTab('operational')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'operational'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Operational Inventory
        </button>
        <button
          onClick={() => setActiveTab('consumables')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'consumables'
              ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Consumables
        </button>
      </div>

      {activeTab === 'operational' ? <OperationalInventory /> : <ConsumablesInventory />}
    </MainLayout>
  );
};

export default Inventory;
