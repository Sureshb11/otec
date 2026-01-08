import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

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
  status: 'Booked' | 'Drafted' | 'Rented Out' | 'Returned' | 'Cancelled';
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
  const { user } = useAuthStore();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOperationsMenu, setShowOperationsMenu] = useState(false);
  const [showClientsMenu, setShowClientsMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState('Quote');
  const [printTemplate, setPrintTemplate] = useState('EZRentOut Default Template');
  const [isPrinting, setIsPrinting] = useState(false);
  const [showChargePaymentModal, setShowChargePaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [useCurrentDate, setUseCurrentDate] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('168.30');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentComments, setPaymentComments] = useState('');
  const [isCharging, setIsCharging] = useState(false);
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
      case 'Returned':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar - Same as Dashboard */}
        <div className="w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 h-screen shadow-2xl flex flex-col">
          <div className="p-4 flex flex-col h-full">
            {/* OTEC Logo - Replace /logo.png with your actual logo file path */}
            <div className="mb-6 flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="OTEC Logo" 
                className="w-full h-auto object-contain bg-white rounded-lg p-2"
              />
            </div>
            
            <nav className="space-y-1 flex-1 min-h-0 overflow-visible">
              {/* Navigation - unified across app */}
              {/* 1. Dashboard */}
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>

              {/* 2. Operations -> Tools, Inventory */}
              <div className="relative">
                <button
                  onClick={() => setShowOperationsMenu(!showOperationsMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    <span>Operations</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      showOperationsMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showOperationsMenu && (
                  <div className="mt-1 ml-4 space-y-1 max-h-48 overflow-y-auto">
                  <Link
                    to="/operations/tools"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0l.517 2.13a1 1 0 00.76.743l2.18.436c1.79.358 2.513 2.554 1.26 3.807l-1.54 1.54a1 1 0 00-.293.707V18a2 2 0 01-2 2h-1.5a1 1 0 01-.707-.293l-1.54-1.54a1 1 0 00-.707-.293H9a2 2 0 01-2-2v-1.542a1 1 0 00-.293-.707l-1.54-1.54C3.914 11.68 4.637 9.484 6.427 9.126l2.18-.436a1 1 0 00.76-.743l.958-3.63z"
                      />
                    </svg>
                    <span>Tools</span>
                  </Link>
                  <Link
                    to="/operations/inventory"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7l9-4 9 4-9 4-9-4z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10l9 4 9-4V7"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10l6 3"
                      />
                    </svg>
                    <span>Inventory</span>
                  </Link>
                  </div>
                )}
              </div>

              {/* 3. Orders */}
              <Link
                to="/orders"
                className="flex items-center space-x-3 px-4 py-3 bg-primary-700 text-white rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Orders</span>
              </Link>

              {/* 4. Clients with submenu */}
              <div className="relative">
                <button
                  onClick={() => setShowClientsMenu(!showClientsMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Clients</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      showClientsMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showClientsMenu && (
                  <div className="mt-1 ml-4 space-y-1 max-h-48 overflow-y-auto">
                    <Link
                      to="/clients/customers"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Customers</span>
                    </Link>
                    <Link
                      to="/clients/locations"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Locations</span>
                    </Link>
                    <Link
                      to="/clients/rigs"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Rigs</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reports */}
              <Link
                to="/reports"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Reports</span>
              </Link>

              {/* 5. Users */}
              <Link
                to="/users"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Users</span>
              </Link>
            </nav>

            {/* User Avatar - Fixed at bottom */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full shadow-lg ring-2 ring-primary-500/50 flex items-center justify-center mt-4 flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Orders</h1>
            
          </div>

          {/* Action Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowActionsMenu(!showActionsMenu);
                    setShowFilterMenu(false);
                    setShowTagsMenu(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                >
                  <span>ACTIONS</span>
                  <svg className={`w-4 h-4 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                {showActionsMenu && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowPrintModal(true);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                    >
                      <span>MASS PRINT ORDERS</span>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        // Handle route planning
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      ROUTE PLANNING
                    </button>
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowChargePaymentModal(true);
                        // Set default payment amount from selected orders or first order
                        if (selectedOrders.length > 0) {
                          const selectedOrder = orders.find(o => selectedOrders.includes(o.id));
                          if (selectedOrder) {
                            setPaymentAmount(selectedOrder.price.toFixed(2));
                          }
                        } else if (orders.length > 0) {
                          setPaymentAmount(orders[0].price.toFixed(2));
                        }
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      CHARGE PAYMENT
                    </button>
                    <button
                      onClick={() => {
                        // Handle change tax rate
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      CHANGE TAX RATE
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
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
                    >
                      MASS DELETE ORDERS
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Orders"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFilterMenu(!showFilterMenu);
                    setShowActionsMenu(false);
                    setShowTagsMenu(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>Filter</span>
                  <svg className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFilterMenu && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
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
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTagsMenu(!showTagsMenu);
                    setShowActionsMenu(false);
                    setShowFilterMenu(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Tags</span>
                  <svg className={`w-4 h-4 transition-transform ${showTagsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTagsMenu && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Filter by Tags</div>
                      <div className="text-sm text-gray-600 p-2">No tags available</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200"
              >
                + ADD NEW ORDER
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                EXPORT ALL TO CSV
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                    <tr key={order.id} className="hover:bg-gray-50">
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
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Summary */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Displaying all {filteredOrders.length} {filteredOrders.length === 1 ? 'basket' : 'baskets'}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900">Contact Us</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Contact Support</a>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              © 2025 OTEC. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <button className="w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full shadow-lg hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* Print Order Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Print Order</h2>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setIsPrinting(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* What do you want to print? */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to print?
                </label>
                <div className="relative">
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                  >
                    <option value="Quote">Quote</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Rental Agreement">Rental Agreement</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Packing List">Packing List</option>
                    <option value="Delivery Slip">Delivery Slip</option>
                    <option value="Pickup Slip">Pickup Slip</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Choose a template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a template
                </label>
                <div className="relative">
                  <select
                    value={printTemplate}
                    onChange={(e) => setPrintTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                  >
                    <option value="EZRentOut Default Template">EZRentOut Default Template</option>
                    <option value="Custom Template 1">Custom Template 1</option>
                    <option value="Custom Template 2">Custom Template 2</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> It seems your business doesn't have an address recorded into OTEC. Do add one (Settings → Company Settings → Company Profile), it helps make your invoices look more professional.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setIsPrinting(false);
                }}
                disabled={isPrinting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setIsPrinting(true);
                  // Simulate printing process
                  setTimeout(() => {
                    setIsPrinting(false);
                    setShowPrintModal(false);
                    alert(`Printing ${selectedOrders.length || filteredOrders.length} order(s) as ${printType}...`);
                  }, 2000);
                }}
                disabled={isPrinting}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPrinting ? 'PLEASE WAIT' : 'PRINT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charge Payment Modal */}
      {showChargePaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Payments</h2>
              <button
                onClick={() => {
                  setShowChargePaymentModal(false);
                  setIsCharging(false);
                  setPaymentDate('');
                  setUseCurrentDate(false);
                  setPaymentComments('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={useCurrentDate ? new Date().toISOString().split('T')[0] : paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      disabled={useCurrentDate}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={useCurrentDate}
                    onChange={(e) => {
                      setUseCurrentDate(e.target.checked);
                      if (e.target.checked) {
                        setPaymentDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Use current date</span>
                </label>
              </div>

              {/* Amount to be Charged */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to be Charged
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${selectedOrders.length > 0 
                    ? orders.filter(o => selectedOrders.includes(o.id)).reduce((sum, o) => sum + o.price, 0).toFixed(2)
                    : orders.length > 0 
                    ? orders[0].price.toFixed(2)
                    : '0.00'}
                </div>
              </div>

              {/* Order Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Order Details</h3>
                {selectedOrders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.filter(o => selectedOrders.includes(o.id)).map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Order#{order.orderNumber}</span>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              {order.status}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Past Order
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Payable Amount: <span className="font-semibold text-gray-900">${order.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Order#{orders[0].orderNumber}</span>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          {orders[0].status}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Past Order
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Payable Amount: <span className="font-semibold text-gray-900">${orders[0].price.toFixed(2)}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Payment Entry */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Entry</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={paymentComments}
                    onChange={(e) => setPaymentComments(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add any comments about this payment..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowChargePaymentModal(false);
                  setIsCharging(false);
                  setPaymentDate('');
                  setUseCurrentDate(false);
                  setPaymentComments('');
                }}
                disabled={isCharging}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (!paymentDate && !useCurrentDate) {
                    alert('Please select a payment date');
                    return;
                  }
                  if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
                    alert('Please enter a valid payment amount');
                    return;
                  }
                  setIsCharging(true);
                  // Simulate payment processing
                  setTimeout(() => {
                    setIsCharging(false);
                    setShowChargePaymentModal(false);
                    alert(`Payment of $${paymentAmount} charged successfully via ${paymentMethod}`);
                    setPaymentDate('');
                    setUseCurrentDate(false);
                    setPaymentComments('');
                  }, 2000);
                }}
                disabled={isCharging}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCharging ? 'PROCESSING...' : 'CHARGE PAYMENT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col m-4 animate-slideUp transform">
            {/* Header - Single Line */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create New Order</h2>
              <button
                onClick={handleCancelOrder}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              <div className="space-y-4">
                {/* Customer Selection */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 whitespace-nowrap w-32">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span>Customer</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group flex-1">
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className={`w-full px-4 py-2.5 pl-10 pr-10 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-primary-400 group-hover:shadow-md text-sm font-medium ${
                          selectedCustomer ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 whitespace-nowrap w-32">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>Location</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group flex-1">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className={`w-full px-4 py-2.5 pl-10 pr-10 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-primary-400 group-hover:shadow-md text-sm font-medium ${
                          selectedLocation ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <option value="">Select a location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rig Selection */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 whitespace-nowrap w-32">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>Rig</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group flex-1">
                      <select
                        value={selectedRig}
                        onChange={(e) => setSelectedRig(e.target.value)}
                        className={`w-full px-4 py-2.5 pl-10 pr-10 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer hover:border-primary-400 group-hover:shadow-md text-sm font-medium ${
                          selectedRig ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <option value="">Select a rig</option>
                        {rigs.map((rig) => (
                          <option key={rig.id} value={rig.id}>
                            {rig.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tools Selection */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 whitespace-nowrap w-32">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0l.517 2.13a1 1 0 00.76.743l2.18.436c1.79.358 2.513 2.554 1.26 3.807l-1.54 1.54a1 1 0 00-.293.707V18a2 2 0 01-2 2h-1.5a1 1 0 01-.707-.293l-1.54-1.54a1 1 0 00-.707-.293H9a2 2 0 01-2-2v-1.542a1 1 0 00-.293-.707l-1.54-1.54C3.914 11.68 4.637 9.484 6.427 9.126l2.18-.436a1 1 0 00.76-.743l.958-3.63z" />
                        </svg>
                      </div>
                      <span>Tools</span>
                      <span className="text-red-500">*</span>
                    </label>
                    {/* Search Input for Tools */}
                    <div className="relative group flex-1">
                      <input
                        type="text"
                        placeholder="Search tools by name or group..."
                        value={toolSearchTerm}
                        onChange={(e) => setToolSearchTerm(e.target.value)}
                        className="w-full px-3 py-2.5 pl-9 pr-9 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white group-hover:border-primary-400 text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {toolSearchTerm && (
                        <button
                          onClick={() => setToolSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {selectedTools.length > 0 && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                        {selectedTools.length} {selectedTools.length === 1 ? 'tool' : 'tools'}
                      </span>
                    )}
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
                    {(trsTools.length > 0 || dhtTools.length > 0) ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* TRS Column */}
                        <div className="space-y-2">
                          {trsTools.length > 0 && (
                            <div className="sticky top-0 bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-2 rounded-lg mb-2 border border-blue-300">
                              <h4 className="text-xs font-bold text-blue-800 uppercase">TRS Tools</h4>
                            </div>
                          )}
                          {trsTools.map((tool) => {
                            const isSelected = selectedTools.includes(tool.id);
                            return (
                              <label
                                key={tool.id}
                                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-400 shadow-md'
                                    : 'bg-white border-2 border-transparent hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                                }`}
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleTool(tool.id)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-medium flex-1 ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                                  {tool.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        {/* DHT Column */}
                        <div className="space-y-2">
                          {dhtTools.length > 0 && (
                            <div className="sticky top-0 bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-2 rounded-lg mb-2 border border-purple-300">
                              <h4 className="text-xs font-bold text-purple-800 uppercase">DHT Tools</h4>
                            </div>
                          )}
                          {dhtTools.map((tool) => {
                            const isSelected = selectedTools.includes(tool.id);
                            return (
                              <label
                                key={tool.id}
                                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-400 shadow-md'
                                    : 'bg-white border-2 border-transparent hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                                }`}
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleTool(tool.id)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-medium flex-1 ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                                  {tool.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 animate-fadeIn">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 font-medium">No tools found matching "{toolSearchTerm}"</p>
                        <button
                          onClick={() => setToolSearchTerm('')}
                          className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
            
            {/* Footer with Action Buttons */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {selectedCustomer && selectedLocation && selectedRig && selectedTools.length > 0 ? (
                    <span className="flex items-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>All fields completed</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Please fill in all required fields</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCancelOrder}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookOrder}
                    disabled={!selectedCustomer || !selectedLocation || !selectedRig || selectedTools.length === 0}
                    className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-semibold hover:from-primary-500 hover:to-primary-600 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm Book</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

