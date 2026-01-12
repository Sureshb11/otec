import { useState } from 'react';
import MainLayout from '../components/MainLayout';

type ToolGroupKey = 'TRS' | 'DHT';

interface ToolSize {
  size: string;
  quantity: number;
}

interface Tool {
  id: string;
  name: string;
  group: ToolGroupKey;
  available: number; // Total available across all sizes
  sizes: ToolSize[]; // Array of sizes with quantities
  type?: string;
}

const Inventory = () => {
  const [selectedGroup, setSelectedGroup] = useState<ToolGroupKey | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editSizeIndex, setEditSizeIndex] = useState<number>(-1);
  const [editQuantity, setEditQuantity] = useState(0);
  const [newTool, setNewTool] = useState({
    name: '',
    group: 'TRS' as ToolGroupKey,
    type: '',
    sizes: [{ size: '', quantity: 0 }] as ToolSize[],
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [, setImportFile] = useState<File | null>(null);

  const [tools, setTools] = useState<Tool[]>([
    {
      id: 'trs-crt',
      name: 'CRT',
      group: 'TRS',
      available: 25,
      sizes: [
        { size: '4 1/2"', quantity: 10 },
        { size: '5"', quantity: 8 },
        { size: '6 5/8"', quantity: 7 }
      ],
      type: 'Standard'
    },
    {
      id: 'trs-power-tong',
      name: 'POWER TONG',
      group: 'TRS',
      available: 15,
      sizes: [
        { size: '5"', quantity: 10 },
        { size: '6 5/8"', quantity: 5 }
      ],
      type: 'Standard'
    },
    {
      id: 'trs-jam-unit',
      name: 'JAM UNIT',
      group: 'TRS',
      available: 12,
      sizes: [
        { size: '6 5/8"', quantity: 7 },
        { size: '7"', quantity: 5 }
      ],
      type: 'Standard'
    },
    {
      id: 'trs-filup-tool',
      name: 'FILUP TOOL',
      group: 'TRS',
      available: 18,
      sizes: [
        { size: '4 1/2"', quantity: 10 },
        { size: '5"', quantity: 8 }
      ],
      type: 'Standard'
    },
    {
      id: 'trs-handling-tools',
      name: 'HANDLING TOOLS',
      group: 'TRS',
      available: 20,
      sizes: [
        { size: '5"', quantity: 12 },
        { size: '6 5/8"', quantity: 8 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-reamers',
      name: 'REAMERS',
      group: 'DHT',
      available: 15,
      sizes: [
        { size: '7"', quantity: 10 },
        { size: '8 5/8"', quantity: 5 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-anti-stick-slip',
      name: 'ANTI STICK SLIP',
      group: 'DHT',
      available: 22,
      sizes: [
        { size: '4 1/2"', quantity: 12 },
        { size: '5"', quantity: 10 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-scrapper',
      name: 'SCRAPPER',
      group: 'DHT',
      available: 10,
      sizes: [
        { size: '6 5/8"', quantity: 10 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-jars',
      name: 'JARS',
      group: 'DHT',
      available: 18,
      sizes: [
        { size: '5"', quantity: 10 },
        { size: '6 5/8"', quantity: 8 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-control-valve',
      name: 'CONTROL VALVE',
      group: 'DHT',
      available: 15,
      sizes: [
        { size: '4 1/2"', quantity: 8 },
        { size: '5"', quantity: 7 }
      ],
      type: 'Standard'
    },
    {
      id: 'dht-torque-reducer',
      name: 'TORQUE REDUCER',
      group: 'DHT',
      available: 12,
      sizes: [
        { size: '7"', quantity: 12 }
      ],
      type: 'Standard'
    },
  ]);

  const filteredTools = tools.filter(t => {
    const matchesGroup =
      selectedGroup === 'ALL' ? true : t.group === selectedGroup;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const totalCount = tools.reduce((sum, t) => sum + t.available, 0);

  const handleAddSize = () => {
    setNewTool({
      ...newTool,
      sizes: [...newTool.sizes, { size: '', quantity: 0 }],
    });
  };

  const handleRemoveSize = (index: number) => {
    setNewTool({
      ...newTool,
      sizes: newTool.sizes.filter((_, i) => i !== index),
    });
  };

  const handleUpdateSize = (index: number, field: 'size' | 'quantity', value: string | number) => {
    const updatedSizes = [...newTool.sizes];
    updatedSizes[index] = {
      ...updatedSizes[index],
      [field]: field === 'quantity' ? Number(value) : value,
    };
    setNewTool({
      ...newTool,
      sizes: updatedSizes,
    });
  };

  const handleAddTool = () => {
    if (!newTool.name.trim()) {
      alert('Please enter a tool name');
      return;
    }

    // Validate sizes
    const validSizes = newTool.sizes.filter(s => s.size.trim() && s.quantity > 0);
    if (validSizes.length === 0) {
      alert('Please add at least one size with quantity');
      return;
    }

    const toolId = `${newTool.group.toLowerCase()}-${newTool.name.toLowerCase().replace(/\s+/g, '-')}`;
    const totalAvailable = validSizes.reduce((sum, s) => sum + s.quantity, 0);

    const tool: Tool = {
      id: toolId,
      name: newTool.name.toUpperCase(),
      group: newTool.group,
      available: totalAvailable,
      sizes: validSizes,
      type: newTool.type || undefined,
    };

    setTools([...tools, tool]);
    setNewTool({
      name: '',
      group: 'TRS',
      type: '',
      sizes: [{ size: '', quantity: 0 }]
    });
    setShowAddModal(false);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    try {
      // For CSV files (simple text parsing)
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('CSV file must have at least a header row and one data row');
          return;
        }

        // Parse CSV header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('tool'));
        const groupIdx = headers.findIndex(h => h.includes('group') || h.includes('type'));
        const sizeIdx = headers.findIndex(h => h.includes('size'));
        const typeIdx = headers.findIndex(h => h.includes('type') && !h.includes('group'));
        const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('available'));

        if (nameIdx === -1) {
          alert('CSV file must have a "Name" or "Tool" column');
          return;
        }

        // Group by tool name to collect all sizes
        const toolMap = new Map<string, Tool>();

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (!values[nameIdx]) continue; // Skip empty rows

          const toolName = values[nameIdx].toUpperCase();
          const group = (values[groupIdx]?.toUpperCase() === 'DHT' ? 'DHT' : 'TRS') as ToolGroupKey;
          const size = sizeIdx >= 0 && values[sizeIdx] ? values[sizeIdx].trim() : undefined;
          const type = typeIdx >= 0 ? values[typeIdx] : undefined;
          const quantity = qtyIdx >= 0 ? parseInt(values[qtyIdx]) || 0 : 1;

          const toolId = `${group.toLowerCase()}-${toolName.toLowerCase().replace(/\s+/g, '-')}`;

          if (toolMap.has(toolId)) {
            // Tool exists, add size to existing tool
            const existingTool = toolMap.get(toolId)!;
            if (size && quantity > 0) {
              // Check if size already exists
              const sizeIndex = existingTool.sizes.findIndex(s => s.size === size);
              if (sizeIndex >= 0) {
                // Update quantity for existing size
                existingTool.sizes[sizeIndex].quantity += quantity;
              } else {
                // Add new size
                existingTool.sizes.push({ size, quantity });
              }
              // Recalculate total available
              existingTool.available = existingTool.sizes.reduce((sum, s) => sum + s.quantity, 0);
            }
          } else {
            // New tool
            const sizes: ToolSize[] = size && quantity > 0 ? [{ size, quantity }] : [];
            toolMap.set(toolId, {
              id: toolId,
              name: toolName,
              group,
              available: quantity,
              sizes,
              type,
            });
          }
        }

        const importedTools = Array.from(toolMap.values());

        if (importedTools.length > 0) {
          setTools(prev => {
            // Merge with existing tools, update if exists, add if new
            const existingMap = new Map(prev.map(t => [t.id, t]));

            importedTools.forEach(imported => {
              if (existingMap.has(imported.id)) {
                // Merge sizes for existing tool
                const existing = existingMap.get(imported.id)!;
                const sizeMap = new Map(existing.sizes.map(s => [s.size, s.quantity]));

                // Add/update sizes from imported tool
                imported.sizes.forEach(s => {
                  if (sizeMap.has(s.size)) {
                    sizeMap.set(s.size, sizeMap.get(s.size)! + s.quantity);
                  } else {
                    sizeMap.set(s.size, s.quantity);
                  }
                });

                // Update existing tool
                existing.sizes = Array.from(sizeMap.entries()).map(([size, quantity]) => ({
                  size,
                  quantity,
                }));
                existing.available = existing.sizes.reduce((sum, s) => sum + s.quantity, 0);
                if (imported.type) existing.type = imported.type;
              } else {
                // Add new tool
                existingMap.set(imported.id, imported);
              }
            });

            return Array.from(existingMap.values());
          });
          alert(`Successfully imported ${importedTools.length} tool(s) with their sizes`);
          setShowImportModal(false);
          setImportFile(null);
        } else {
          alert('No valid tools found in the file');
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, xlsx library is required
        // Show helpful message and instructions
        const installMessage = `Excel file import requires the xlsx library to be installed.

To enable Excel import, please run:

cd frontend
npm install xlsx

Then restart your development server.

Alternatively, you can save your Excel file as CSV format (.csv) and import it directly - CSV import works immediately without any installation.`;

        alert(installMessage);
        setImportFile(null);
        // NOTE: Excel import code removed to prevent Vite build errors
        // After installing xlsx: npm install xlsx
        // Re-enable Excel import functionality in a separate commit
      } else {
        alert('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        setImportFile(null);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please check the file format.');
      setImportFile(null);
    }
  };

  const handleEditQuantity = (tool: Tool, sizeIndex: number) => {
    setEditingTool(tool);
    setEditSizeIndex(sizeIndex);
    setEditQuantity(tool.sizes[sizeIndex]?.quantity || 0);
  };

  const handleUpdateQuantity = () => {
    if (editingTool && editSizeIndex >= 0 && editQuantity >= 0) {
      setTools(
        tools.map(tool => {
          if (tool.id === editingTool.id) {
            const updatedSizes = [...tool.sizes];
            updatedSizes[editSizeIndex] = {
              ...updatedSizes[editSizeIndex],
              quantity: editQuantity,
            };
            const totalAvailable = updatedSizes.reduce((sum, s) => sum + s.quantity, 0);
            return {
              ...tool,
              sizes: updatedSizes,
              available: totalAvailable,
            };
          }
          return tool;
        })
      );
      setEditingTool(null);
      setEditSizeIndex(-1);
      setEditQuantity(0);
    }
  };

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Overview of TRS and DHT tools with available quantities.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:from-green-500 hover:to-green-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Tools</span>
            </button>
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
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters + search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedGroup === 'ALL'
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              All Tools
            </button>
            <button
              onClick={() => setSelectedGroup('TRS')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedGroup === 'TRS'
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              TRS
            </button>
            <button
              onClick={() => setSelectedGroup('DHT')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedGroup === 'DHT'
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sizes & Quantities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTools.filter(t => t.group === 'TRS').map((tool) => (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {tool.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            onClick={() => handleEditQuantity(tool, idx)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            title="Click to edit quantity"
                          >
                            {size.size}: {size.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {tool.available}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sizes & Quantities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTools.filter(t => t.group === 'DHT').map((tool) => (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {tool.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            onClick={() => handleEditQuantity(tool, idx)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            title="Click to edit quantity"
                          >
                            {size.size}: {size.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {tool.available}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Tool</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tool Name</label>
                    <input
                      type="text"
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g. CRT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <select
                      value={newTool.group}
                      onChange={(e) => setNewTool({ ...newTool, group: e.target.value as ToolGroupKey })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="TRS">TRS</option>
                      <option value="DHT">DHT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sizes & Quantities</label>
                    {newTool.sizes.map((size, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={size.size}
                          onChange={(e) => handleUpdateSize(index, 'size', e.target.value)}
                          className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Size (e.g. 5&quot;)"
                        />
                        <input
                          type="number"
                          value={size.quantity}
                          onChange={(e) => handleUpdateSize(index, 'quantity', Number(e.target.value))}
                          className="block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Qty"
                          min="0"
                        />
                        {newTool.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Another Size
                    </button>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddTool}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Add Tool
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Modal */}
      {editingTool && editSizeIndex >= 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setEditingTool(null)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Quantity</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {editingTool.name} - Size: {editingTool.sizes[editSizeIndex].size}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    min="0"
                  />
                </div>

                <div className="mt-5 sm:mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleUpdateQuantity}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTool(null);
                      setEditSizeIndex(-1);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowImportModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Import Tools</h3>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with columns for Name, Group (TRS/DHT), Size, and Quantity.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileImport}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload file
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        CSV, Excel
                      </span>
                    </label>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                    <p className="font-semibold mb-1">Expected Format:</p>
                    <p>Name, Group, Size, Quantity</p>
                    <p className="text-gray-400 mt-1">Example: CRT, TRS, 5&quot;, 10</p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Inventory;
