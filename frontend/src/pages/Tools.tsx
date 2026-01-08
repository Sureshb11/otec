import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ToolItem {
  id: string;
  name: string;
  group: 'TRS' | 'DHT';
}

interface ToolInstance {
  id: string;
  toolId: string;
  status: 'onsite' | 'yard' | 'service';
  dateTime?: string;
  jobSize?: string;
  location?: string;
  rig?: string;
}

const toolItems: ToolItem[] = [
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

// Sample tool instances data
const generateToolInstances = (toolId: string): ToolInstance[] => {
  const instances: ToolInstance[] = [];
  
  // Generate 5 green (onsite) instances
  for (let i = 1; i <= 5; i++) {
    instances.push({
      id: `${toolId}-onsite-${i}`,
      toolId,
      status: 'onsite',
      dateTime: undefined,
      jobSize: undefined,
      location: undefined,
      rig: undefined,
    });
  }
  
  // Generate 3 yellow (yard) instances
  for (let i = 1; i <= 3; i++) {
    instances.push({
      id: `${toolId}-yard-${i}`,
      toolId,
      status: 'yard',
      dateTime: undefined,
      jobSize: undefined,
      location: undefined,
      rig: undefined,
    });
  }
  
  // Generate 2 red (service) instances
  for (let i = 1; i <= 2; i++) {
    instances.push({
      id: `${toolId}-service-${i}`,
      toolId,
      status: 'service',
      dateTime: undefined,
      jobSize: undefined,
      location: undefined,
      rig: undefined,
    });
  }
  
  return instances;
};

const Tools = () => {
  const { user } = useAuthStore();
  const [showOperationsMenu, setShowOperationsMenu] = useState(true);
  const [showClientsMenu, setShowClientsMenu] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>(toolItems[0]?.id || '');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'onsite' | 'yard' | 'service' | null>(null);

  const selectedTool = toolItems.find((t) => t.id === selectedToolId) || toolItems[0];
  
  // Get all tool instances for the selected tool
  const allToolInstances = generateToolInstances(selectedToolId);
  
  // Filter instances by selected status
  const filteredInstances = selectedStatus === 'all'
    ? allToolInstances
    : selectedStatus
    ? allToolInstances.filter((inst) => inst.status === selectedStatus)
    : [];
  
  // Get counts for each status
  const totalCount = allToolInstances.length;
  const onsiteCount = allToolInstances.filter((inst) => inst.status === 'onsite').length;
  const yardCount = allToolInstances.filter((inst) => inst.status === 'yard').length;
  const serviceCount = allToolInstances.filter((inst) => inst.status === 'service').length;
  
  // Generate tool identifier (e.g., "CRT-001")
  const getToolIdentifier = (_instance: ToolInstance, index: number) => {
    const toolName = selectedTool.name;
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `${toolName}-${paddedIndex}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar - same navigation as other pages */}
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
                      className="flex items-center space-x-3 px-4 py-2 text-sm bg-primary-700 text-white rounded-lg"
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

              {/* Clients */}
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

            {/* User Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full shadow-lg ring-2 ring-primary-500/50 flex items-center justify-center mt-4 flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-6">
          {/* Secondary Tools Menu */}
          <div className="w-full md:w-72 bg-white rounded-lg shadow p-4 h-max">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Tools</h2>

            <div className="mb-3">
              <div className="flex space-x-2 text-xs font-medium">
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">TRS</span>
                <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">DHT</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* TRS Group */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">TRS Tools</div>
                <div className="space-y-1">
                  {toolItems
                    .filter((t) => t.group === 'TRS')
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setSelectedStatus(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium border transition-all duration-150 ${
                          selectedToolId === tool.id
                            ? 'bg-primary-50 border-primary-500 text-primary-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tool.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* DHT Group */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">DHT Tools</div>
                <div className="space-y-1">
                  {toolItems
                    .filter((t) => t.group === 'DHT')
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setSelectedStatus(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium border transition-all duration-150 ${
                          selectedToolId === tool.id
                            ? 'bg-primary-50 border-primary-500 text-primary-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tool.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Third Panel - Status Boxes */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedTool?.name}</h1>
                <p className="text-sm text-gray-500 mt-1">Sample status for this tool across locations.</p>
              </div>
              <div className="text-xs text-gray-500">
                Group: <span className="font-semibold">{selectedTool?.group}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* All - All Tools */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'all' ? null : 'all')}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  selectedStatus === 'all'
                    ? 'border-primary-500 bg-primary-100 shadow-lg ring-2 ring-primary-300'
                    : 'border-primary-200 bg-primary-50 hover:bg-primary-100 hover:shadow-md cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary-600" />
                    <span className="text-xs font-semibold text-primary-700 uppercase">All</span>
                  </div>
                  <p className="text-3xl font-bold text-primary-700">{totalCount}</p>
                  <p className="text-xs text-primary-700 mt-1">All tools across all statuses</p>
                </div>
              </button>

              {/* Green - Onsite (Rentout) */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'onsite' ? null : 'onsite')}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  selectedStatus === 'onsite'
                    ? 'border-green-500 bg-green-100 shadow-lg ring-2 ring-green-300'
                    : 'border-green-200 bg-green-50 hover:bg-green-100 hover:shadow-md cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-green-700 uppercase">Onsite (Rentout)</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{onsiteCount}</p>
                  <p className="text-xs text-green-700 mt-1">Tools currently deployed onsite</p>
                </div>
              </button>

              {/* Yellow - Yard (Available) */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'yard' ? null : 'yard')}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  selectedStatus === 'yard'
                    ? 'border-yellow-500 bg-yellow-100 shadow-lg ring-2 ring-yellow-300'
                    : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:shadow-md cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-700 uppercase">Yard (Workshop)</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-700">{yardCount}</p>
                  <p className="text-xs text-yellow-700 mt-1">Available in yard / workshop</p>
                </div>
              </button>

              {/* Red - Services */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'service' ? null : 'service')}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                  selectedStatus === 'service'
                    ? 'border-red-500 bg-red-100 shadow-lg ring-2 ring-red-300'
                    : 'border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-md cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-red-700 uppercase">Under Service</span>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{serviceCount}</p>
                  <p className="text-xs text-red-700 mt-1">Tools currently in service</p>
                </div>
              </button>
            </div>

            {/* Tool Details Section */}
            {selectedStatus && filteredInstances.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedStatus === 'all' && 'All Tools Details'}
                  {selectedStatus === 'onsite' && 'Onsite Tools Details'}
                  {selectedStatus === 'yard' && 'Yard Tools Details'}
                  {selectedStatus === 'service' && 'Service Tools Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInstances.map((instance, index) => {
                    const toolIdentifier = getToolIdentifier(instance, index);
                    const statusColor =
                      instance.status === 'onsite'
                        ? 'green'
                        : instance.status === 'yard'
                        ? 'yellow'
                        : 'red';
                    const statusLabel =
                      instance.status === 'onsite'
                        ? 'Onsite'
                        : instance.status === 'yard'
                        ? 'Yard'
                        : 'Under Service';

                    return (
                      <div
                        key={instance.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2"
                      >
                        <div className="font-bold text-primary-600 text-base mb-3">{toolIdentifier}</div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-600">Status:</span>
                            <span
                              className={`px-2 py-1 rounded font-bold ${
                                statusColor === 'green'
                                  ? 'bg-green-200 text-green-800'
                                  : statusColor === 'yellow'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-red-200 text-red-800'
                              }`}
                            >
                              {statusLabel}
                              {statusColor === 'green' && '(green)'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-600">Date/Time:</span>
                            <span className="font-bold text-primary-600">{instance.dateTime || '-'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-600">Job/Size:</span>
                            <span className="font-bold text-primary-600">{instance.jobSize || '-'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-600">Location:</span>
                            <span className="font-bold text-primary-600">{instance.location || '-'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-600">Rig:</span>
                            <span className="font-bold text-primary-600">{instance.rig || '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;


