import { useState } from 'react';
import MainLayout from '../components/MainLayout';

interface Rig {
  id: string;
  rigNumber: number;
  name: string;
  status: string;
  location?: string;
  customerName?: string;
}

const Rigs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Generate Rigs 1 to 100
  const rigs: Rig[] = Array.from({ length: 100 }, (_, i) => ({
    id: `rig-${i + 1}`,
    rigNumber: i + 1,
    name: `Rig ${i + 1}`,
    status: 'Active',
    location: '--',
    customerName: '--',
  }));

  const filteredRigs = rigs.filter(rig =>
    rig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rig.rigNumber.toString().includes(searchTerm) ||
    (rig.location && rig.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rig.customerName && rig.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout
      headerContent={
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">Rigs</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all your rigs</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Rig</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rigs..."
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

        {/* Rigs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rig #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRigs.map((rig) => (
                <tr key={rig.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rig.rigNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rig.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rig.location || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rig.customerName || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {rig.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-600 hover:text-gray-900">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">No rigs found.</div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Displaying {filteredRigs.length} of {rigs.length} rigs
        </div>
      </div>
    </MainLayout>
  );
};

export default Rigs;
