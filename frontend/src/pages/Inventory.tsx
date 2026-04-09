
import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';

// ─── Shared category data ─────────────────────────────────────────────────────

const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  'CRT': 'CRT',
  'Power Tong': 'POWER TONG',
  'Jam Unit': 'JAM UNIT',
  'Filup Tool': 'FILUP TOOL',
  'Safety Clamp': 'SAFETY CLAMP',
  'Elevators': 'ELEVATORS',
  'Slips': 'SLIPS',
  'Spider Elevators': 'SPIDER ELEVATORS',
  'Reamers': 'REAMERS',
  'Anti Stick Slip': 'ANTI STICK SLIP',
  'Scrapper': 'SCRAPPER',
  'Jars': 'JARS',
  'Circulating DHT': 'CIRCULATING'
};

const TRS_CATEGORIES = ['CRT', 'Power Tong', 'Jam Unit', 'Filup Tool', 'Safety Clamp', 'Elevators', 'Slips', 'Spider Elevators'];
const DHT_CATEGORIES = ['Reamers', 'Anti Stick Slip', 'Scrapper', 'Jars', 'Circulating DHT'];

type ToolGroupKey = 'TRS' | 'DHT';
type OperationalStatus = 'Available' | 'In Use' | 'Under Maintenance';

interface ToolSize {
  size: string;
  quantity: number;
  inventoryId?: string;
}

interface OperationalTool {
  id: string;
  name: string;
  group: ToolGroupKey;
  available: number;
  sizes: ToolSize[];
  type?: string;
  category: string;
  status?: OperationalStatus;
  serialNumber?: string;
  assignedRig?: string;
}

// ─── Consumables sub-section ──────────────────────────────────────────────────

interface Consumable {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
}

const MOCK_CONSUMABLES: Consumable[] = [
  { id: 'c1',  name: 'Thread Compound (White)',  category: 'Lubricants',    quantity: 12, unit: 'kg',      reorderLevel: 5  },
  { id: 'c2',  name: 'Pipe Dope',                category: 'Lubricants',    quantity: 3,  unit: 'litre',   reorderLevel: 5  },
  { id: 'c3',  name: 'Teflon Tape (1")',          category: 'Sealing',       quantity: 48, unit: 'rolls',   reorderLevel: 10 },
  { id: 'c4',  name: 'Safety Gloves (L)',         category: 'PPE',           quantity: 6,  unit: 'pairs',   reorderLevel: 10 },
  { id: 'c5',  name: 'Safety Gloves (XL)',        category: 'PPE',           quantity: 4,  unit: 'pairs',   reorderLevel: 10 },
  { id: 'c6',  name: 'Safety Goggles',            category: 'PPE',           quantity: 15, unit: 'pcs',     reorderLevel: 5  },
  { id: 'c7',  name: 'Hydraulic Oil (46)',        category: 'Lubricants',    quantity: 2,  unit: 'drum',    reorderLevel: 2  },
  { id: 'c8',  name: 'WD-40 Spray',              category: 'Lubricants',    quantity: 8,  unit: 'cans',    reorderLevel: 3  },
  { id: 'c9',  name: 'Cable Ties (300mm)',        category: 'Fasteners',     quantity: 200, unit: 'pcs',   reorderLevel: 50 },
  { id: 'c10', name: 'Zip Ties (small)',          category: 'Fasteners',     quantity: 45, unit: 'pcs',    reorderLevel: 50 },
  { id: 'c11', name: 'Cleaning Cloths',           category: 'Consumables',   quantity: 30, unit: 'pcs',    reorderLevel: 20 },
  { id: 'c12', name: 'Marker Pens',              category: 'Consumables',   quantity: 3,  unit: 'pcs',    reorderLevel: 5  },
];

// ─── OperationalInventory ─────────────────────────────────────────────────────

