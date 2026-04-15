import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { apiClient } from '../api/apiClient';

interface ToolData {
  id: string;
  name: string;
  group: 'TRS' | 'DHT';
  category: string;
  size: string;
  serialNumber: string;
  status: 'available' | 'onsite' | 'maintenance';
  operationalHours: number;
  rigName?: string;
  rigLocation?: string;
  customerName?: string;
}

interface DashboardStats {
  totalTools: number;
  onsiteTools: number;
  yardTools: number;
  serviceTools: number;
  totalRigs: number;
  totalCustomers: number;
}



const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tools, setTools] = useState<ToolData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTools: 0, onsiteTools: 0, yardTools: 0, serviceTools: 0, totalRigs: 0, totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('CRT');
  const [baseTime] = useState(() => new Date()); // captured once at mount

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [toolsData, rigsData, customersData] = await Promise.all([
          apiClient.tools.getAll(),
          apiClient.rigs.getAll(),
          apiClient.customers.getAll(),
        ]);

        if (Array.isArray(toolsData)) {
          const mapped: ToolData[] = toolsData.map((t: any) => {
            // Use the tool's category field directly; fall back to description parsing for legacy data
            let cat = t.category || 'Other';
            if (cat === 'Other' && t.description?.startsWith('Imported from ')) {
              cat = t.description.replace('Imported from ', '');
            }
            return {
              id: t.id,
              name: t.name,
              group: t.type as 'TRS' | 'DHT',
              category: cat,
              size: t.size || '',
              serialNumber: t.serialNumber,
              status: t.status || 'available',
              operationalHours: Number(t.operationalHours) || 0,
              rigName: t.rig?.name,
              rigLocation: t.rig?.location?.name,
              customerName: t.rig?.customer?.name,
            };
          });
          setTools(mapped);

          const onsiteCount = mapped.filter(t => t.status === 'onsite').length;
          const maintenanceCount = mapped.filter(t => t.status === 'maintenance').length;
          const yardCount = mapped.filter(t => t.status === 'available').length;

          setStats({
            totalTools: mapped.length,
            onsiteTools: onsiteCount,
            yardTools: yardCount,
            serviceTools: maintenanceCount,
            totalRigs: Array.isArray(rigsData) ? rigsData.length : 0,
            totalCustomers: Array.isArray(customersData) ? customersData.length : 0,
          });

          // CRT is pre-selected by default via useState
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Timer — update every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Group tools by category
  const TRS_CATS = ['CRT', 'Power Tong', 'Jam Unit', 'Filup Tool', 'Safety Clamp', 'Elevators', 'Slips', 'Spider Elevators'];
  const DHT_CATS = ['Reamers', 'Anti Stick Slip', 'Scrapper', 'Jars', 'Circulating DHT'];
  const CATEGORY_DISPLAY: Record<string, string> = {
    'CRT': 'CRT', 'Power Tong': 'POWER TONG', 'Jam Unit': 'JAM UNIT',
    'Filup Tool': 'FILUP TOOL', 'Safety Clamp': 'SAFETY CLAMP',
    'Elevators': 'ELEVATORS', 'Slips': 'SLIPS', 'Spider Elevators': 'SPIDER ELEVATORS',
    'Reamers': 'REAMERS', 'Anti Stick Slip': 'ANTI STICK SLIP',
    'Scrapper': 'SCRAPPER', 'Jars': 'JARS', 'Circulating DHT': 'CIRCULATING'
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; onsite: number }> = {};
    tools.forEach(t => {
      if (!counts[t.category]) counts[t.category] = { total: 0, onsite: 0 };
      counts[t.category].total++;
      if (t.status === 'onsite') counts[t.category].onsite++;
    });
    return counts;
  }, [tools]);

  // Selected category tools — onsite ones shown in the live monitor
  const activeCategoryTools = useMemo(() =>
    tools.filter(t => t.category === selectedCategory),
    [tools, selectedCategory]
  );

  const onsiteTools = useMemo(() =>
    activeCategoryTools.filter(t => t.status === 'onsite'),
    [activeCategoryTools]
  );

  // Compute runtime per tool using real activatedAt from orders (falls back to mount-time)
  const [orderActivatedMap, setOrderActivatedMap] = useState<Record<string, string>>({});

  // Fetch orders to get activatedAt timestamps for onsite tools
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await apiClient.orders.getAll();
        if (Array.isArray(ordersData)) {
          const map: Record<string, string> = {};
          ordersData.forEach((order: any) => {
            if (order.status === 'active' && order.activatedAt && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                map[item.toolId] = order.activatedAt;
              });
            }
          });
          setOrderActivatedMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch orders for tool activation times:', err);
      }
    };
    fetchOrders();
  }, []);

  const liveInstances = useMemo(() =>
    onsiteTools.map(tool => {
      const activatedAt = orderActivatedMap[tool.id];
      const startTime = activatedAt ? new Date(activatedAt) : baseTime;
      const elapsedSec = Math.max(0, Math.floor((currentTime.getTime() - startTime.getTime()) / 1000));
      const hours = Math.floor(elapsedSec / 3600);
      const minutes = Math.floor((elapsedSec % 3600) / 60);
      const seconds = elapsedSec % 60;
      return {
        ...tool,
        hours,
        minutes,
        seconds,
        startTime
      };
    }),
    [onsiteTools, currentTime, baseTime, orderActivatedMap]
  );

  // All tools not onsite for the yard/service count in the side panel
  const yardTools = activeCategoryTools.filter(t => t.status === 'available');
  const serviceToolsList = activeCategoryTools.filter(t => t.status === 'maintenance');

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 w-full">
          <div className="space-y-2 relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-lg"></div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
              Welcome back, {user?.firstName || 'Admin'}
            </h1>
            <p className="text-sm text-slate-500 font-bold tracking-widest uppercase dark:text-bodydark2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Operational Overview
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 xl:ml-auto">
            <div className="flex items-center gap-4">
              {/* Active Tools */}
              <Link to="/operations/tools" className="glass-premium dark:bg-boxdark/80 px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-4 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/20 flex items-center justify-center shadow-inner">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.onsiteTools}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Active</p>
                </div>
              </Link>

              {/* Rigs */}
              <Link to="/clients/rigs" className="glass-premium dark:bg-boxdark/80 px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-4 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="w-10 h-10 rounded-lg bg-sky-100/80 dark:bg-sky-500/20 flex items-center justify-center shadow-inner">
                  <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.totalRigs}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rigs</p>
                </div>
              </Link>

              {/* Stock */}
              <Link to="/inventory" className="glass-premium dark:bg-boxdark/80 px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-4 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 dark:bg-amber-500/20 flex items-center justify-center shadow-inner">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.yardTools}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Stock</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 ml-2">
              {/* Tool Board (TV Display) */}
              <Link
                to="/dashboard/tool-board"
                title="Open full-screen Tool Board for TV display"
                className="px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 border border-white/10"
              >
                <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="tracking-wide uppercase hidden sm:inline">Tool Board</span>
              </Link>

              {/* New Order */}
              <button
                onClick={() => navigate('/orders', { state: { openNewOrder: true } })}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2 border border-white/10"
              >
                <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="tracking-wide uppercase">New Order</span>
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">

        {/* Left Panel: Tool Selector */}
        <div className="w-full lg:w-80 glass-premium dark:bg-boxdark/80 rounded-2xl flex flex-col overflow-hidden shadow-xl border border-white/20 dark:border-white/5 relative">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[20%] bg-blue-500/10 blur-[40px] pointer-events-none"></div>

          <div className="p-5 border-b border-slate-200/50 dark:border-strokedark bg-white/40 dark:bg-boxdark-2/60 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Equipment Fleet
            </h2>
            <div className="text-[10px] font-bold bg-slate-200 dark:bg-meta-4 px-2 py-1 rounded text-slate-500 dark:text-bodydark2">{stats.totalTools} Units</div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-6 custom-scrollbar relative z-10">
            {/* TRS Section */}
            <div className="relative">
              <div className="px-3 mb-3 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(25,86,168,0.8)]"></div>
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">TRS System</span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-strokedark to-transparent ml-2"></div>
              </div>
              <div className="space-y-1.5">
                {TRS_CATS.map(cat => {
                  const cc = categoryCounts[cat] || { total: 0, onsite: 0 };
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 border relative overflow-hidden group ${selectedCategory === cat
                        ? 'bg-gradient-to-r from-blue-50 to-blue-50 dark:from-boxdark-2 dark:to-boxdark border-blue-300 dark:border-blue-700/50 shadow-md ring-1 ring-blue-500/20'
                        : 'bg-white/60 dark:bg-boxdark/60 border-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-meta-4 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                    >
                      {selectedCategory === cat && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-500"></div>
                      )}
                      <div className="flex justify-between items-center pl-2">
                        <span className={`font-bold tracking-wide ${selectedCategory === cat ? 'text-slate-900 dark:text-white' : ''}`}>{CATEGORY_DISPLAY[cat] || cat}</span>
                        <div className="flex items-center gap-2">
                          {cc.onsite > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat
                            ? 'bg-blue-200/50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
                            }`}>{cc.total}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DHT Section */}
            <div className="relative">
              <div className="px-3 mb-3 flex items-center space-x-2 pt-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">DHT System</span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-strokedark to-transparent ml-2"></div>
              </div>
              <div className="space-y-1.5">
                {DHT_CATS.map(cat => {
                  const cc = categoryCounts[cat] || { total: 0, onsite: 0 };
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 border relative overflow-hidden group ${selectedCategory === cat
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-boxdark-2 dark:to-boxdark border-indigo-300 dark:border-indigo-700/50 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/60 dark:bg-boxdark/60 border-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-meta-4 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                    >
                      {selectedCategory === cat && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                      )}
                      <div className="flex justify-between items-center pl-2">
                        <span className={`font-bold tracking-wide ${selectedCategory === cat ? 'text-slate-900 dark:text-white' : ''}`}>{CATEGORY_DISPLAY[cat] || cat}</span>
                        <div className="flex items-center gap-2">
                          {cc.onsite > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${selectedCategory === cat
                            ? 'bg-indigo-200/50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-meta-4 dark:text-slate-400'
                            }`}>{cc.total}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Monitor */}
        <div className="flex-1 flex flex-col glass-premium dark:bg-boxdark/90 rounded-2xl overflow-hidden border border-white/20 dark:border-white/5 shadow-xl relative">
          <div className="absolute top-[20%] right-[-10%] w-[80%] h-[60%] bg-blue-500/5 blur-[80px] pointer-events-none"></div>

          <div className="p-6 border-b border-slate-200/50 dark:border-strokedark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 dark:bg-boxdark-2/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedCategory ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_15px_rgba(25,86,168,0.3)]' : 'bg-slate-200 dark:bg-meta-4'}`}>
                <svg className={`w-6 h-6 ${selectedCategory ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                  {selectedCategory ? (
                    <>
                      {CATEGORY_DISPLAY[selectedCategory] || selectedCategory}
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 tracking-[0.2em] uppercase border border-emerald-300/50 dark:border-emerald-500/30 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                        Live Monitor
                      </span>
                    </>
                  ) : (
                    'Telemetry Dashboard'
                  )}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {selectedCategory
                    ? `${activeCategoryTools.length} total · ${onsiteTools.length} onsite · ${yardTools.length} yard · ${serviceToolsList.length} service`
                    : 'Select a category to view live metrics'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-transparent relative z-10">
            {selectedCategory ? (
              liveInstances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {liveInstances.map((inst) => (
                    <div key={inst.id} className="relative group perspective-1000">
                      {/* Animated Glow Backdrop */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>

                      {/* Main Card Container */}
                      <div className="relative h-full flex flex-col bg-white dark:bg-[#111827]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-lg transition-all duration-300 overflow-hidden z-10">

                        {/* Status Bar Top Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-90"></div>

                        {/* Top Header Row */}
                        <div className="flex justify-between items-start mb-3">
                          {/* Tool Status Badge */}
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20 w-fit">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">Operational</span>
                          </div>

                          {/* Customer Pill (if available) */}
                          {inst.customerName && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-100 dark:border-blue-500/20 shadow-sm max-w-[50%]">
                              <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider truncate">{inst.customerName}</span>
                            </div>
                          )}
                        </div>

                        {/* Tool Identity Section */}
                        <div className="flex-1 mb-3 relative">
                          {/* Decorative Background Icon */}
                          <svg className="absolute -right-2 -top-4 w-20 h-20 text-slate-50 dark:text-slate-800/50 -z-10 transform -rotate-12 transition-transform duration-500 group-hover:rotate-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>

                          <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-tight mb-0.5">{inst.name}</h3>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-100 dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">{inst.serialNumber}</span>
                            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">{inst.size} Series</span>
                          </div>

                          {/* Location & Rig Data */}
                          {(inst.rigLocation || inst.rigName) && (
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {inst.rigLocation && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {inst.rigLocation}
                                  </div>
                                )}
                                {inst.rigName && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    {inst.rigName}
                                  </div>
                                )}
                              </div>

                              {/* Pumpjack Animation - Compact */}
                              <div className="w-10 h-10 flex flex-col justify-end relative shrink-0 opacity-80">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" className="drop-shadow-sm scale-110 origin-bottom right-0">
                                  {/* Base & Structure */}
                                  <path d="M10 85 h80 v6 c0 2-2 4-4 4 h-72 c-2 0-4-2-4-4 z" fill="#475569" className="dark:fill-slate-600" />
                                  {/* Support Frame */}
                                  <path d="M50 40 L35 85 h10 L50 55 L60 85 h10 Z" fill="#64748B" className="dark:fill-slate-500" opacity="0.9" />
                                  {/* Pivot */}
                                  <circle cx="50" cy="40" r="4" fill="#1E293B" className="dark:fill-slate-300" />

                                  {/* Animated Walking Beam & Head */}
                                  <g style={{ transformOrigin: '50px 40px', animation: 'pumpRockReal 2.5s ease-in-out infinite' }}>
                                    {/* Walking Beam */}
                                    <path d="M20 37 h65 c3 0 5 2 5 3 v0 c0 1-2 3-5 3 h-65 z" fill="#3B82F6" className="dark:fill-blue-500" />
                                    {/* Horse Head */}
                                    <path d="M22 37 c-8 0-15 5-15 15 c0 5 8 12 12 12 c0 0 3-15 3-27 z" fill="#2563EB" className="dark:fill-blue-600" />
                                    {/* Polished Rod */}
                                    <rect x="10" y="55" width="2" height="35" fill="#94A3B8" className="dark:fill-slate-400" style={{ transformOrigin: '11px 55px', animation: 'pumpRodReal 2.5s ease-in-out infinite' }} />
                                  </g>

                                  {/* Wellhead at bottom */}
                                  <path d="M5 80 h12 v5 h-12 z" fill="#334155" className="dark:fill-slate-700" />
                                  <path d="M8 75 h6 v5 h-6 z" fill="#475569" className="dark:fill-slate-600" />
                                </svg>
                                <style>{`
                                  @keyframes pumpRockReal {
                                    0%, 100% { transform: rotate(-10deg); }
                                    50% { transform: rotate(15deg); }
                                  }
                                  @keyframes pumpRodReal {
                                    0%, 100% { transform: translateY(0px) rotate(10deg); }
                                    50% { transform: translateY(-8px) rotate(-15deg); }
                                  }
                                `}</style>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Compact Runtime Gauge */}
                        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] -mx-3.5 -mb-3.5 px-3.5 py-3 mt-auto border-t border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
                          <div className="flex items-center justify-between relative z-10">
                            {/* Time Display */}
                            <div>
                              <div className="flex items-center gap-1 mb-0.5 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Active Runtime
                              </div>
                              <div className="flex items-baseline font-mono tracking-tighter">
                                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none tabular-nums">
                                  {inst.hours.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-0.5 uppercase mr-1.5">h</span>
                                <span className="text-xl font-black text-slate-600 dark:text-slate-300 leading-none tabular-nums">
                                  {inst.minutes.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-0.5 uppercase mr-1.5">m</span>
                                <span className="text-base font-black text-slate-400 dark:text-slate-500 leading-none tabular-nums">
                                  {inst.seconds.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-0.5 uppercase">s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operational Hours */}
                      {inst.operationalHours > 0 && (
                        <div className="mt-1.5 flex items-center justify-between text-[10px] px-0.5">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Lifetime Op. Hours</span>
                          <span className="font-black text-blue-600 dark:text-blue-400">{inst.operationalHours.toFixed(1)} hrs</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-meta-4 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="font-bold text-lg mb-1">No Active Tools</p>
                  <p className="text-sm text-slate-400/70">
                    {activeCategoryTools.length > 0
                      ? `${activeCategoryTools.length} tools in yard/service — none currently onsite`
                      : 'No tools in this category'}
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Select a tool system to view live metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
