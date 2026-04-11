import { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { apiClient } from '../api/apiClient';

// Define chart colors for the premium aesthetic
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('orders');
  const [tools, setTools] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.tools.getAll().catch(() => []),
      apiClient.orders.getAll().catch(() => []),
      apiClient.customers.getAll().catch(() => []),
      apiClient.inventory.getAll().catch(() => []),
    ]).then(([t, o, c, i]) => {
      setTools(Array.isArray(t) ? t : []);
      setOrders(Array.isArray(o) ? o : []);
      setCustomers(Array.isArray(c) ? c : []);
      setInventory(Array.isArray(i) ? i : []);
    });
  }, []);

  const reportTypes = [
    { id: 'orders', name: 'Orders Report', icon: '📋', description: 'View order statistics and analytics' },
    { id: 'tools', name: 'Tools Report', icon: '🔧', description: 'Track tool usage and availability' },
    { id: 'customers', name: 'Customers Report', icon: '👥', description: 'Customer activity and insights' },
    { id: 'inventory', name: 'Inventory Report', icon: '📦', description: 'Inventory levels and movements' },
    { id: 'maintenance', name: 'Maintenance Report', icon: '🔨', description: 'Maintenance schedules and history' },
  ];

  // Real aggregate data derived from API responses
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const completedOrders = orders.filter(o => o.status === 'returned' || o.status === 'job_done').length;
  const draftOrders = orders.filter(o => o.status === 'draft').length;
  const onsiteTools = tools.filter(t => t.status === 'onsite').length;
  const availableTools = tools.filter(t => t.status === 'available').length;
  const maintenanceTools = tools.filter(t => t.status === 'maintenance').length;
  const activeCustomers = customers.filter(c => c.isActive).length;
  const lowStockItems = inventory.filter(i => i.quantity != null && i.minQuantity != null && i.quantity <= i.minQuantity).length;
  const overdueTools = tools.filter(t => t.nextMaintenanceDate && new Date(t.nextMaintenanceDate) < new Date()).length;

  const topCustomerName = (() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { if (o.customer?.name) counts[o.customer.name] = (counts[o.customer.name] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '—';
  })();

  const aggregateData: Record<string, Record<string, any>> = {
    orders: {
      totalOrders: orders.length,
      activeOrders,
      draftOrders,
      completedOrders,
      revenue: orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      topCustomer: topCustomerName,
    },
    tools: {
      totalTools: tools.length,
      onsite: onsiteTools,
      available: availableTools,
      maintenance: maintenanceTools,
      utilizationRate: tools.length ? `${Math.round(onsiteTools / tools.length * 100)}%` : '0%',
      topCategory: (() => {
        const counts: Record<string, number> = {};
        tools.forEach(t => { if (t.category) counts[t.category] = (counts[t.category] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : '—';
      })(),
    },
    customers: {
      totalCustomers: customers.length,
      activeCustomers,
      inactiveCustomers: customers.length - activeCustomers,
      totalOrders: orders.length,
      avgOrdersPerCustomer: customers.length ? (orders.length / customers.length).toFixed(1) : '0',
      topCustomer: topCustomerName,
    },
    inventory: {
      totalItems: inventory.length,
      lowStock: lowStockItems,
      totalQuantity: inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      topCategory: (() => {
        const counts: Record<string, number> = {};
        inventory.forEach(i => { if (i.category) counts[i.category] = (counts[i.category] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : '—';
      })(),
    },
    maintenance: {
      totalTools: tools.length,
      overdue: overdueTools,
      underMaintenance: maintenanceTools,
      ok: tools.length - overdueTools - maintenanceTools,
      dueSoon: tools.filter(t => {
        if (!t.nextMaintenanceDate) return false;
        const days = Math.ceil((new Date(t.nextMaintenanceDate).getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 30;
      }).length,
    },
  };

  // Real chart data
  const buildToolCategoryChart = () => {
    const cats: Record<string, { Onsite: number; Available: number }> = {};
    tools.forEach(t => {
      const cat = t.category || 'Other';
      if (!cats[cat]) cats[cat] = { Onsite: 0, Available: 0 };
      if (t.status === 'onsite') cats[cat].Onsite++;
      else if (t.status === 'available') cats[cat].Available++;
    });
    return Object.entries(cats).slice(0, 8).map(([name, v]) => ({ name, ...v }));
  };

  const buildOrderStatusChart = () => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, Count]) => ({ name: name.replace('_', ' '), Count }));
  };

  const buildCustomerOrderChart = () => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { if (o.customer?.name) counts[o.customer.name] = (counts[o.customer.name] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, Value]) => ({ name, Value }));
  };

  const buildInventoryCategoryChart = () => {
    const cats: Record<string, number> = {};
    inventory.forEach(i => { const c = i.category || 'Other'; cats[c] = (cats[c] || 0) + (Number(i.quantity) || 0); });
    return Object.entries(cats).slice(0, 8).map(([name, Quantity]) => ({ name, Quantity }));
  };

  const buildMaintenanceChart = () => [
    { name: 'Overdue', Count: overdueTools },
    { name: 'Due Soon', Count: aggregateData.maintenance?.dueSoon || 0 },
    { name: 'OK', Count: (aggregateData.maintenance?.ok || 0) },
    { name: 'Under Maint.', Count: maintenanceTools },
  ];

  const chartData: Record<string, any[]> = {
    orders: buildOrderStatusChart().length > 0 ? buildOrderStatusChart() : [{ name: 'No data', Count: 0 }],
    tools: buildToolCategoryChart().length > 0 ? buildToolCategoryChart() : [{ name: 'No data', Onsite: 0, Available: 0 }],
    customers: buildCustomerOrderChart().length > 0 ? buildCustomerOrderChart() : [{ name: 'No data', Value: 0 }],
    inventory: buildInventoryCategoryChart().length > 0 ? buildInventoryCategoryChart() : [{ name: 'No data', Quantity: 0 }],
    maintenance: buildMaintenanceChart(),
  };

  const currentData = aggregateData[selectedReportType] || aggregateData.orders;
  const currentChartData = chartData[selectedReportType] || chartData.orders;

  const renderChart = () => {
    switch (selectedReportType) {
      case 'orders':
      case 'financial':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVal2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
              <Legend />
              <Area type="monotone" dataKey={Object.keys(currentChartData[0])[1]} stroke={COLORS[0]} fillOpacity={1} fill="url(#colorVal1)" />
              <Area type="monotone" dataKey={Object.keys(currentChartData[0])[2]} stroke={COLORS[1]} fillOpacity={1} fill="url(#colorVal2)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'tools':
      case 'inventory':
      case 'maintenance':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey={selectedReportType === 'inventory' ? 'month' : 'name'} stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
              <Legend />
              <Bar dataKey={Object.keys(currentChartData[0])[1]} fill={COLORS[0]} radius={[6, 6, 0, 0]} />
              <Bar dataKey={Object.keys(currentChartData[0])[2]} fill={COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'customers':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={currentChartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="Value">
                {currentChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-2 w-full gap-4">
          <div className="relative">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-bodydark2 mt-1">
              Data-Driven Strategic Insights
            </p>
          </div>
          <div className="flex gap-3 xl:ml-auto">
            <button className="px-5 py-2.5 glass-premium dark:bg-boxdark/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group border border-white/20">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Export CSV</span>
            </button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2">
              <svg className="w-4 h-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="tracking-wide">Download PDF</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in-up">
        
        {/* Report Type Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportType(report.id)}
              className={`p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden group ${
                selectedReportType === report.id
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_20px_rgba(37,99,235,0.4)] text-white border-none transform -translate-y-1 scale-105 z-10'
                : 'glass-premium dark:bg-boxdark/60 border border-white/20 dark:border-white/5 hover:bg-white dark:hover:bg-boxdark hover:shadow-lg text-slate-700 dark:text-slate-300'
              }`}
            >
              {selectedReportType === report.id && (
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
              <div className={`text-3xl mb-2 drop-shadow-sm ${selectedReportType === report.id ? 'animate-bounce-slight' : 'group-hover:scale-110 transition-transform'}`}>
                {report.icon}
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">{report.name.replace(' Report', '')}</h3>
            </button>
          ))}
        </div>

        {/* Dynamic Dashboard Section */}
        <div className="glass-premium dark:bg-boxdark/90 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] pointer-events-none"></div>
          
          <div className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  {reportTypes.find((r) => r.id === selectedReportType)?.name}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {reportTypes.find((r) => r.id === selectedReportType)?.description}
                </p>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-emerald-100/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Updates Active
              </div>
            </div>

            {/* Metric Cards Top Row */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {Object.entries(currentData).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white/40 dark:bg-[#1E293B]/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 transition-all hover:bg-white/60 dark:hover:bg-[#1E293B] hover:shadow-md group"
                >
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-widest">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Split: Chart & Data */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Main Chart Area */}
              <div className="lg:col-span-2 bg-white/30 dark:bg-[#0F172A]/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-800 p-6 flex flex-col h-[450px]">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Trending Analytics
                </h3>
                <div className="flex-1 w-full relative">
                  {renderChart()}
                </div>
              </div>

              {/* Detail Table Area */}
              <div className="bg-white/30 dark:bg-[#0F172A]/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-800 p-6 flex flex-col h-[450px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Data Explorer
                  </h3>
                  <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-200/50 dark:hover:bg-blue-500/20 uppercase tracking-wider transition-colors">
                    View Full
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {currentChartData.map((row, idx) => {
                    const keys = Object.keys(row);
                    const titleKey = keys[0];
                    const valKeys = keys.slice(1);
                    return (
                      <div key={idx} className="bg-white/60 dark:bg-boxdark/60 border border-slate-200/50 dark:border-strokedark/50 rounded-xl p-3 flex justify-between items-center hover:bg-white dark:hover:bg-meta-4 hover:shadow-sm transition-all">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{row[titleKey]}</span>
                        <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {valKeys.map(k => (
                            <div key={k} className="flex flex-col items-end">
                              <span className="text-[9px] uppercase tracking-widest">{k}</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{row[k]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
