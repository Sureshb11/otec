import { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { apiClient } from '../api/apiClient';
import { fmtKwDate, fmtKwDateTime } from '../utils/kuwaitTime';
import { useAuthStore } from '../store/authStore';
import EditOrderModal from '../components/EditOrderModal';

// Define chart colors for the premium aesthetic
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('orders');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);
  const [columns, setColumns] = useState({
    orderNo: true,
    bookedDate: true,
    transitDate: true,
    startedDate: true,
    returnedDate: true,
    customer: true,
    rig: true,
    status: true,
    amount: true
  });
  const [tools, setTools] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const isAdmin = useAuthStore((s) => s.isAdmin)();

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

  const refetchOrders = useCallback(async () => {
    const o = await apiClient.orders.getAll().catch(() => []);
    setOrders(Array.isArray(o) ? o : []);
  }, []);

  const reportTypes = [
    { id: 'orders', name: 'Orders Report', icon: 'orders', description: 'View order statistics and analytics' },
    { id: 'tools', name: 'Tools Report', icon: 'tools', description: 'Track tool usage and availability' },
    { id: 'customers', name: 'Customers Report', icon: 'customers', description: 'Customer activity and insights' },
    { id: 'inventory', name: 'Inventory Report', icon: 'inventory', description: 'Inventory levels and movements' },
    { id: 'maintenance', name: 'Maintenance Report', icon: 'maintenance', description: 'Maintenance schedules and history' },
    { id: 'detailed_orders', name: 'Detailed Orders', icon: 'detailed_orders', description: 'Filter and print detailed order list by date' },
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

  const filteredDetailedOrders = useMemo(() => {
    return orders.filter(o => {
      if (!fromDate && !toDate) return true;
      const orderDate = new Date(o.createdAt || o.startDate);
      // Strip time for fair comparison
      orderDate.setHours(0,0,0,0);

      const fDate = fromDate ? new Date(fromDate) : null;
      if (fDate) fDate.setHours(0,0,0,0);
      
      const tDate = toDate ? new Date(toDate) : null;
      if (tDate) tDate.setHours(23,59,59,999);

      if (fDate && tDate) return orderDate >= fDate && orderDate <= tDate;
      if (fDate) return orderDate >= fDate;
      if (tDate) return orderDate <= tDate;
      return true;
    }).sort((a,b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
  }, [orders, fromDate, toDate]);

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
            <button className="px-5 py-2.5 glass-premium dark:bg-boxdark/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group border border-white/20 print:hidden">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Export CSV</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2 print:hidden"
            >
              <svg className="w-4 h-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="tracking-wide">Print Report</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in-up">
        
        {/* Report Type Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:hidden">
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
              <div className={`mb-2 drop-shadow-sm ${selectedReportType === report.id ? 'animate-bounce-slight' : 'group-hover:scale-110 transition-transform'}`}>
                {report.icon === 'orders' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                {report.icon === 'tools' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                {report.icon === 'customers' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                {report.icon === 'inventory' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                {report.icon === 'maintenance' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                {report.icon === 'detailed_orders' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">{report.name.replace(' Report', '')}</h3>
            </button>
          ))}
        </div>

        {selectedReportType === 'detailed_orders' ? (
          <div className="glass-premium dark:bg-boxdark/90 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative p-8 print:absolute print:inset-0 print:-m-12 print:w-[100vw] print:h-[100vh] print:bg-white print:text-black print:z-[999999] print:shadow-none print:border-none print:overflow-visible">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 print:mb-2 border-b border-white/10 pb-4 print:border-black print:pb-2 gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white print:text-black">Detailed Orders Report</h2>
                <div className="hidden print:block mt-2 text-sm">
                  <p><strong>Report Date:</strong> {fmtKwDate(new Date())}</p>
                  <p><strong>Filter:</strong> {fromDate || 'Start'} to {toDate || 'End'}</p>
                </div>
              </div>
              <div className="flex gap-4 print:hidden items-end relative">
                  <div className="relative">
                    <button 
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                      className="p-2 mb-1 rounded-lg border border-slate-200 dark:border-strokedark dark:bg-boxdark hover:bg-slate-50 dark:hover:bg-meta-4 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                      Columns
                    </button>
                    {showColumnMenu && (
                      <div className="absolute top-full right-0 lg:left-0 lg:right-auto z-50 mt-2 w-48 bg-white dark:bg-boxdark border border-slate-200 dark:border-strokedark rounded-xl shadow-xl overflow-hidden">
                        <div className="p-3 bg-slate-50 dark:bg-meta-4 border-b border-slate-200 dark:border-strokedark text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">Visible Fields</div>
                        <div className="p-2 max-h-64 overflow-y-auto flex flex-col gap-1">
                          {Object.entries(columns).map(([key, val]) => (
                            <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-meta-4 rounded-lg cursor-pointer">
                              <input type="checkbox" checked={val} onChange={() => setColumns(p => ({ ...p, [key]: !p[key as keyof typeof columns] }))} className="rounded text-primary-500 focus:ring-primary-500 bg-transparent border-slate-300 dark:border-strokedark" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">From Date</label>
                    <input type="date" className="p-2 rounded-lg border border-slate-200 dark:border-strokedark dark:bg-boxdark focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold mb-1 text-slate-500 dark:text-slate-400">To Date</label>
                    <input type="date" className="p-2 rounded-lg border border-slate-200 dark:border-strokedark dark:bg-boxdark focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
              </div>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-sm print:text-[11px] print:leading-tight border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 print:border-black text-slate-600 dark:text-slate-300 print:text-black whitespace-nowrap">
                    {columns.orderNo && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Order No</th>}
                    {columns.bookedDate && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Booked Date</th>}
                    {columns.transitDate && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Transit Date</th>}
                    {columns.startedDate && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Started Date</th>}
                    {columns.returnedDate && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Return Date</th>}
                    {columns.customer && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Customer</th>}
                    {columns.rig && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Location/Rig</th>}
                    {columns.status && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-[10px]">Status</th>}
                    {columns.amount && <th className="py-4 px-4 print:py-2 print:px-2 font-black tracking-widest uppercase text-right text-[10px]">Amount</th>}
                    {isAdmin && <th className="py-4 px-4 font-black tracking-widest uppercase text-center text-[10px] print:hidden">Edit</th>}
                  </tr>
                </thead>
                <tbody className="print:text-black">
                  {filteredDetailedOrders.map(order => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800/50 print:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors text-[13px] print:text-[10px]">
                      {columns.orderNo && <td className="py-3 px-4 print:py-1.5 print:px-2 font-bold text-slate-700 dark:text-slate-200 print:text-black whitespace-nowrap">{order.orderNumber}</td>}
                      {columns.bookedDate && <td className="py-3 px-4 print:py-1.5 print:px-2 text-slate-500 dark:text-slate-400 print:text-black whitespace-nowrap">{fmtKwDateTime(order.createdAt)}</td>}
                      {columns.transitDate && <td className="py-3 px-4 print:py-1.5 print:px-2 text-slate-500 dark:text-slate-400 print:text-black whitespace-nowrap">{fmtKwDateTime(order.startDate)}</td>}
                      {columns.startedDate && <td className="py-3 px-4 print:py-1.5 print:px-2 text-slate-500 dark:text-slate-400 print:text-black whitespace-nowrap">{fmtKwDateTime(order.activatedAt)}</td>}
                      {columns.returnedDate && <td className="py-3 px-4 print:py-1.5 print:px-2 text-slate-500 dark:text-slate-400 print:text-black whitespace-nowrap">{fmtKwDateTime(order.returnedAt)}</td>}
                      {columns.customer && <td className="py-3 px-4 print:py-1.5 print:px-2 font-medium text-slate-700 dark:text-slate-300 print:text-black min-w-[120px]">{order.customer?.name || '—'}</td>}
                      {columns.rig && <td className="py-3 px-4 print:py-1.5 print:px-2 text-slate-500 dark:text-slate-400 print:text-black min-w-[100px]">{order.rig?.name || order.location?.name || '—'}</td>}
                      {columns.status && <td className="py-3 px-4 print:py-1.5 print:px-2 print:text-black">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider print:border print:border-slate-300 print:bg-transparent print:text-black ${
                          order.status === 'job_done' || order.status === 'returned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          order.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>}
                      {columns.amount && <td className="py-3 px-4 print:py-1.5 print:px-2 text-right font-bold text-slate-700 dark:text-slate-200 print:text-black whitespace-nowrap">
                        {Number(order.totalAmount || 0) > 0 ? Number(order.totalAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
                      </td>}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center print:hidden">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edit order"
                            aria-label="Edit order"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredDetailedOrders.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-12 text-slate-500 dark:text-slate-400 print:text-black font-medium">
                        No orders found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="hidden print:block mt-8 text-right text-xs pt-4 border-t border-slate-300 font-medium text-black">
              Printed from OTEC Advanced Management System | {fmtKwDateTime(new Date())}
            </div>
          </div>
        ) : (
        <div className="glass-premium dark:bg-boxdark/90 rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative print:hidden">
          {/* Dynamic Dashboard Section */}
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
        )}
      </div>

      {editingOrder && (
        <EditOrderModal
          order={{
            id: editingOrder.id,
            orderNumber: editingOrder.orderNumber,
            status: editingOrder.status,
            startDate: editingOrder.startDate,
            endDate: editingOrder.endDate,
            totalAmount: editingOrder.totalAmount,
            wellNumber: editingOrder.wellNumber,
            notes: editingOrder.notes,
          }}
          onClose={() => setEditingOrder(null)}
          onSaved={refetchOrders}
        />
      )}
    </MainLayout>
  );
};

export default Reports;
