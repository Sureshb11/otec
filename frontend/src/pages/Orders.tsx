
import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

interface Order {
  id: string;
  orderNumber: number;
  customer: string;
  customerId: string;
  location?: string;
  locationId?: string;
  rig?: string;
  rigId?: string;
  tools?: string[];
  price: number;
  rentOutDate: string;
  returnDate: string;
  status: 'Booked' | 'Drafted' | 'Rented Out' | 'Started' | 'Returned' | 'Cancelled';
}

interface Customer {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface Rig {
  id: string;
  name: string;
}

interface Tool {
  id: string;
  name: string;
  group: string;
}

const Orders = () => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTagsMenu, setShowTagsMenu] = useState(false);

  // New Order Modal State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRig, setSelectedRig] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolSearchTerm, setToolSearchTerm] = useState<string>('');

  // Mock data - will be replaced with API calls later
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 2,
      customer: 'Sarah Smith',
      customerId: '1',
      price: 168.30,
      rentOutDate: '30-11-2025 01:16',
      returnDate: '05-12-2025 01:16',
      status: 'Booked',
    },
    {
      id: '2',
      orderNumber: 1,
      customer: 'Beau Douglas',
      customerId: '2',
      price: 280.50,
      rentOutDate: '30-12-2025 01:16',
      returnDate: '04-01-2026 01:16',
      status: 'Drafted',
    },
  ]);

  // Mock data for dropdowns
  const customers: Customer[] = [
    { id: '3', name: 'Kuwait Oil Company' },
  ];

  const locations: Location[] = [
    { id: '1', name: 'North Kuwait' },
    { id: '2', name: 'West Kuwait' },
    { id: '3', name: 'South East Kuwait' },
    { id: '4', name: 'Gas Field' },
  ];

  const rigs: Rig[] = Array.from({ length: 100 }, (_, i) => ({
    id: `rig-${i + 1}`,
    name: `Rig ${i + 1}`,
  }));

  const tools: Tool[] = [
    { id: 'trs-crt', name: 'CRT', group: 'TRS' },
    { id: 'trs-power-tong', name: 'POWER TONG', group: 'TRS' },
    { id: 'trs-jam-unit', name: 'JAM UNIT', group: 'TRS' },
    { id: 'trs-filup-tool', name: 'FILUP TOOL', group: 'TRS' },
    { id: 'trs-handling-tools', name: 'HANDLING TOOLS', group: 'TRS' },
    { id: 'dht-reamers', name: 'REAMERS', group: 'DHT' },
    { id: 'dht-anti-stick-slip', name: 'ANTI STICK SLIP', group: 'DHT' },
    { id: 'dht-scrapper', name: 'SCRAPPER', group: 'DHT' },
    { id: 'dht-jars', name: 'JARS', group: 'DHT' },
    { id: 'dht-control-valve', name: 'CONTROL VALVE', group: 'DHT' },
    { id: 'dht-torque-reducer', name: 'TORQUE REDUCER', group: 'DHT' },
  ];

  const filteredOrders = orders.filter(order =>
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toString().includes(searchTerm)
  );

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleBookOrder = () => {
    if (!selectedCustomer || !selectedLocation || !selectedRig || selectedTools.length === 0) {
      alert('Please fill in all required fields: Customer, Location, Rig, and at least one Tool');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    const location = locations.find(l => l.id === selectedLocation);
    const rig = rigs.find(r => r.id === selectedRig);
    const selectedToolNames = tools
      .filter(t => selectedTools.includes(t.id))
      .map(t => t.name);

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: orders.length > 0 ? Math.max(...orders.map(o => o.orderNumber)) + 1 : 1,
      customer: customer?.name || '',
      customerId: selectedCustomer,
      location: location?.name || '',
      locationId: selectedLocation,
      rig: rig?.name || '',
      rigId: selectedRig,
      tools: selectedToolNames,
      price: 0, // Will be calculated based on tools
      rentOutDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', ''),
      returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', ''),
      status: 'Booked',
    };

    setOrders([...orders, newOrder]);
    setShowNewOrderModal(false);
    setSelectedCustomer('');
    setSelectedLocation('');
    setSelectedRig('');
    setSelectedTools([]);
  };

  const handleCancelOrder = () => {
    setShowNewOrderModal(false);
    setSelectedCustomer('');
    setSelectedLocation('');
    setSelectedRig('');
    setSelectedTools([]);
    setToolSearchTerm('');
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(toolSearchTerm.toLowerCase()) ||
    tool.group.toLowerCase().includes(toolSearchTerm.toLowerCase())
  );

  // Group tools by TRS and DHT
  const trsTools = filteredTools.filter(tool => tool.group === 'TRS');
  const dhtTools = filteredTools.filter(tool => tool.group === 'DHT');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'Drafted':
        return 'bg-gray-100 text-gray-800';
      case 'Rented Out':
        return 'bg-blue-100 text-blue-800';
      case 'Started':
        return 'bg-green-100 text-green-800';
      case 'Returned':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent mb-2">
              Orders
            </h1>
            <p className="text-sm text-gray-500">Manage and track all your orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewOrderModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-500 hover:to-primary-600 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>ADD NEW ORDER</span>
            </button>
            <button className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:border-primary-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2 bg-white/80 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 relative z-10 w-full">
          <div className="flex items-center space-x-3 w-full">
            <div className="relative z-50">
              <button
                onClick={() => {
                  setShowActionsMenu(!showActionsMenu);
                  setShowFilterMenu(false);
                  setShowTagsMenu(false);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-500 hover:to-primary-600 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span>ACTIONS</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${showActionsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              {showActionsMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        // Handle rentout
                        if (selectedOrders.length === 0) {
                          alert('Please select order(s) to rent out');
                          setShowActionsMenu(false);
                          return;
                        }
                        if (window.confirm(`Are you sure you want to rent out ${selectedOrders.length} order(s)?`)) {
                          setOrders(prevOrders =>
                            prevOrders.map(order =>
                              selectedOrders.includes(order.id)
                                ? { ...order, status: 'Rented Out' as const }
                                : order
                            )
                          );
                          setSelectedOrders([]);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-blue-50 transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 text-primary-600 mr-2 group-hover:text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      RENTOUT
                    </button>
                    <button
                      onClick={() => {
                        // Handle start job
                        if (selectedOrders.length === 0) {
                          alert('Please select order(s) to start job');
                          setShowActionsMenu(false);
                          return;
                        }
                        if (window.confirm(`Start job for ${selectedOrders.length} order(s)?`)) {
                          setOrders(prevOrders =>
                            prevOrders.map(order =>
                              selectedOrders.includes(order.id)
                                ? { ...order, status: 'Started' as const }
                                : order
                            )
                          );
                          alert(`Job started for ${selectedOrders.length} order(s). Status updated to "Started".`);
                          setSelectedOrders([]);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 text-green-600 mr-2 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      START JOB
                    </button>
                    <button
                      onClick={() => {
                        // Handle stop job
                        if (selectedOrders.length === 0) {
                          alert('Please select order(s) to stop job');
                          setShowActionsMenu(false);
                          return;
                        }
                        if (window.confirm(`Stop job for ${selectedOrders.length} order(s)?`)) {
                          setOrders(prevOrders =>
                            prevOrders.map(order =>
                              selectedOrders.includes(order.id)
                                ? { ...order, status: 'Returned' as const }
                                : order
                            )
                          );
                          alert(`Job stopped for ${selectedOrders.length} order(s). Status updated to "Returned".`);
                          setSelectedOrders([]);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 text-red-600 mr-2 group-hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      STOP JOB
                    </button>
                    <button
                      onClick={() => {
                        // Handle cancel orders
                        if (selectedOrders.length === 0) {
                          alert('Please select order(s) to cancel');
                          setShowActionsMenu(false);
                          return;
                        }
                        if (window.confirm(`Are you sure you want to cancel ${selectedOrders.length} order(s)?`)) {
                          setOrders(prevOrders =>
                            prevOrders.map(order =>
                              selectedOrders.includes(order.id)
                                ? { ...order, status: 'Cancelled' as const }
                                : order
                            )
                          );
                          alert(`${selectedOrders.length} order(s) cancelled successfully.`);
                          setSelectedOrders([]);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 text-orange-600 mr-2 group-hover:text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      CANCEL
                    </button>
                    <button
                      onClick={() => {
                        // Handle mass delete
                        if (selectedOrders.length === 0) {
                          alert('Please select orders to delete');
                          setShowActionsMenu(false);
                          return;
                        }
                        if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) {
                          // Handle deletion
                          setSelectedOrders([]);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-b-xl transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 text-red-600 mr-2 group-hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      MASS DELETE ORDERS
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search Orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-primary-300"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="relative z-50">
              <button
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowActionsMenu(false);
                  setShowTagsMenu(false);
                }}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:border-primary-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2 bg-white/80 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filter</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${showFilterMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showFilterMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Filter by Status</div>
                    <label className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Booked</span>
                    </label>
                    <label className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Drafted</span>
                    </label>
                    <label className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Rented Out</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="relative z-50">
              <button
                onClick={() => {
                  setShowTagsMenu(!showTagsMenu);
                  setShowActionsMenu(false);
                  setShowFilterMenu(false);
                }}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:border-primary-300 hover:shadow-md transition-all duration-200 flex items-center space-x-2 bg-white/80 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Tags</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${showTagsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTagsMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Filter by Tags</div>
                    <div className="text-sm text-gray-600 p-2">No tags available</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ORDER #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CUSTOMER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PRICE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RENT OUT DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RETURN DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-blue-50/50 transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/customers/${order.customerId}`} className="text-primary-600 hover:text-primary-800">
                        {order.customer}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.rentOutDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.returnDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new order.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredOrders.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredOrders.length}</span> order{filteredOrders.length !== 1 && 's'}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={handleCancelOrder} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">New Order</h3>
              <button
                onClick={handleCancelOrder}
                className="text-gray-400 hover:text-gray-500 transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Location Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rig Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rig <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRig}
                    onChange={(e) => setSelectedRig(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Rig</option>
                    {rigs.map((r) => (
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

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex border-b border-gray-100 bg-gray-50/50">
                    <div className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Tool Name</div>
                    <div className="w-24 px-4 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Select</div>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                    {/* TRS Tools Group */}
                    {trsTools.length > 0 && (
                      <div className="bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-600 uppercase">
                        TRS Tools
                      </div>
                    )}
                    {trsTools.map((tool) => (
                      <div key={tool.id} className="flex items-center hover:bg-gray-50 transition-colors">
                        <div className="flex-1 px-4 py-3 text-sm text-gray-900">{tool.name}</div>
                        <div className="w-24 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes(tool.id)}
                            onChange={() => handleToggleTool(tool.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                          />
                        </div>
                      </div>
                    ))}

                    {/* DHT Tools Group */}
                    {dhtTools.length > 0 && (
                      <div className="bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-600 uppercase">
                        DHT Tools
                      </div>
                    )}
                    {dhtTools.map((tool) => (
                      <div key={tool.id} className="flex items-center hover:bg-gray-50 transition-colors">
                        <div className="flex-1 px-4 py-3 text-sm text-gray-900">{tool.name}</div>
                        <div className="w-24 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes(tool.id)}
                            onChange={() => handleToggleTool(tool.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500 text-right">
                  {selectedTools.length} tool(s) selected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end space-x-3 flex-shrink-0">
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookOrder}
                disabled={!selectedCustomer || !selectedLocation || !selectedRig || selectedTools.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Orders;
