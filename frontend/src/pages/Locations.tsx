import { useState } from 'react';
import MainLayout from '../components/MainLayout';

interface Location {
  id: string;
  locationNumber: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  status: string;
  customerName?: string;
}

const Locations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock locations data - will be replaced with API calls later
  const locations: Location[] = [
    {
      id: '1',
      locationNumber: 1,
      name: 'North Kuwait',
      address: 'North Kuwait',
      city: 'North Kuwait',
      country: 'Kuwait',
      phone: '--',
      status: 'Active',
    },
    {
      id: '2',
      locationNumber: 2,
      name: 'West Kuwait',
      address: 'West Kuwait',
      city: 'West Kuwait',
      country: 'Kuwait',
      phone: '--',
      status: 'Active',
    },
    {
      id: '3',
      locationNumber: 3,
      name: 'South East Kuwait',
      address: 'South East Kuwait',
      city: 'South East Kuwait',
      country: 'Kuwait',
      phone: '--',
      status: 'Active',
    },
    {
      id: '4',
      locationNumber: 4,
      name: 'Gas Field',
      address: 'Gas Field',
      city: 'Gas Field',
      country: 'Kuwait',
      phone: '--',
      status: 'Active',
    },
  ];

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.locationNumber.toString().includes(searchTerm)
  );

  return (
    <MainLayout
      headerContent={
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">Locations</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all your locations</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Location</span>
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
            placeholder="Search locations..."
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

        {/* Locations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
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
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {location.locationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {location.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {location.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {location.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {location.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {location.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {location.customerName || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {location.status}
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
          {filteredLocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">No locations found.</div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Displaying {filteredLocations.length} of {locations.length} locations
        </div>
      </div>
    </MainLayout>
  );
};

export default Locations;
