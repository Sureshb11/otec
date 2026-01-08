import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type ToolGroupKey = 'TRS' | 'DHT';

interface Tool {
  id: string;
  name: string;
  group: ToolGroupKey;
  available: number;
}

const Inventory = () => {
  const { user } = useAuthStore();
  const [selectedGroup, setSelectedGroup] = useState<ToolGroupKey | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOperationsMenu, setShowOperationsMenu] = useState(true);
  const [showClientsMenu, setShowClientsMenu] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [newTool, setNewTool] = useState({
    name: '',
    group: 'TRS' as ToolGroupKey,
    available: 10,
  });

  const [tools, setTools] = useState<Tool[]>([
    { id: 'trs-crt', name: 'CRT', group: 'TRS', available: 10 },
    { id: 'trs-power-tong', name: 'POWER TONG', group: 'TRS', available: 10 },
    { id: 'trs-jam-unit', name: 'JAM UNIT', group: 'TRS', available: 10 },
    { id: 'trs-filup-tool', name: 'FILUP TOOL', group: 'TRS', available: 10 },
    { id: 'trs-handling-tools', name: 'HANDLING TOOLS', group: 'TRS', available: 10 },
    { id: 'dht-reamers', name: 'REAMERS', group: 'DHT', available: 10 },
    { id: 'dht-anti-stick-slip', name: 'ANTI STICK SLIP', group: 'DHT', available: 10 },
    { id: 'dht-scrapper', name: 'SCRAPPER', group: 'DHT', available: 10 },
    { id: 'dht-jars', name: 'JARS', group: 'DHT', available: 10 },
    { id: 'dht-control-valve', name: 'CONTROL VALVE', group: 'DHT', available: 10 },
    { id: 'dht-torque-reducer', name: 'TORQUE REDUCER', group: 'DHT', available: 10 },
  ]);

  const filteredTools = tools.filter(t => {
    const matchesGroup =
      selectedGroup === 'ALL' ? true : t.group === selectedGroup;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const totalCount = tools.reduce((sum, t) => sum + t.available, 0);

  const handleAddTool = () => {
    if (!newTool.name.trim()) {
      alert('Please enter a tool name');
      return;
    }

    const toolId = `${newTool.group.toLowerCase()}-${newTool.name.toLowerCase().replace(/\s+/g, '-')}`;
    const tool: Tool = {
      id: toolId,
      name: newTool.name.toUpperCase(),
      group: newTool.group,
      available: newTool.available || 0,
    };

    setTools([...tools, tool]);
    setNewTool({ name: '', group: 'TRS', available: 10 });
    setShowAddModal(false);
  };

  const handleEditQuantity = (tool: Tool) => {
    setEditingTool(tool);
    setEditQuantity(tool.available);
  };

  const handleUpdateQuantity = () => {
    if (editingTool && editQuantity >= 0) {
      setTools(
        tools.map(tool =>
          tool.id === editingTool.id ? { ...tool, available: editQuantity } : tool
        )
      );
      setEditingTool(null);
      setEditQuantity(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar - same navigation */}
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
              {/* Dashboard */}
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Dashboard</span>
              </Link>

              {/* Operations */}
              <div className="relative">
                <button
                  onClick={() => setShowOperationsMenu(!showOperationsMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7h18M3 12h18M3 17h18"
                      />
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
                          d="M7 7h.01M7 3h5a2 2 0 011.414.586l5 5a2 2 0 010 2.828l-7.586 7.586a2 2 0 01-2.828 0l-5-5A2 2 0 013 13V8a5 5 0 015-5z"
                        />
                      </svg>
                      <span>Tools</span>
                    </Link>
                    <Link
                      to="/operations/inventory"
                      className="flex items-center space-x-3 px-4 py-2 text-sm bg-primary-700 text-white rounded-lg"
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

              {/* Orders */}
              <Link
                to="/orders"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>Orders</span>
              </Link>

              {/* Clients with submenu */}
              <div className="relative">
                <button
                  onClick={() => setShowClientsMenu(!showClientsMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
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

              {/* Users */}
              <Link
                to="/users"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Users</span>
              </Link>
            </nav>

            {/* User Avatar - Fixed at bottom */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full shadow-lg ring-2 ring-primary-500/50 flex items-center justify-center mt-4 flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Header + summary */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Overview of TRS and DHT tools with available quantities.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Tool</span>
              </button>
              <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Total Quantity
                  </p>
                  <p className="text-xl font-semibold text-gray-900">{totalCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center space-x-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">TRS Tools</p>
                  <p className="text-base font-semibold text-gray-900">
                    {tools.filter(t => t.group === 'TRS').length}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">DHT Tools</p>
                  <p className="text-base font-semibold text-gray-900">
                    {tools.filter(t => t.group === 'DHT').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters + search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedGroup === 'ALL'
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Tools
            </button>
            <button
              onClick={() => setSelectedGroup('TRS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedGroup === 'TRS'
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              TRS
            </button>
            <button
              onClick={() => setSelectedGroup('DHT')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedGroup === 'DHT'
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              DHT
            </button>
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tools"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* TRS section */}
          {(selectedGroup === 'ALL' || selectedGroup === 'TRS') && (
            <div className="mb-6 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">TRS</h2>
                <span className="text-sm text-gray-500">
                  Tools: {filteredTools.filter(t => t.group === 'TRS').length}
                </span>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTools
                    .filter(t => t.group === 'TRS')
                    .map(tool => (
                      <tr key={tool.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                              {tool.name.charAt(0)}
                            </span>
                            <span>{tool.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {tool.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditQuantity(tool)}
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DHT section */}
          {(selectedGroup === 'ALL' || selectedGroup === 'DHT') && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">DHT</h2>
                <span className="text-sm text-gray-500">
                  Tools: {filteredTools.filter(t => t.group === 'DHT').length}
                </span>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTools
                    .filter(t => t.group === 'DHT')
                    .map(tool => (
                      <tr key={tool.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {tool.name.charAt(0)}
                            </span>
                            <span>{tool.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {tool.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditQuantity(tool)}
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Tool</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTool({ name: '', group: 'TRS', available: 10 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="toolName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name
                </label>
                <input
                  type="text"
                  id="toolName"
                  value={newTool.name}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter tool name"
                />
              </div>
              <div>
                <label htmlFor="toolGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <select
                  id="toolGroup"
                  value={newTool.group}
                  onChange={(e) => setNewTool({ ...newTool, group: e.target.value as ToolGroupKey })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="TRS">TRS</option>
                  <option value="DHT">DHT</option>
                </select>
              </div>
              <div>
                <label htmlFor="toolQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  id="toolQuantity"
                  value={newTool.available}
                  onChange={(e) => setNewTool({ ...newTool, available: parseInt(e.target.value) || 0 })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter quantity"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTool({ name: '', group: 'TRS', available: 10 });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTool}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200"
              >
                Add Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Modal */}
      {editingTool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Adjust Quantity</h3>
              <button
                onClick={() => {
                  setEditingTool(null);
                  setEditQuantity(0);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {editingTool.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {editingTool.group}
                </p>
              </div>
              <div>
                <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  id="editQuantity"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter quantity"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingTool(null);
                  setEditQuantity(0);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateQuantity}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200"
              >
                Update Quantity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;


