import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showOperationsMenu, setShowOperationsMenu] = useState(false);
  const [showClientsMenu, setShowClientsMenu] = useState(true);

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>Customers</span>
                    </Link>
                    <Link
                      to="/clients/locations"
                      className="flex items-center space-x-3 px-4 py-2 text-sm bg-primary-700 text-white rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <span>Locations</span>
                    </Link>
                    <Link
                      to="/clients/rigs"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-blue-50 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
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

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all your locations</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Location</span>
              </button>
            </div>

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
      </div>
    </div>
  );
};

export default Locations;

