import { useState } from 'react';
import MainLayout from '../components/MainLayout';

interface ToolSize {
  size: string;
  quantity: number;
}

interface ToolItem {
  id: string;
  name: string;
  group: 'TRS' | 'DHT';
  sizes: ToolSize[];
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
  {
    id: 'trs-crt',
    name: 'CRT',
    group: 'TRS',
    sizes: [
      { size: '4 1/2"', quantity: 10 },
      { size: '5"', quantity: 8 },
      { size: '6 5/8"', quantity: 7 }
    ]
  },
  {
    id: 'trs-power-tong',
    name: 'POWER TONG',
    group: 'TRS',
    sizes: [
      { size: '5"', quantity: 10 },
      { size: '6 5/8"', quantity: 5 }
    ]
  },
  {
    id: 'trs-jam-unit',
    name: 'JAM UNIT',
    group: 'TRS',
    sizes: [
      { size: '6 5/8"', quantity: 7 },
      { size: '7"', quantity: 5 }
    ]
  },
  {
    id: 'trs-filup-tool',
    name: 'FILUP TOOL',
    group: 'TRS',
    sizes: [
      { size: '4 1/2"', quantity: 10 },
      { size: '5"', quantity: 8 }
    ]
  },
  {
    id: 'trs-handling-tools',
    name: 'HANDLING TOOLS',
    group: 'TRS',
    sizes: [
      { size: '5"', quantity: 12 },
      { size: '6 5/8"', quantity: 8 }
    ]
  },
  {
    id: 'dht-reamers',
    name: 'REAMERS',
    group: 'DHT',
    sizes: [
      { size: '7"', quantity: 10 },
      { size: '8 5/8"', quantity: 5 }
    ]
  },
  {
    id: 'dht-anti-stick-slip',
    name: 'ANTI STICK SLIP',
    group: 'DHT',
    sizes: [
      { size: '4 1/2"', quantity: 12 },
      { size: '5"', quantity: 10 }
    ]
  },
  {
    id: 'dht-scrapper',
    name: 'SCRAPPER',
    group: 'DHT',
    sizes: [
      { size: '6 5/8"', quantity: 10 }
    ]
  },
  {
    id: 'dht-jars',
    name: 'JARS',
    group: 'DHT',
    sizes: [
      { size: '5"', quantity: 10 },
      { size: '6 5/8"', quantity: 8 }
    ]
  },
  {
    id: 'dht-control-valve',
    name: 'CONTROL VALVE',
    group: 'DHT',
    sizes: [
      { size: '4 1/2"', quantity: 8 },
      { size: '5"', quantity: 7 }
    ]
  },
  {
    id: 'dht-torque-reducer',
    name: 'TORQUE REDUCER',
    group: 'DHT',
    sizes: [
      { size: '7"', quantity: 12 }
    ]
  },
];

// Sample tool instances data - generates instances based on tool sizes
const generateToolInstances = (toolId: string, tool: ToolItem): ToolInstance[] => {
  const instances: ToolInstance[] = [];

  if (!tool || !tool.sizes || tool.sizes.length === 0) {
    // Fallback if no sizes defined
    return [];
  }

  const locations = ['North Kuwait', 'West Kuwait', 'South East Kuwait', 'Gas Field', 'North Kuwait'];
  const rigs = ['Rig 15', 'Rig 8', 'Rig 22', 'Rig 5', 'Rig 18'];

  let instanceCounter = 1;

  // Generate instances for each size proportionally
  tool.sizes.forEach((sizeItem) => {
    const sizeOnsiteCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.5)); // 50% onsite
    const sizeYardCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.3));   // 30% yard
    const sizeServiceCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.2)); // 20% service

    // Generate onsite instances for this size
    for (let i = 0; i < sizeOnsiteCount && i < sizeItem.quantity; i++) {
      instances.push({
        id: `${toolId}-onsite-${instanceCounter++}`,
        toolId,
        status: 'onsite',
        dateTime: new Date().toLocaleString('en-GB'),
        jobSize: sizeItem.size,
        location: locations[(instances.length) % locations.length],
        rig: rigs[(instances.length) % rigs.length],
      });
    }

    // Generate yard instances for this size
    for (let i = 0; i < sizeYardCount && (sizeOnsiteCount + i) < sizeItem.quantity; i++) {
      instances.push({
        id: `${toolId}-yard-${instanceCounter++}`,
        toolId,
        status: 'yard',
        dateTime: undefined,
        jobSize: sizeItem.size,
        location: undefined,
        rig: undefined,
      });
    }

    // Generate service instances for this size
    for (let i = 0; i < sizeServiceCount && (sizeOnsiteCount + sizeYardCount + i) < sizeItem.quantity; i++) {
      instances.push({
        id: `${toolId}-service-${instanceCounter++}`,
        toolId,
        status: 'service',
        dateTime: undefined,
        jobSize: sizeItem.size,
        location: undefined,
        rig: undefined,
      });
    }
  });

  return instances;
};

