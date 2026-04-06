
import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';

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
  'Handling Tools DHT': 'HANDLING TOOLS'
};

const TRS_CATEGORIES = ['CRT', 'Power Tong', 'Jam Unit', 'Filup Tool', 'Safety Clamp', 'Elevators', 'Slips', 'Spider Elevators'];
const DHT_CATEGORIES = ['Reamers', 'Anti Stick Slip', 'Scrapper', 'Jars', 'Handling Tools DHT'];

type ToolGroupKey = 'TRS' | 'DHT';

interface ToolSize {
  size: string;
  quantity: number;
  inventoryId?: string;
}

interface Tool {
  id: string;
  name: string;
  group: ToolGroupKey;
  available: number;
  sizes: ToolSize[];
  type?: string;
  category: string;
}

const Inventory = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('CRT');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [, setImportFile] = useState<File | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await apiClient.inventory.getAll();

        if (Array.isArray(data)) {
          const toolMap = new Map<string, Tool>();

          data.forEach((item: any) => {
            const categoryName = item.category || 'TRS';
            const group = (categoryName === 'DHT' ? 'DHT' : 'TRS') as ToolGroupKey;

            let deducedCategory = 'Other';
            const nameUpper = item.itemName?.toUpperCase() || '';

            if (item.description && item.description.startsWith('Imported from ')) {
              const importedCat = item.description.replace('Imported from ', '');
              const exactMatch = [...TRS_CATEGORIES, ...DHT_CATEGORIES].find(c => c.toLowerCase() === importedCat.toLowerCase());
              if (exactMatch) {
                deducedCategory = exactMatch;
              } else {
                deducedCategory = importedCat;
              }
            } else {
              const KEYWORD_MAP: Record<string, string> = {
                'AST': 'Anti Stick Slip', 'ANTI STICK': 'Anti Stick Slip',
                'CRT': 'CRT', 'POWER TONG': 'Power Tong', 'TONG': 'Power Tong',
                'JAM': 'Jam Unit', 'FILUP': 'Filup Tool', 'SAFETY CLAMP': 'Safety Clamp',
                'CLAMP': 'Safety Clamp', 'ELEVATOR': 'Elevators', 'ELEV': 'Elevators',
                'SLIP': 'Slips', 'SPIDER': 'Spider Elevators', 'REAMER': 'Reamers',
                'SCRAP': 'Scrapper', 'JAR': 'Jars', 'HANDLING': 'Handling Tools DHT'
              };
              for (const [key, category] of Object.entries(KEYWORD_MAP)) {
                if (nameUpper.includes(key)) {
                  deducedCategory = category;
                  break;
                }
              }
            }

            if (deducedCategory === 'Other' || deducedCategory === nameUpper) {
              const exactMatch = [...TRS_CATEGORIES, ...DHT_CATEGORIES].find(c => nameUpper === c.toUpperCase());
              if (exactMatch) deducedCategory = exactMatch;
            }

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
                group: group,
                available: item.quantity,
                sizes: [{ size: item.unit || '-', quantity: item.quantity, inventoryId: item.id }],
                type: item.description,
                category: deducedCategory
              });
            }
          });

          setTools(Array.from(toolMap.values()));
        } else {
          setTools([]);
          setError('Invalid server response');
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Memoized filtered tools
  const filteredTools = useMemo(() => tools.filter(t => {
    const tCat = t.category.toUpperCase();
    const sCat = selectedCategory.toUpperCase();
    const sDisplay = CATEGORY_DISPLAY_MAP[selectedCategory]?.toUpperCase();
    return tCat.includes(sCat) || (sDisplay && tCat.includes(sDisplay)) ||
      t.name.toUpperCase().includes(sCat) || (sDisplay && t.name.toUpperCase().includes(sDisplay));
  }), [tools, selectedCategory]);

  // Collect and sort sizes
  const allSizes = useMemo(() => {
    const sizes: { tool: Tool, size: ToolSize, index: number }[] = [];
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

  // Category counts for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + t.available;
    });
    return counts;
  }, [tools]);

  // Handlers
  const handleAddSize = () => {
    setNewTool({ ...newTool, sizes: [...newTool.sizes, { size: '', quantity: 0 }] });
  };
  const handleRemoveSize = (index: number) => {
    setNewTool({ ...newTool, sizes: newTool.sizes.filter((_, i) => i !== index) });
  };
  const handleUpdateSize = (index: number, field: 'size' | 'quantity', value: string | number) => {
    const updatedSizes = [...newTool.sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: field === 'quantity' ? Number(value) : value };
    setNewTool({ ...newTool, sizes: updatedSizes });
  };

  const handleCreateTool = async () => {
    if (!newTool.name) return alert("Name required");
    try {
      setSaving(true);
      const promises = newTool.sizes.map(s => apiClient.inventory.create({
        itemName: newTool.name.toUpperCase(),
        category: newTool.group,
        quantity: s.quantity,
        unit: s.size,
        description: 'Created Manually'
      }));
      await Promise.all(promises);
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
      setShowAddModal(false);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!editingTool || editSizeIndex === -1) return;
    const sizeObj = editingTool.sizes[editSizeIndex];
    if (!sizeObj.inventoryId) return;
    try {
      setSaving(true);
      await apiClient.inventory.update(sizeObj.inventoryId, { quantity: editQuantity });
      const updatedSize = { ...sizeObj, quantity: editQuantity };
      const toolIdx = tools.findIndex(t => t.id === editingTool.id);
      if (toolIdx > -1) {
        const newTools = [...tools];
        const newSizes = [...newTools[toolIdx].sizes];
        newSizes[editSizeIndex] = updatedSize;
        newTools[toolIdx] = {
          ...newTools[toolIdx],
          sizes: newSizes,
          available: newSizes.reduce((a, b) => a + b.quantity, 0)
        };
        setTools(newTools);
      }
      setEditingTool(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleFileImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      setImportFile(file);
      alert("Please use the specific Import Script or Tools page for bulk import, or contact admin.");
    } catch (err) { console.error(err); }
    finally { setSaving(false); setShowImportModal(false); }
  };

  if (loading) return <MainLayout><div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-semibold">Loading Inventory...</p>
    </div>
  </div></MainLayout>;
  if (error) return <MainLayout><div className="p-10 text-center text-red-500">{error}</div></MainLayout>;

  return (
    <MainLayout headerContent={
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Inventory Management</h1>
        <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Track stock levels across all tool categories</p>
      </div>
    }>
      <div className="flex flex-col md:flex-row gap-6">

        {/* SIDEBAR */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-5 md:sticky md:top-0 h-[calc(100vh-150px)] overflow-y-auto">

            {/* TRS */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em]">TRS Inventory</span>
              </div>
              <div className="space-y-1">
                {TRS_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-between ${selectedCategory === cat
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent shadow-[0_0_12px_rgba(25,86,168,0.3)]'
                      : 'bg-white/60 border-white/20 text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-meta-4 hover:shadow-sm hover:-translate-y-0.5'
                      }`}
                  >
                    <span>{CATEGORY_DISPLAY_MAP[cat] || cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
                      }`}>{categoryCounts[cat] || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DHT */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">DHT Inventory</span>
              </div>
              <div className="space-y-1">
                {DHT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-between ${selectedCategory === cat
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                      : 'bg-white/60 border-white/20 text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-meta-4 hover:shadow-sm hover:-translate-y-0.5'
                      }`}
                  >
                    <span>{CATEGORY_DISPLAY_MAP[cat] || cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
                      }`}>{categoryCounts[cat] || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Others */}
            {(() => {
              const knownCats = new Set([...TRS_CATEGORIES, ...DHT_CATEGORIES]);
              const otherCats = Array.from(new Set(tools.map(t => t.category))).filter(c => !knownCats.has(c));
              if (otherCats.length === 0) return null;
              return (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Others</span>
                  </div>
                  <div className="space-y-1">
                    {otherCats.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-between ${selectedCategory === cat
                          ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white border-transparent shadow-lg'
                          : 'bg-white/60 border-white/20 text-slate-600 hover:bg-white dark:bg-boxdark/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-meta-4'
                          }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat
                          ? 'bg-white/20' : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
                          }`}>{categoryCounts[cat] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 min-w-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6 min-h-[calc(100vh-150px)]">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100/50 dark:border-white/5 gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">{CATEGORY_DISPLAY_MAP[selectedCategory] || selectedCategory}</h2>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" /></svg>
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
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="pl-9 pr-4 py-2.5 border border-slate-200/60 dark:border-white/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white/60 dark:bg-meta-4 dark:text-white transition-all"
                  />
                </div>
                <button onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-700 hover:to-slate-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Add Stock
                </button>
              </div>
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
                  return (
                    <div key={`${tool.id}-${index}`}
                      onClick={() => { setEditingTool(tool); setEditSizeIndex(index); setEditQuantity(size.quantity); }}
                      className={`cursor-pointer group relative rounded-2xl border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col bg-white/80 dark:bg-boxdark/60 ${isLow
                        ? 'border-rose-200 dark:border-rose-500/30'
                        : isTRS
                          ? 'border-blue-100 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/30'
                          : 'border-indigo-100 dark:border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                        }`}
                    >
                      {/* Size Badge */}
                      <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-wider ${isTRS
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                        }`}>
                        {size.size}
                      </div>

                      {/* Low Stock Warning */}
                      {isLow && (
                        <div className="absolute top-0 left-0 px-2 py-1 rounded-br-xl bg-rose-50 dark:bg-rose-900/20">
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Low</span>
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col items-center justify-center">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 mt-3">{tool.name}</h4>

                        <div className="py-5">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 text-center">Quantity</div>
                          <div className={`text-5xl font-black text-center ${isLow
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-white'
                            }`}>
                            {size.quantity}
                          </div>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white dark:bg-boxdark text-slate-900 dark:text-white px-5 py-2.5 rounded-full font-bold shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          Update Stock
                        </span>
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
                  className="w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xl font-bold hover:bg-slate-50 dark:hover:bg-meta-4 transition-all active:scale-95 text-slate-700 dark:text-white">−</button>
                <span className="text-5xl font-black text-slate-800 dark:text-white w-24 text-center tabular-nums">{editQuantity}</span>
                <button onClick={() => setEditQuantity(editQuantity + 1)}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 text-white text-xl font-bold hover:from-slate-700 hover:to-slate-600 shadow-xl transition-all active:scale-95">+</button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingTool(null)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleUpdateQuantity} disabled={saving}
                  className="flex-1 py-3.5 font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50">
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
                    className="flex-1 py-3.5 font-bold bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50">
                    {saving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">Import Tools</h3>
                <p className="text-slate-400 mb-6 font-medium">Upload a CSV file to bulk import inventory.</p>
                <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-10 mb-6 hover:border-blue-400 cursor-pointer transition-colors relative">
                  <input type="file" onChange={handleFileImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="text-5xl mb-3 opacity-60">📄</div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Click to Upload CSV</span>
                </div>
                <button onClick={() => setShowImportModal(false)} className="w-full py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Inventory;
