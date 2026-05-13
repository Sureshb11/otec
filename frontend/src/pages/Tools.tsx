import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';
import {
  TRS_CATEGORIES,
  DHT_CATEGORIES,
  CATEGORY_DISPLAY_MAP,
} from '../constants/categories';

// Status mapping from backend ToolStatus to display labels
type DisplayStatus = 'onsite' | 'in_transit' | 'yard' | 'service';
const STATUS_MAP: Record<string, DisplayStatus> = {
  'available': 'yard',
  'in_transit': 'in_transit',
  'onsite': 'onsite',
  'maintenance': 'service',
};

interface ToolItem {
  id: string;
  name: string;
  groupType: 'TRS' | 'DHT';
  category: string;
  size: string;
  serialNumber: string;
  status: DisplayStatus;
  rawStatus?: string;
  operationalHours: number;
  rigName?: string;
  locationName?: string;
}

const STATUS_CONFIG = {
  onsite: {
    label: 'Onsite',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    tabBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10',
    tabBorder: 'border-emerald-300 dark:border-emerald-500/40',
    tabText: 'text-emerald-700 dark:text-emerald-400',
    icon: 'onsite',
  },
  in_transit: {
    label: 'In-Transit',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-500/10',
    badgeText: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    tabBg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10',
    tabBorder: 'border-blue-300 dark:border-blue-500/40',
    tabText: 'text-blue-700 dark:text-blue-400',
    icon: 'in_transit',
  },
  yard: {
    label: 'Yard',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
    badgeText: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    tabBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10',
    tabBorder: 'border-amber-300 dark:border-amber-500/40',
    tabText: 'text-amber-700 dark:text-amber-400',
    icon: 'yard',
  },
  service: {
    label: 'Service',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-500/10',
    badgeText: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-500/30',
    tabBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10',
    tabBorder: 'border-rose-300 dark:border-rose-500/40',
    tabText: 'text-rose-700 dark:text-rose-400',
    icon: 'service',
  },
};