const Tools = () => {
  const [selectedToolId, setSelectedToolId] = useState<string>(toolItems[0]?.id || '');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'onsite' | 'yard' | 'service' | null>('all');

  const selectedTool = toolItems.find((t) => t.id === selectedToolId) || toolItems[0];

  // Get all tool instances for the selected tool (pass the tool object to get sizes)
  const allToolInstances = selectedTool ? generateToolInstances(selectedToolId, selectedTool) : [];

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
    <MainLayout
      headerContent={
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">Operations Tools</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all operational tools</p>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Secondary Tools Menu - Sticky */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-5 sticky top-0 md:max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            <h2 className="text-base font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-transparent bg-clip-text mb-4">Tools</h2>

            <div className="space-y-5">
              {/* TRS Group */}
              <div>
                <div className="text-xs font-bold text-gray-600 mb-2 px-2 uppercase tracking-wider">TRS Tools</div>
                <div className="space-y-2">
                  {toolItems
                    .filter((t) => t.group === 'TRS')
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setSelectedStatus('all');
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-300 transform ${selectedToolId === tool.id
                          ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-500 text-primary-800 shadow-lg scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:border-primary-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="truncate">{tool.name}</span>
                          {tool.sizes && tool.sizes.length > 0 && (
                            <span className="text-xs font-normal text-gray-500 mt-0.5 truncate">
                              {tool.sizes.map(s => s.size).join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* DHT Group */}
              <div>
                <div className="text-xs font-bold text-gray-600 mb-2 px-2 uppercase tracking-wider">DHT Tools</div>
                <div className="space-y-2">
                  {toolItems
                    .filter((t) => t.group === 'DHT')
                    .map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setSelectedStatus('all');
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-300 transform ${selectedToolId === tool.id
                          ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-500 text-primary-800 shadow-lg scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:border-primary-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="truncate">{tool.name}</span>
                          {tool.sizes && tool.sizes.length > 0 && (
                            <span className="text-xs font-normal text-gray-500 mt-0.5 truncate">
                              {tool.sizes.map(s => s.size).join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Panel - Status Boxes and Details */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3 pb-4 border-b border-gray-200/50">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-transparent bg-clip-text">{selectedTool?.name}</h1>
                <p className="text-sm text-gray-500 mt-2">Sample status for this tool across locations.</p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
                <span className="text-xs font-semibold text-gray-600">Group: </span>
                <span className="text-xs font-bold text-primary-700 uppercase">{selectedTool?.group}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* All - All Tools */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'all' ? null : 'all')}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 transform hover:scale-105 ${selectedStatus === 'all'
                  ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 shadow-2xl ring-4 ring-primary-300/50'
                  : 'border-primary-200 bg-gradient-to-br from-primary-50 to-white hover:from-primary-100 hover:to-primary-50 hover:shadow-xl cursor-pointer'
                  }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-primary-600 shadow-lg" />
                    <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">All</span>
                  </div>
                  <p className="text-4xl font-bold text-primary-700 mb-1">{totalCount}</p>
                  <p className="text-xs text-primary-600 mt-2 font-medium">All tools across all statuses</p>
                </div>
              </button>

              {/* Green - Onsite (Rentout) */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'onsite' ? null : 'onsite')}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 transform hover:scale-105 ${selectedStatus === 'onsite'
                  ? 'border-green-500 bg-gradient-to-br from-green-100 to-green-50 shadow-2xl ring-4 ring-green-300/50'
                  : 'border-green-200 bg-gradient-to-br from-green-50 to-white hover:from-green-100 hover:to-green-50 hover:shadow-xl cursor-pointer'
                  }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-lg animate-pulse" />
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Onsite (Rentout)</span>
                  </div>
                  <p className="text-4xl font-bold text-green-700 mb-1">{onsiteCount}</p>
                  <p className="text-xs text-green-600 mt-2 font-medium">Tools currently deployed onsite</p>
                </div>
              </button>

              {/* Yellow - Yard (Available) */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'yard' ? null : 'yard')}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 transform hover:scale-105 ${selectedStatus === 'yard'
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-yellow-50 shadow-2xl ring-4 ring-yellow-300/50'
                  : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white hover:from-yellow-100 hover:to-yellow-50 hover:shadow-xl cursor-pointer'
                  }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg" />
                    <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Yard (Workshop)</span>
                  </div>
                  <p className="text-4xl font-bold text-yellow-700 mb-1">{yardCount}</p>
                  <p className="text-xs text-yellow-600 mt-2 font-medium">Available in yard / workshop</p>
                </div>
              </button>

              {/* Red - Services */}
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'service' ? null : 'service')}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 transform hover:scale-105 ${selectedStatus === 'service'
                  ? 'border-red-500 bg-gradient-to-br from-red-100 to-red-50 shadow-2xl ring-4 ring-red-300/50'
                  : 'border-red-200 bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 hover:shadow-xl cursor-pointer'
                  }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg" />
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Under Service</span>
                  </div>
                  <p className="text-4xl font-bold text-red-700 mb-1">{serviceCount}</p>
                  <p className="text-xs text-red-600 mt-2 font-medium">Tools currently in service</p>
                </div>
              </button>
            </div>

            {/* Tool Details Section */}
            {selectedStatus && filteredInstances.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-transparent bg-clip-text mb-5">
                  {selectedStatus === 'all' && 'All Tools Details'}
                  {selectedStatus === 'onsite' && 'Onsite Tools Details'}
                  {selectedStatus === 'yard' && 'Yard Tools Details'}
                  {selectedStatus === 'service' && 'Service Tools Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-5 space-y-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <div className="font-bold text-primary-700 text-lg mb-4 pb-2 border-b border-gray-200">{toolIdentifier}</div>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-gray-100">
                            <span className="font-bold text-primary-600">Status:</span>
                            <span
                              className={`px-3 py-1.5 rounded-full font-bold shadow-sm ${statusColor === 'green'
                                ? 'bg-gradient-to-r from-green-200 to-green-100 text-green-800 border border-green-300'
                                : statusColor === 'yellow'
                                  ? 'bg-gradient-to-r from-yellow-200 to-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'bg-gradient-to-r from-red-200 to-red-100 text-red-800 border border-red-300'
                                }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-gray-100">
                            <span className="font-bold text-primary-600">Date/Time:</span>
                            <span className="font-semibold text-gray-700">{instance.dateTime || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-gray-100">
                            <span className="font-bold text-primary-600">Size:</span>
                            <span className="font-semibold text-primary-700">{instance.jobSize || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-gray-100">
                            <span className="font-bold text-primary-600">Location:</span>
                            <span className="font-semibold text-gray-700">{instance.location || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-gray-100">
                            <span className="font-bold text-primary-600">Rig:</span>
                            <span className="font-semibold text-gray-700">{instance.rig || '-'}</span>
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
    </MainLayout>
  );
};

export default Tools;


