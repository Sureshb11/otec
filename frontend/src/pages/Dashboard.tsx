import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

import MainLayout from '../components/MainLayout';

interface ToolSize {
  size: string;
  quantity: number;
}

interface WorkingTool {
  id: string;
  name: string;
  group: 'TRS' | 'DHT';
  sizes: ToolSize[];
  location?: string;
  rig?: string;
  startTime?: Date;
  runningHours?: number;
  status?: 'onsite' | 'yard' | 'service' | 'available';
}

interface ToolInstance {
  id: string;
  toolId: string;
  toolName: string;
  status: 'onsite' | 'yard' | 'service';
  location?: string;
  rig?: string;
  size?: string;
  startTime?: Date;
  runningHours?: number;
  runningMinutes?: number;
  runningSeconds?: number;
  totalSeconds?: number;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [selectedTool, setSelectedTool] = useState<WorkingTool | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toolInstancesBaseTime, setToolInstancesBaseTime] = useState<Date | null>(null);

  // All available tools with multiple sizes
  const allTools: WorkingTool[] = [
    // TRS Tools
    {
      id: 'trs-crt',
      name: 'CRT',
      group: 'TRS',
      sizes: [
        { size: '4 1/2"', quantity: 10 },
        { size: '5"', quantity: 8 },
        { size: '6 5/8"', quantity: 7 }
      ],
      location: 'North Kuwait',
      rig: 'Rig 15',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'onsite',
    },
    {
      id: 'trs-power-tong',
      name: 'POWER TONG',
      group: 'TRS',
      sizes: [
        { size: '5"', quantity: 10 },
        { size: '6 5/8"', quantity: 5 }
      ],
      location: 'West Kuwait',
      rig: 'Rig 8',
      startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'onsite',
    },
    {
      id: 'trs-jam-unit',
      name: 'JAM UNIT',
      group: 'TRS',
      sizes: [
        { size: '6 5/8"', quantity: 7 },
        { size: '7"', quantity: 5 }
      ],
      location: 'Gas Field',
      rig: 'Rig 5',
      startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'onsite',
    },
    {
      id: 'trs-filup-tool',
      name: 'FILUP TOOL',
      group: 'TRS',
      sizes: [
        { size: '4 1/2"', quantity: 10 },
        { size: '5"', quantity: 8 }
      ],
      status: 'yard',
    },
    {
      id: 'trs-handling-tools',
      name: 'HANDLING TOOLS',
      group: 'TRS',
      sizes: [
        { size: '5"', quantity: 12 },
        { size: '6 5/8"', quantity: 8 }
      ],
      status: 'available',
    },
    // DHT Tools
    {
      id: 'dht-reamers',
      name: 'REAMERS',
      group: 'DHT',
      sizes: [
        { size: '7"', quantity: 10 },
        { size: '8 5/8"', quantity: 5 }
      ],
      location: 'South East Kuwait',
      rig: 'Rig 22',
      startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
      status: 'onsite',
    },
    {
      id: 'dht-anti-stick-slip',
      name: 'ANTI STICK SLIP',
      group: 'DHT',
      sizes: [
        { size: '4 1/2"', quantity: 12 },
        { size: '5"', quantity: 10 }
      ],
      location: 'North Kuwait',
      rig: 'Rig 18',
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'onsite',
    },
    {
      id: 'dht-scrapper',
      name: 'SCRAPPER',
      group: 'DHT',
      sizes: [
        { size: '6 5/8"', quantity: 10 }
      ],
      status: 'yard',
    },
    {
      id: 'dht-jars',
      name: 'JARS',
      group: 'DHT',
      sizes: [
        { size: '5"', quantity: 10 },
        { size: '6 5/8"', quantity: 8 }
      ],
      status: 'service',
    },
    {
      id: 'dht-control-valve',
      name: 'CONTROL VALVE',
      group: 'DHT',
      sizes: [
        { size: '4 1/2"', quantity: 8 },
        { size: '5"', quantity: 7 }
      ],
      status: 'available',
    },
    {
      id: 'dht-torque-reducer',
      name: 'TORQUE REDUCER',
      group: 'DHT',
      sizes: [
        { size: '7"', quantity: 12 }
      ],
      status: 'yard',
    },
  ];

  // Update current time every 100ms for smooth seconds animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Calculate running hours for each tool (updates every second)
  const toolsWithRunningHours = allTools.map((tool) => {
    if (tool.startTime) {
      const hours = (currentTime.getTime() - tool.startTime.getTime()) / (1000 * 60 * 60);
      return {
        ...tool,
        runningHours: Math.max(0, hours), // Ensure non-negative
      };
    }
    return {
      ...tool,
      runningHours: 0,
    };
  });

  // Group tools by TRS and DHT
  const trsTools = toolsWithRunningHours.filter((t) => t.group === 'TRS');
  const dhtTools = toolsWithRunningHours.filter((t) => t.group === 'DHT');

  // Auto-select first tool when dashboard loads
  useEffect(() => {
    if (!selectedTool && allTools.length > 0) {
      setSelectedTool(allTools[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate tool instances for selected tool based on tool's sizes
  // Distributes instances across sizes: 50% onsite, 30% yard, 20% service
  const generateToolInstances = (tool: WorkingTool | null, baseTime: Date): ToolInstance[] => {
    if (!tool || !tool.sizes || tool.sizes.length === 0) return [];

    const instances: ToolInstance[] = [];
    const locations = ['North Kuwait', 'West Kuwait', 'South East Kuwait', 'Gas Field', 'North Kuwait'];
    const rigs = ['Rig 15', 'Rig 8', 'Rig 22', 'Rig 5', 'Rig 18'];
    const hoursAgo = [2, 5, 8, 12, 1]; // hours ago

    let instanceCounter = 1;
    let locationIndex = 0;
    let rigIndex = 0;
    let hoursAgoIndex = 0;

    // Generate instances for each size based on quantity
    tool.sizes.forEach((sizeItem) => {
      // Calculate how many instances for each status for this size
      const sizeOnsiteCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.5)); // 50% onsite
      const sizeYardCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.3));   // 30% yard
      const sizeServiceCount = Math.max(1, Math.ceil(sizeItem.quantity * 0.2)); // 20% service

      // Generate onsite instances for this size (working tools)
      for (let i = 0; i < sizeOnsiteCount && i < sizeItem.quantity; i++) {
        const startTime = new Date(baseTime.getTime() - hoursAgo[hoursAgoIndex % hoursAgo.length] * 60 * 60 * 1000);
        instances.push({
          id: `${tool.id}-onsite-${instanceCounter++}`,
          toolId: tool.id,
          toolName: tool.name,
          status: 'onsite',
          location: locations[locationIndex % locations.length],
          rig: rigs[rigIndex % rigs.length],
          size: sizeItem.size,
          startTime,
          runningHours: 0,
        });
        locationIndex++;
        rigIndex++;
        hoursAgoIndex++;
      }

      // Generate yard instances for this size (not shown in dashboard, but available for future)
      for (let i = 0; i < sizeYardCount && (sizeOnsiteCount + i) < sizeItem.quantity; i++) {
        instances.push({
          id: `${tool.id}-yard-${instanceCounter++}`,
          toolId: tool.id,
          toolName: tool.name,
          status: 'yard',
          size: sizeItem.size,
        });
      }

      // Generate service instances for this size (not shown in dashboard, but available for future)
      for (let i = 0; i < sizeServiceCount && (sizeOnsiteCount + sizeYardCount + i) < sizeItem.quantity; i++) {
        instances.push({
          id: `${tool.id}-service-${instanceCounter++}`,
          toolId: tool.id,
          toolName: tool.name,
          status: 'service',
          size: sizeItem.size,
        });
      }
    });

    return instances;
  };

  // Store base time when tool is selected to keep start times consistent
  useEffect(() => {
    if (selectedTool && !toolInstancesBaseTime) {
      setToolInstancesBaseTime(new Date());
    } else if (!selectedTool) {
      setToolInstancesBaseTime(null);
    }
  }, [selectedTool, toolInstancesBaseTime]);

  // Get instances for selected tool - memoized to prevent regeneration on every render
  const selectedToolInstances = useMemo(() => {
    if (selectedTool && toolInstancesBaseTime) {
      return generateToolInstances(selectedTool, toolInstancesBaseTime);
    }
    return [];
  }, [selectedTool, toolInstancesBaseTime]);

  // Update running hours for onsite instances and filter to show only working (onsite) tools
  const updatedInstances = selectedToolInstances
    .filter((instance) => instance.status === 'onsite') // Only show working tools
    .map((instance) => {
      if (instance.startTime) {
        const elapsedMs = currentTime.getTime() - instance.startTime.getTime();
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const remainingAfterHours = totalSeconds % 3600;
        const minutes = Math.floor(remainingAfterHours / 60);
        const seconds = remainingAfterHours % 60;
        return {
          ...instance,
          runningHours: totalSeconds / 3600,
          runningMinutes: minutes,
          runningSeconds: seconds,
          totalSeconds: totalSeconds,
        };
      }
      return instance;
    });

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="text-sm text-gray-600 font-medium">Here's what's happening with your operations today</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-lg hover:border-primary-300 transition-all duration-300 flex items-center space-x-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Today</span>
            </button>
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white rounded-xl text-sm font-semibold hover:from-primary-500 hover:via-primary-600 hover:to-primary-500 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Order</span>
            </Link>
          </div>
        </div>
      }
    >
      {/* Currently Working Tools Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span className="w-1 h-6 bg-gradient-to-b from-primary-600 to-primary-400 rounded-full"></span>
              <span>Currently Working Tools</span>
            </h3>
            <p className="text-sm text-gray-600 font-medium ml-3">Live status with location and running hours</p>
          </div>
          {selectedTool && (
            <div className="flex-1 text-center space-y-1">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedTool.name} - Working Tools ({updatedInstances.length})
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                Showing {updatedInstances.length} working {selectedTool.name} tools with live status
              </p>
            </div>
          )}
          <Link
            to="/operations/tools"
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all duration-200 flex items-center space-x-1"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Secondary Panel - Tools List */}
          <div className="w-full lg:w-64 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200/50 min-h-[600px] shadow-lg backdrop-blur-sm">
            <div className="space-y-4 h-[550px] overflow-y-auto">
              {/* TRS Group */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">TRS Tools</div>
                <div className="space-y-1">
                  {trsTools.map((tool) => {
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className={`w-[90%] text-left px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${selectedTool?.id === tool.id
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-400 text-primary-800 shadow-md scale-105'
                          : 'bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-white hover:shadow-md hover:border-primary-300 hover:scale-102'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="truncate font-semibold">{tool.name}</span>
                          {tool.sizes && tool.sizes.length > 0 && (
                            <span className="text-[10px] font-normal text-gray-500 mt-0.5 truncate">
                              {tool.sizes.map(s => s.size).join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DHT Group */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">DHT Tools</div>
                <div className="space-y-1">
                  {dhtTools.map((tool) => {
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className={`w-[90%] text-left px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${selectedTool?.id === tool.id
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-400 text-primary-800 shadow-md scale-105'
                          : 'bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-white hover:shadow-md hover:border-primary-300 hover:scale-102'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="truncate font-semibold">{tool.name}</span>
                          {tool.sizes && tool.sizes.length > 0 && (
                            <span className="text-[10px] font-normal text-gray-500 mt-0.5 truncate">
                              {tool.sizes.map(s => s.size).join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tool Instances - Display 10 instances of selected tool */}
          <div className="flex-1">
            {selectedTool ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {updatedInstances.map((instance) => (
                    <div
                      key={instance.id}
                      className={`rounded-2xl border-2 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn hover:scale-105 ${instance.status === 'onsite'
                        ? 'bg-gradient-to-br from-green-50 via-green-100/50 to-green-50 border-green-400/50 backdrop-blur-sm'
                        : instance.status === 'yard'
                          ? 'bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-50 border-yellow-400/50 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-red-50 via-red-100/50 to-red-50 border-red-400/50 backdrop-blur-sm'
                        }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-primary-700">
                            {instance.toolName} #{instance.id.split('-').pop()}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${instance.status === 'onsite'
                            ? 'bg-green-200 text-green-800'
                            : instance.status === 'yard'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                            }`}>
                            {instance.status === 'onsite' ? 'Onsite' :
                              instance.status === 'yard' ? 'Yard' :
                                'Service'}
                          </span>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${instance.status === 'onsite' ? 'bg-green-100' :
                          instance.status === 'yard' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                          {/* Animated Rig Icon */}
                          <svg className={`w-5 h-5 ${instance.status === 'onsite' ? 'text-green-600' : instance.status === 'yard' ? 'text-yellow-600' : 'text-red-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            {/* Derrick Structure */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3L6 21h12L12 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 15h8" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6" />
                            {/* Animated Drill String */}
                            <path className={instance.status === 'onsite' ? 'animate-drilling' : ''} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v10" />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {/* Location - Only show if tool is onsite */}
                        {instance.status === 'onsite' && instance.location && (
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-green-200/50 shadow-sm">
                            <div className="text-xs font-semibold text-gray-600 mb-0.5">Location</div>
                            <div className="text-xs font-bold text-primary-700">{instance.location}</div>
                          </div>
                        )}

                        {/* Rig and Size - Only show if tool is onsite */}
                        {instance.status === 'onsite' && instance.rig && instance.size && (
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-green-200/50 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-gray-600 mb-0.5">Rig</div>
                                <div className="text-xs font-bold text-primary-700">{instance.rig}</div>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-gray-600 mb-0.5">Size</div>
                                <div className="text-xs font-bold text-primary-700">{instance.size}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Running Hours - Only show if tool is onsite */}
                        {instance.status === 'onsite' && instance.startTime && (
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-green-200/50 shadow-sm">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="text-xs font-semibold text-gray-500">Running Time</div>
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <svg className="w-2.5 h-2.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>LIVE</span>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-primary-700 tabular-nums transition-all duration-100">
                              {Math.floor(instance.runningHours || 0)}h {Math.floor(instance.runningMinutes || 0)}m {Math.floor(instance.runningSeconds || 0)}s
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-500 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">Select a tool to view instances</p>
                <p className="text-sm">Choose a tool from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
