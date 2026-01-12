import { useState } from 'react';
import MainLayout from '../components/MainLayout';

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('orders');

  const reportTypes = [
    { id: 'orders', name: 'Orders Report', icon: '📋', description: 'View order statistics and analytics' },
    { id: 'tools', name: 'Tools Report', icon: '🔧', description: 'Track tool usage and availability' },
    { id: 'customers', name: 'Customers Report', icon: '👥', description: 'Customer activity and insights' },
    { id: 'inventory', name: 'Inventory Report', icon: '📦', description: 'Inventory levels and movements' },
    { id: 'financial', name: 'Financial Report', icon: '💰', description: 'Revenue and financial metrics' },
    { id: 'maintenance', name: 'Maintenance Report', icon: '🔨', description: 'Maintenance schedules and history' },
  ];

  const sampleData = {
    orders: {
      totalOrders: 156,
      activeOrders: 42,
      completedOrders: 98,
      revenue: '$245,680',
      averageOrderValue: '$1,575',
      topCustomer: 'Kuwait Oil Company',
    },
    tools: {
      totalTools: 120,
      onsite: 45,
      available: 58,
      inService: 17,
      utilizationRate: '75%',
      mostUsed: 'CRT',
    },
    customers: {
      totalCustomers: 28,
      activeCustomers: 18,
      newCustomers: 5,
      totalRevenue: '$1,245,680',
      averageOrderValue: '$1,575',
      topCustomer: 'Kuwait Oil Company',
    },
  };

  const currentData = sampleData[selectedReportType as keyof typeof sampleData] || sampleData.orders;

  return (
    <MainLayout
      headerContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive insights and analytics for your operations</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-medium hover:from-primary-500 hover:to-primary-600 hover:shadow-md transition-all duration-200 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReportType(report.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${selectedReportType === report.id
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{report.icon}</div>
                {selectedReportType === report.id && (
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-600">{report.description}</p>
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {reportTypes.find((r) => r.id === selectedReportType)?.name}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {Object.entries(currentData).map(([key, value]) => (
              <div
                key={key}
                className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-5"
              >
                <div className="text-sm font-medium text-gray-600 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-500 font-medium">Visual Analytics Chart</p>
            <p className="text-sm text-gray-400 mt-1">Chart visualization will be displayed here</p>
          </div>

          {/* Data Table Placeholder */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Data</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 font-medium">Data Table</p>
              <p className="text-sm text-gray-400 mt-1">Detailed data table will be displayed here</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