const OperationalInventory = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('CRT');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTool, setEditingTool] = useState<OperationalTool | null>(null);
  const [editSizeIndex, setEditSizeIndex] = useState<number>(-1);
  const [editQuantity, setEditQuantity] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    group: 'TRS' as ToolGroupKey,
    type: '',
    sizes: [{ size: '', quantity: 0 }] as ToolSize[],
    category: 'CRT'
  });
  const [tools, setTools] = useState<OperationalTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await apiClient.inventory.getAll();
        if (Array.isArray(data)) {
          const toolMap = new Map<string, OperationalTool>();
          data.forEach((item: any) => {
            const categoryName = item.category || 'TRS';
            const group = (categoryName === 'DHT' ? 'DHT' : 'TRS') as ToolGroupKey;
            let deducedCategory = 'Other';
            const nameUpper = item.itemName?.toUpperCase() || '';

            if (item.description && item.description.startsWith('Imported from ')) {
              const importedCat = item.description.replace('Imported from ', '');
              const exactMatch = [...TRS_CATEGORIES, ...DHT_CATEGORIES].find(c => c.toLowerCase() === importedCat.toLowerCase());
              deducedCategory = exactMatch || importedCat;
            } else {
              const KEYWORD_MAP: Record<string, string> = {
                'AST': 'Anti Stick Slip', 'ANTI STICK': 'Anti Stick Slip',
                'CRT': 'CRT', 'POWER TONG': 'Power Tong', 'TONG': 'Power Tong',
                'JAM': 'Jam Unit', 'FILUP': 'Filup Tool', 'SAFETY CLAMP': 'Safety Clamp',
                'CLAMP': 'Safety Clamp', 'ELEVATOR': 'Elevators', 'ELEV': 'Elevators',
                'SLIP': 'Slips', 'SPIDER': 'Spider Elevators', 'REAMER': 'Reamers',
                'SCRAP': 'Scrapper', 'JAR': 'Jars',
                'HANDLING': 'Circulating DHT', 'CIRCULATING': 'Circulating DHT'
              };
              for (const [key, category] of Object.entries(KEYWORD_MAP)) {
                if (nameUpper.includes(key)) { deducedCategory = category; break; }
              }
            }

            const exactMatch = [...TRS_CATEGORIES, ...DHT_CATEGORIES].find(c => nameUpper === c.toUpperCase());
            if (deducedCategory === 'Other' && exactMatch) deducedCategory = exactMatch;

            const uniqueToolName = item.itemName || 'Unknown Tool';
            const toolId = `${group.toLowerCase()}-${uniqueToolName.toLowerCase().replace(/\s+/g, '-')}`;

            if (toolMap.has(toolId)) {
              const tool = toolMap.get(toolId)!;
              tool.sizes.push({ size: item.unit || '-', quantity: item.quantity, inventoryId: item.id });
              tool.available += item.quantity;
            } else {
              toolMap.set(toolId, {
                id: toolId,
                name: uniqueToolName,
                group,
                available: item.quantity,
                sizes: [{ size: item.unit || '-', quantity: item.quantity, inventoryId: item.id }],
                type: item.description,
                category: deducedCategory,
              });
            }
          });
          setTools(Array.from(toolMap.values()));
        } else { setTools([]); setError('Invalid server response'); }
      } catch { setError('Failed to load inventory.'); }
      finally { setLoading(false); }
    };
    fetchInventory();
  }, []);

  const filteredTools = useMemo(() => tools.filter(t => {
    const tCat = t.category.toUpperCase();
    const sCat = selectedCategory.toUpperCase();
    const sDisplay = CATEGORY_DISPLAY_MAP[selectedCategory]?.toUpperCase();
    return tCat.includes(sCat) || (sDisplay && tCat.includes(sDisplay)) ||
      t.name.toUpperCase().includes(sCat) || (sDisplay && t.name.toUpperCase().includes(sDisplay));
  }), [tools, selectedCategory]);

  const allSizes = useMemo(() => {
    const sizes: { tool: OperationalTool, size: ToolSize, index: number }[] = [];
    filteredTools.forEach(t => {
      t.sizes.forEach((s, idx) => {
        if (!searchTerm || s.size.toLowerCase().includes(searchTerm.toLowerCase()) || t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          sizes.push({ tool: t, size: s, index: idx });
        }
      });
    });
    sizes.sort((a, b) => a.size.size.localeCompare(b.size.size, undefined, { numeric: true }));
    return sizes;
  }, [filteredTools, searchTerm]);

  const totalCategoryStock = filteredTools.reduce((acc, t) => acc + t.available, 0);
  const uniqueItems = filteredTools.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tools.forEach(t => { counts[t.category] = (counts[t.category] || 0) + t.available; });
    return counts;
  }, [tools]);

  const handleAddSize = () => setNewTool({ ...newTool, sizes: [...newTool.sizes, { size: '', quantity: 0 }] });
  const handleRemoveSize = (index: number) => setNewTool({ ...newTool, sizes: newTool.sizes.filter((_, i) => i !== index) });
  const handleUpdateSize = (index: number, field: 'size' | 'quantity', value: string | number) => {
    const updatedSizes = [...newTool.sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: field === 'quantity' ? Number(value) : value };
    setNewTool({ ...newTool, sizes: updatedSizes });
  };

  const handleCreateTool = async () => {
    if (!newTool.name) return alert('Name required');
    try {
      setSaving(true);
      await Promise.all(newTool.sizes.map(s => apiClient.inventory.create({
        itemName: newTool.name.toUpperCase(),
        category: newTool.group,
        quantity: s.quantity,
        unit: s.size,
        description: 'Created Manually'
      })));
      window.location.reload();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); setShowAddModal(false); }
  };

  const handleUpdateQuantity = async () => {
    if (!editingTool || editSizeIndex === -1) return;
    const sizeObj = editingTool.sizes[editSizeIndex];
    if (!sizeObj.inventoryId) return;
    try {
      setSaving(true);
      await apiClient.inventory.update(sizeObj.inventoryId, { quantity: editQuantity });
      const toolIdx = tools.findIndex(t => t.id === editingTool.id);
      if (toolIdx > -1) {
        const newTools = [...tools];
        const newSizes = [...newTools[toolIdx].sizes];
        newSizes[editSizeIndex] = { ...sizeObj, quantity: editQuantity };
        newTools[toolIdx] = { ...newTools[toolIdx], sizes: newSizes, available: newSizes.reduce((a, b) => a + b.quantity, 0) };
        setTools(newTools);
      }
      setEditingTool(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-semibold">Loading Inventory...</p>
      </div>
    </div>
  );
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* SIDEBAR */}
      <div className="w-full md:w-72 flex-shrink-0">
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-5 md:sticky md:top-0 h-[calc(100vh-220px)] overflow-y-auto">
          {/* TRS */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em]">TRS Tools</span>
            </div>
            <div className="space-y-1">
              {TRS_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-between ${selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent shadow-[0_0_12px_rgba(25,86,168,0.3)]'
                    : 'bg-white/60 border-white/20 text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-meta-4'}`}>
                  <span>{CATEGORY_DISPLAY_MAP[cat] || cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'}`}>{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>
          {/* DHT */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">DHT Tools</span>
            </div>
            <div className="space-y-1">
              {DHT_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-between ${selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-white/60 border-white/20 text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-meta-4'}`}>
                  <span>{CATEGORY_DISPLAY_MAP[cat] || cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'}`}>{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PANEL */}
      <div className="flex-1 min-w-0">
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6 min-h-[calc(100vh-220px)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100/50 dark:border-white/5 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">{CATEGORY_DISPLAY_MAP[selectedCategory] || selectedCategory}</h2>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/30">
                  {totalCategoryStock} Units
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/5">
                  {uniqueItems} Items
                </span>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search items..." className="pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white/60 dark:bg-meta-4 dark:text-white transition-all" />
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-700 hover:to-slate-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                <span className="text-lg leading-none">+</span> Add Stock
              </button>
            </div>
          </div>

          {/* Status legend */}
          <div className="flex items-center gap-3 mb-6 text-xs">
            <span className="font-black text-slate-400 uppercase tracking-wider">Status:</span>
            {[['Available', 'bg-emerald-500', 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'],
              ['In Use', 'bg-blue-500', 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'],
              ['Under Maintenance', 'bg-rose-500', 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20']
            ].map(([label, dot, badge]) => (
              <span key={label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold ${badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
          </div>

          {/* Stock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {allSizes.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <div className="text-6xl mb-4 opacity-40">📦</div>
                <p className="font-bold text-slate-400 text-lg">No inventory found</p>
                <p className="text-slate-400/60 text-sm mt-1 mb-4">This category has no stock items yet</p>
                <button onClick={() => setShowAddModal(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">+ Add Initial Stock</button>
              </div>
            ) : (
              allSizes.map(({ tool, size, index }) => {
                const isTRS = tool.group === 'TRS';
                const isLow = size.quantity <= 2;
                // Determine status heuristically (real app would use actual tool.status)
                const status: OperationalStatus = size.quantity === 0 ? 'In Use'
                  : size.quantity <= 2 ? 'Available'
                  : 'Available';
                return (
                  <div key={`${tool.id}-${index}`}
                    onClick={() => { setEditingTool(tool); setEditSizeIndex(index); setEditQuantity(size.quantity); }}
                    className={`cursor-pointer group relative rounded-2xl border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col bg-white/80 dark:bg-boxdark/60 ${isLow
                      ? 'border-rose-200 dark:border-rose-500/30'
                      : isTRS
                        ? 'border-blue-100 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/30'
                        : 'border-indigo-100 dark:border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30'}`}
                  >
                    {/* Status dot */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : status === 'In Use' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          status === 'Available' ? 'bg-emerald-500' : status === 'In Use' ? 'bg-blue-500' : 'bg-rose-500'
                        }`} />
                        {status}
                      </span>
                    </div>
                    <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-wider ${isTRS
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
                      {size.size}
                    </div>
                    {isLow && (
                      <div className="absolute top-7 left-0 px-2 py-1 rounded-r-xl bg-rose-50 dark:bg-rose-900/20 mt-1">
                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Low Stock</span>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col items-center justify-center mt-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{tool.name}</h4>
                      <div className="py-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 text-center">Quantity</div>
                        <div className={`text-5xl font-black text-center ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                          {size.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white dark:bg-boxdark text-slate-900 dark:text-white px-5 py-2.5 rounded-full font-bold shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">Update Stock</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Quantity Modal */}
      {editingTool && editSizeIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTool(null)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Update Stock</h3>
              <p className="text-sm text-slate-400 font-bold">{editingTool.name} — {editingTool.sizes[editSizeIndex].size}</p>
            </div>
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setEditQuantity(Math.max(0, editQuantity - 1))}
                className="w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xl font-bold hover:bg-slate-50 dark:hover:bg-meta-4 transition-all text-slate-700 dark:text-white">−</button>
              <span className="text-5xl font-black text-slate-800 dark:text-white w-24 text-center tabular-nums">{editQuantity}</span>
              <button onClick={() => setEditQuantity(editQuantity + 1)}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 text-white text-xl font-bold hover:from-slate-700 hover:to-slate-600 shadow-xl transition-all">+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingTool(null)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleUpdateQuantity} disabled={saving}
                className="flex-1 py-3.5 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Add Stock</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Name / Category</label>
                <input type="text" value={newTool.name} onChange={e => setNewTool({ ...newTool, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="e.g. CRT" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Size Variants</label>
                {newTool.sizes.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={s.size} onChange={e => handleUpdateSize(i, 'size', e.target.value)}
                      className="flex-1 p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder='Size (e.g. 5")' />
                    <input type="number" value={s.quantity} onChange={e => handleUpdateSize(i, 'quantity', e.target.value)}
                      className="w-24 p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Qty" />
                    {newTool.sizes.length > 1 && (
                      <button onClick={() => handleRemoveSize(i)} className="text-rose-500 font-bold px-3 hover:bg-rose-50 rounded-xl transition-colors">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={handleAddSize} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">+ Add Size Variant</button>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleCreateTool} disabled={saving}
                  className="flex-1 py-3.5 font-bold bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ConsumablesInventory ─────────────────────────────────────────────────────

const ConsumablesInventory = () => {
  const [consumables, setConsumables] = useState<Consumable[]>(MOCK_CONSUMABLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Consumable | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Consumable, 'id'>>({ name: '', category: '', quantity: 0, unit: 'pcs', reorderLevel: 5 });
  const [catFilter, setCatFilter] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(consumables.map(c => c.category)))], [consumables]);

  const filtered = useMemo(() => consumables.filter(c =>
    (catFilter === 'All' || c.category === catFilter) &&
    (!searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [consumables, catFilter, searchTerm]);

  const lowCount = consumables.filter(c => c.quantity <= c.reorderLevel).length;

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setConsumables(prev => prev.map(c => c.id === editingItem.id ? { ...c, quantity: editQty } : c));
    setEditingItem(null);
  };

  const handleAdd = () => {
    if (!newItem.name) return;
    setConsumables(prev => [...prev, { ...newItem, id: `c-${Date.now()}` }]);
    setShowAddModal(false);
    setNewItem({ name: '', category: '', quantity: 0, unit: 'pcs', reorderLevel: 5 });
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search consumables..."
                className="pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white/60 dark:bg-meta-4 dark:text-white w-48" />
            </div>
            <button onClick={() => setShowAddModal(true)}
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
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-meta-4/50 border-b border-slate-100 dark:border-white/5">
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Item Name</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Qty</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Unit</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Reorder At</th>
              <th className="text-center px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No items found</td></tr>
            ) : filtered.map(item => {
              const isLow = item.quantity <= item.reorderLevel;
              return (
                <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-meta-4/30 ${isLow ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''}`}>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-white">
                    {isLow && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-pulse" />}
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">{item.category}</span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-black text-lg tabular-nums ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-400 text-xs font-bold uppercase">{item.unit}</td>
                  <td className="px-5 py-3.5 text-right text-slate-400 text-sm font-medium tabular-nums">{item.reorderLevel}</td>
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
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => { setEditingItem(item); setEditQty(item.quantity); }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Update</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit quantity modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 text-center">Update Quantity</h3>
            <p className="text-sm text-slate-400 font-bold text-center mb-6">{editingItem.name}</p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setEditQty(Math.max(0, editQty - 1))}
                className="w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xl font-bold hover:bg-slate-50 dark:hover:bg-meta-4 transition-all text-slate-700 dark:text-white">−</button>
              <span className="text-5xl font-black text-slate-800 dark:text-white w-24 text-center tabular-nums">{editQty}</span>
              <button onClick={() => setEditQty(editQty + 1)}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 text-white text-xl font-bold shadow-xl">+</button>
            </div>
            {editQty <= editingItem.reorderLevel && (
              <p className="text-xs text-rose-500 font-bold text-center mb-4">⚠ Below reorder level ({editingItem.reorderLevel} {editingItem.unit})</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setEditingItem(null)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">Cancel</button>
              <button onClick={handleSaveEdit}
                className="flex-1 py-3.5 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Add Consumable</h3>
            <div className="space-y-4">
              {[
                { label: 'Item Name', key: 'name', placeholder: 'e.g. Teflon Tape' },
                { label: 'Category', key: 'category', placeholder: 'e.g. PPE, Lubricants' },
                { label: 'Unit', key: 'unit', placeholder: 'e.g. pcs, kg, litre' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
                  <input type="text" value={(newItem as any)[key]} placeholder={placeholder}
                    onChange={e => setNewItem({ ...newItem, [key]: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Quantity</label>
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">Reorder Level</label>
                  <input type="number" value={newItem.reorderLevel} onChange={e => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-meta-4 rounded-xl font-bold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-3.5 font-bold bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg">Add</button>
              </div>
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
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md'
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
