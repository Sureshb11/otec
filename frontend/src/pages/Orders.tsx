import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import MainLayout from '../components/MainLayout';
import { format } from 'date-fns';
import { getToolCategorySizes } from '../utils/toolCategorySizes';

const Orders = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // New Order Modal State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRig, setSelectedRig] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<{ toolId: string, size: string }[]>([]);
  const [toolSearchTerm, setToolSearchTerm] = useState<string>('');

  // 1. Fetch Data
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: apiClient.orders.getAll,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: apiClient.customers.getAll,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: apiClient.locations.getAll,
  });

  const { data: rigs = [] } = useQuery({
    queryKey: ['rigs'],
    queryFn: apiClient.rigs.getAll,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: apiClient.tools.getAll,
  });

  // 2. Mutations
  const createOrderMutation = useMutation({
    mutationFn: apiClient.orders.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setShowNewOrderModal(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    },
  });

  const resetForm = () => {
    setSelectedCustomer('');
    setSelectedLocation('');
    setSelectedRig('');
    setSelectedTools([]);
    setToolSearchTerm('');
  };

  const handleToggleTool = (toolId: string, toolName: string) => {
    setSelectedTools(prev => {
      const isSelected = prev.some(item => item.toolId === toolId);
      if (isSelected) {
        return prev.filter(item => item.toolId !== toolId);
      } else {
        const availableSizes = getToolCategorySizes(toolName);
        const defaultSize = availableSizes && availableSizes.length > 0 ? availableSizes[0] : '';
        return [...prev, { toolId, size: defaultSize }];
      }
    });
  };

  const handleToolSizeChange = (toolId: string, newSize: string) => {
    setSelectedTools(prev => prev.map(item => item.toolId === toolId ? { ...item, size: newSize } : item));
  };

  const handleBookOrder = () => {
    if (!selectedCustomer || !selectedLocation || !selectedRig || selectedTools.length === 0) {
      alert('Please fill in all required fields: Customer, Location, Rig, and at least one Tool');
      return;
    }

    const orderData = {
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`, // Temporary generation
      customerId: selectedCustomer,
      locationId: selectedLocation,
      rigId: selectedRig,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days default
      status: 'booked', // Booked OrderStatus
      items: selectedTools.map(item => ({
        toolId: item.toolId,
        size: item.size || undefined,
        quantity: 1
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  const handleCancelOrder = () => {
    setShowNewOrderModal(false);
    resetForm();
  };

  const filteredTools = Array.isArray(tools) ? tools.filter((tool: any) =>
    tool.name.toLowerCase().includes(toolSearchTerm.toLowerCase()) ||
    (tool.type && tool.type.toLowerCase().includes(toolSearchTerm.toLowerCase()))
  ) : [];

  // Group tools by TRS and DHT (assuming 'type' field holds this, based on backend entity)
  const trsTools = filteredTools.filter((tool: any) => tool.type === 'TRS');
  const dhtTools = filteredTools.filter((tool: any) => tool.type === 'DHT');

  // Filter Orders
  const filteredOrders = Array.isArray(orders) ? orders.filter((order: any) => {
    const customerName = order.customer?.name || '';
    const orderNum = order.orderNumber || '';
    const search = searchTerm.toLowerCase();
    return customerName.toLowerCase().includes(search) || orderNum.toString().toLowerCase().includes(search);
  }) : [];


  // Kanban Status Columns Mapping
  // Backend Statuses: draft, booked, active, job_done, returned, cancelled
  const columns = [
    {
      ids: ['draft', 'pending'], id: 'draft', title: 'Drafts', color: 'gray', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      )
    },
    {
      ids: ['booked', 'confirmed'], id: 'booked', title: 'Booked', color: 'blue', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )
    },
    {
      ids: ['active', 'in-progress'], id: 'active', title: 'Active / Onsite', color: 'green', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      ids: ['job_done', 'completed'], id: 'job_done', title: 'Job done and Return', color: 'purple', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
  ];

  if (isLoadingOrders) {
    return (
      <MainLayout headerContent={<div>Loading Orders...</div>}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between w-full gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Orders Pipeline</h1>
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
              Visual overview of order status from Draft to Return.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:ml-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 w-64 shadow-sm bg-white/80 dark:bg-boxdark dark:text-white transition-all duration-200"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            <button
              onClick={() => setShowNewOrderModal(true)}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              New Order
            </button>
          </div>
        </div>
      }
    >
      <div className="h-[calc(100vh-140px)] pb-4">
        {/* Kanban Board Container */}
        <div className="flex gap-6 h-full w-full">
          {columns.map((column) => (
            <div key={column.id} className="flex-1 flex flex-col h-full min-w-0">
              {/* Column Header */}
              <div className={`flex items-center justify-between mb-4 p-3.5 rounded-xl glass-premium dark:bg-boxdark/80 border border-white/20 dark:border-white/5 shadow-sm
                ${column.color === 'gray' ? 'border-l-4 border-l-slate-400' :
                  column.color === 'blue' ? 'border-l-4 border-l-blue-500' :
                    column.color === 'green' ? 'border-l-4 border-l-emerald-500' :
                      'border-l-4 border-l-violet-500'
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${column.color === 'gray' ? 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400' :
                    column.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                      column.color === 'green' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'
                    }`}>
                    {column.icon}
                  </div>
                  <h3 className="font-black text-sm text-slate-700 dark:text-slate-200 tracking-wide">{column.title}</h3>
                </div>
                <span className="bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg text-xs font-black text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100/50 dark:border-white/5">
                  {filteredOrders.filter((o: any) => column.ids.includes(o.status)).length}
                </span>
              </div>

              {/* Column Content (Droppable Area) */}
              <div className={`flex-1 rounded-2xl p-3 gap-3 flex flex-col overflow-y-auto custom-scrollbar transition-colors duration-300
                 ${column.color === 'gray' ? 'bg-slate-50/50 dark:bg-slate-800/20' :
                  column.color === 'blue' ? 'bg-blue-50/20 dark:bg-blue-900/10' :
                    column.color === 'green' ? 'bg-emerald-50/20 dark:bg-emerald-900/10' :
                      'bg-violet-50/20 dark:bg-violet-900/10'
                }`}>

                {filteredOrders.filter((o: any) => column.ids.includes(o.status)).map((order: any, idx: number) => (
                  <div
                    key={order.id}
                    className="animate-slideUp group glass-premium dark:bg-boxdark/80 rounded-xl p-4 shadow-md hover:shadow-lg cursor-pointer border border-white/20 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-700/30 transition-all duration-300 relative transform hover:-translate-y-0.5"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Order #{order.orderNumber}</span>
                        <h4 className="font-black text-slate-900 dark:text-white leading-tight mt-0.5 tracking-tight">{order.customer?.name || 'Unknown User'}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative group/action">
                          <button className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-meta-4 hover:text-slate-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50/80 dark:bg-boxdark-2/60 rounded-lg p-2.5 border border-slate-100/50 dark:border-white/5">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Rig</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">{order.rig?.name || '-'}</div>
                      </div>
                      <div className="bg-slate-50/80 dark:bg-boxdark-2/60 rounded-lg p-2.5 border border-slate-100/50 dark:border-white/5">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Location</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">{order.location?.name || '-'}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3 border-t border-slate-100/50 dark:border-white/5 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Start:</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{order.startDate ? format(new Date(order.startDate), 'dd MMM yyyy') : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">End:</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{order.endDate ? format(new Date(order.endDate), 'dd MMM yyyy') : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredOrders.filter((o: any) => column.ids.includes(o.status)).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200/30 dark:border-white/5 rounded-xl m-2">
                    <span className="text-2xl font-black opacity-20">0</span>
                    <span className="text-xs font-semibold">No Orders</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleCancelOrder} />
          <div className="relative glass-premium dark:bg-boxdark/95 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 border border-white/20 dark:border-white/5 animate-slideUp">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/30 dark:border-white/5 bg-white/40 dark:bg-boxdark-2/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">New Order</h3>
              <button
                onClick={handleCancelOrder}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-meta-4"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark1 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-strokedark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-transparent dark:text-white dark:bg-boxdark"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Location Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark1 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-strokedark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-transparent dark:text-white dark:bg-boxdark"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rig Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-bodydark1 mb-2">
                    Rig <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRig}
                    onChange={(e) => setSelectedRig(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-strokedark rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-transparent dark:text-white dark:bg-boxdark"
                  >
                    <option value="">Select Rig</option>
                    {rigs.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tool Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Tools <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={toolSearchTerm}
                    onChange={(e) => setToolSearchTerm(e.target.value)}
                    className="w-64 px-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border border-gray-200 dark:border-strokedark rounded-xl overflow-hidden">
                  <div className="flex border-b border-gray-100 dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/50">
                    <div className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-bodydark2 uppercase">Tool Name</div>
                    <div className="w-24 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-bodydark2 uppercase text-center">Select</div>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                    {/* TRS Tools Group */}
                    {trsTools.length > 0 && (
                      <div className="bg-gray-50 dark:bg-meta-4 px-4 py-1.5 text-xs font-bold text-gray-600 dark:text-bodydark1 uppercase">
                        TRS Tools
                      </div>
                    )}
                    {trsTools.map((tool: any) => {
                      const selectedItem = selectedTools.find(item => item.toolId === tool.id);
                      const availableSizes = getToolCategorySizes(tool.name);

                      return (
                        <div key={tool.id} className="flex items-center hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                          <div className="flex-1 px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center justify-between">
                            <span>{tool.name}</span>
                            {selectedItem && (
                              availableSizes && availableSizes.length > 0 ? (
                                <select
                                  value={selectedItem.size}
                                  onChange={(e) => handleToolSizeChange(tool.id, e.target.value)}
                                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-white dark:bg-boxdark appearance-none"
                                >
                                  {availableSizes.map(size => (
                                    <option key={size} value={size}>{size}"</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Size (e.g. 5&quot;)"
                                  value={selectedItem.size}
                                  onChange={(e) => handleToolSizeChange(tool.id, e.target.value)}
                                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-white dark:bg-boxdark"
                                />
                              )
                            )}
                          </div>
                          <div className="w-24 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedItem}
                              onChange={() => handleToggleTool(tool.id, tool.name)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* DHT Tools Group */}
                    {dhtTools.length > 0 && (
                      <div className="bg-gray-50 dark:bg-meta-4 px-4 py-1.5 text-xs font-bold text-gray-600 dark:text-bodydark1 uppercase">
                        DHT Tools
                      </div>
                    )}
                    {dhtTools.map((tool: any) => {
                      const selectedItem = selectedTools.find(item => item.toolId === tool.id);
                      const availableSizes = getToolCategorySizes(tool.name);

                      return (
                        <div key={tool.id} className="flex items-center hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                          <div className="flex-1 px-4 py-3 text-sm text-gray-900 dark:text-white flex items-center justify-between">
                            <span>{tool.name}</span>
                            {selectedItem && (
                              availableSizes && availableSizes.length > 0 ? (
                                <select
                                  value={selectedItem.size}
                                  onChange={(e) => handleToolSizeChange(tool.id, e.target.value)}
                                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-white dark:bg-boxdark appearance-none"
                                >
                                  {availableSizes.map(size => (
                                    <option key={size} value={size}>{size}"</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Size (e.g. 5&quot;)"
                                  value={selectedItem.size}
                                  onChange={(e) => handleToolSizeChange(tool.id, e.target.value)}
                                  className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-white dark:bg-boxdark"
                                />
                              )
                            )}
                          </div>
                          <div className="w-24 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedItem}
                              onChange={() => handleToggleTool(tool.id, tool.name)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500 text-right">
                  {selectedTools.length} tool(s) selected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/30 dark:border-white/5 bg-white/40 dark:bg-boxdark-2/80 backdrop-blur-md flex items-center justify-end space-x-3 flex-shrink-0">
              <button
                onClick={handleCancelOrder}
                className="px-5 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 transition-colors"
                disabled={createOrderMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleBookOrder}
                disabled={!selectedCustomer || !selectedLocation || !selectedRig || selectedTools.length === 0 || createOrderMutation.isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createOrderMutation.isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Orders;