const Tools = () => {
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('CRT');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DisplayStatus>('all');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const tools = await apiClient.tools.getAll();
        if (Array.isArray(tools)) {
          const mapped: ToolItem[] = tools.map((t: any) => {
            let cat = 'Other';
            // Prefer the canonical category set by the backend importer.
            if (t.category) {
              cat = t.category;
            } else if (t.description?.startsWith('Imported from ')) {
              cat = t.description.replace('Imported from ', '');
            }
            return {
              id: t.id,
              name: t.name,
              groupType: t.type as 'TRS' | 'DHT',
              category: cat,
              // Show the size actually deployed (from order_items.size) when the
              // tool is on an active order; otherwise fall back to the master
              // compatibility list. Empty string if neither.
              size: t.deployedSize || t.size || '',
              serialNumber: t.serialNumber,
              status: STATUS_MAP[t.status] || 'yard',
              operationalHours: Number(t.operationalHours) || 0,
              rigName: t.rig?.name,
              locationName: t.rig?.location?.name,
            };
          });
          setAllTools(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch tools:', err);
        setError('Failed to load tools.');
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, []);

  // Memoize filtered tools to prevent re-computation on every render
  const categoryTools = useMemo(() =>
    allTools.filter(t => t.category === selectedCategory),
    [allTools, selectedCategory]
  );

  const filteredTools = useMemo(() =>
    categoryTools.filter(t => {
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return t.name.toLowerCase().includes(term) ||
          t.serialNumber.toLowerCase().includes(term) ||
          t.size?.toLowerCase().includes(term);
      }
      return true;
    }),
    [categoryTools, selectedStatus, searchTerm]
  );

  // Stable counts derived from memoized data
  const totalCount = categoryTools.length;
  const onsiteCount = categoryTools.filter(t => t.status === 'onsite').length;
  const inTransitCount = categoryTools.filter(t => t.status === 'in_transit').length;
  const yardCount = categoryTools.filter(t => t.status === 'yard').length;
  const serviceCount = categoryTools.filter(t => t.status === 'service').length;

  // Category counts for sidebar badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTools]);

  if (loading) return <MainLayout><div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-semibold">Loading Tools...</p>
    </div>
  </div></MainLayout>;
  if (error) return <MainLayout><div className="p-10 text-center text-red-500">{error}</div></MainLayout>;

  return (
    <MainLayout headerContent={
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Operations Tools</h1>
        <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Manage and track all operational tools</p>
      </div>
    }>
      <div className="flex flex-col md:flex-row gap-6">
        {/* SIDEBAR: Categories */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-5 md:sticky md:top-0 h-[calc(100vh-150px)] overflow-y-auto">

            {/* TRS Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em]">TRS System</span>
              </div>
              <div className="space-y-1">
                {TRS_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedStatus('all'); setSearchTerm(''); }}
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

            {/* DHT Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">DHT System</span>
              </div>
              <div className="space-y-1">
                {DHT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedStatus('all'); setSearchTerm(''); }}
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
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 min-w-0">
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6 min-h-[calc(100vh-150px)]">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-100/50 dark:border-white/5 pb-4">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{CATEGORY_DISPLAY_MAP[selectedCategory] || selectedCategory}</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{DHT_CATEGORIES.includes(selectedCategory) ? 'DHT Group' : 'TRS Group'}</span>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {[
                { id: 'all' as const, label: 'All', count: totalCount, icon: 'all' },
                { id: 'onsite' as const, label: 'Onsite', count: onsiteCount, icon: 'onsite' },
                { id: 'in_transit' as const, label: 'In-Transit', count: inTransitCount, icon: 'in_transit' },
                { id: 'yard' as const, label: 'Yard', count: yardCount, icon: 'yard' },
                { id: 'service' as const, label: 'Service', count: serviceCount, icon: 'service' }
              ].map(tab => {
                const isActive = selectedStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group overflow-hidden ${isActive
                      ? tab.id === 'all'
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 dark:border-blue-500/40 shadow-lg shadow-blue-100 dark:shadow-none'
                        : `${STATUS_CONFIG[tab.id].tabBorder} ${STATUS_CONFIG[tab.id].tabBg} shadow-lg dark:shadow-none`
                      : 'border-slate-100 dark:border-white/5 bg-white/60 dark:bg-boxdark/60 hover:bg-white dark:hover:bg-meta-4 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                  >
                    <div className="mb-1">
                      {tab.icon === 'all' && <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                      {tab.icon === 'onsite' && <span className="block w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/40 animate-pulse" />}
                      {tab.icon === 'in_transit' && <span className="block w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/40" />}
                      {tab.icon === 'yard' && <span className="block w-3.5 h-3.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/40" />}
                      {tab.icon === 'service' && <span className="block w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/40" />}
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">{tab.count}</div>
                    <div className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive
                      ? tab.id === 'all' ? 'text-blue-600 dark:text-blue-400' : STATUS_CONFIG[tab.id].tabText
                      : 'text-slate-400'
                      }`}>{tab.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="mb-6 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
              <input
                type="text"
                placeholder="Search by Name, Size or Serial Number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200/60 bg-white/60 dark:bg-meta-4 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm font-medium transition-all"
              />
            </div>

            {/* Tool Cards Grid */}
            {filteredTools.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-4 opacity-40"><svg className="w-16 h-16 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                <p className="text-slate-400 font-bold text-lg">No tools found</p>
                <p className="text-slate-400/70 text-sm mt-1">
                  {selectedStatus !== 'all'
                    ? `No ${selectedStatus} tools in this category`
                    : 'Try a different category'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTools.map(tool => {
                  const sc = STATUS_CONFIG[tool.status];
                  return (
                    <div key={tool.id} className={`relative border-2 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group bg-white/80 dark:bg-boxdark/60 ${sc.borderColor}`}>
                      {/* Status Badge */}
                      <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${sc.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dotColor} animate-pulse`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${sc.badgeText}`}>{sc.label}</span>
                      </div>

                      {/* Tool Name & Serial */}
                      <h4 className="font-black text-slate-800 dark:text-white mb-0.5 pr-20 tracking-tight text-sm">{tool.name}</h4>
                      <div className="text-[11px] text-slate-400 mb-4 font-mono tracking-wider">{tool.serialNumber}</div>

                      {/* Details */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Size</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-meta-4/80 px-2.5 py-1 rounded-lg">{tool.size || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Rig</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{tool.rigName || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Location</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{tool.locationName || '-'}</span>
                        </div>
                        {tool.operationalHours > 0 && (
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100/50 dark:border-white/5 mt-1">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Op. Hours</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">{tool.operationalHours.toFixed(1)} hrs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Tools;
