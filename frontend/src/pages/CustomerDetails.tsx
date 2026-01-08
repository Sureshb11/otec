import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const CustomerDetails = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'address'>('details');
  const [showOperationsMenu, setShowOperationsMenu] = useState(false);
  const [showClientsMenu, setShowClientsMenu] = useState(false);

  // Mock customer data - will be replaced with API calls later
  const customer = {
    id: customerId || '1',
    customerNumber: 9,
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah.smith@sample.com',
    phone: '--',
    fax: '--',
    department: '--',
    identificationNumber: '--',
    category: 'Good',
    status: 'Non-Login',
    taxed: true,
    subscribedToAlerts: false,
    loginEnabled: false,
    webstoreSignUp: false,
    markedAsEngaged: false,
    description: '--',
    assignedTo: '--',
    secondaryEmails: '--',
    lastLoginAt: '--',
    createdAt: '30-12-2025 01:16',
    rentedOutOrders: 0,
    completedOrders: 0,
    customerRevenue: 0.00,
    canReceiveEmails: false,
    ordersCount: 1,
    addressBookCount: 1,
  };

  const customerOrders = [
    {
      id: '1',
      orderNumber: 2,
      price: 168.30,
      rentOutDate: '30-11-2025 01:16',
      returnDate: '05-12-2025 01:16',
      status: 'Booked',
    },
  ];

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
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>
              {/* Operations with submenu */}
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
              <Link
                to="/orders"
                className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
              <Link
                to="/customers"
                className="flex items-center space-x-3 px-4 py-3 bg-primary-700 text-white rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Customers</span>
              </Link>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-primary-700 hover:shadow-md transition-all duration-200 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Reports</span>
              </a>
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
        <div className="flex-1">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <button
              onClick={() => navigate('/orders')}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              ← Back to Orders
            </button>
          </div>

          {/* Customer Header Section */}
          <div className="bg-primary-50 border-b border-gray-200 px-6 py-6">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center border-2 border-gray-400">
                <span className="text-gray-500 text-sm text-center px-2">NO IMAGE AVAILABLE</span>
              </div>

              {/* Customer Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {customer.firstName} {customer.lastName}
                    </h1>
                    {!customer.canReceiveEmails && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Customer cannot receive emails</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>EDIT</span>
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span>MARK INACTIVE</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigate(`/orders/new?customerId=${customerId}`)}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>NEW ORDER</span>
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>PRINT LABEL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders ({customer.ordersCount})
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'address'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Address Book ({customer.addressBookCount})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Customer#</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.customerNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Rented Out Orders</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.rentedOutOrders}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Subscribed to Alerts</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.subscribedToAlerts ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                          <span>Customer Revenue (Excluding Tax)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">${customer.customerRevenue.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Identification Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.identificationNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.category}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Login At</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.lastLoginAt}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Webstore sign up</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.webstoreSignUp ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.description}</dd>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Completed Orders</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.completedOrders}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Taxed</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.taxed ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Department</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.department}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Fax</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.fax}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.assignedTo}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Login Enabled</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.loginEnabled ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                          <span>Created At</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.createdAt}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Secondary Emails</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.secondaryEmails}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Marked as Engaged</dt>
                        <dd className="mt-1 text-sm text-gray-900">{customer.markedAsEngaged ? 'Yes' : 'No'}</dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files and Comments Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Files Section */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>Files 0</span>
                      </h3>
                      <button className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200">
                        + ATTACH FILE
                      </button>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">CUSTOMER DOCUMENTS</h4>
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">No Files found</p>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Comments 0</span>
                      </h3>
                      <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
                        <option>All Comments</option>
                        <option>Recent</option>
                        <option>Oldest</option>
                      </select>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm mb-4">No Comments found</p>
                      <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200">
                        ADD COMMENT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Orders</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ORDER #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRICE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RENT OUT DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RETURN DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderNumber}
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
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Book</h2>
                <p className="text-gray-600">No addresses found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;

