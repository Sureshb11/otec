import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import UserAvatarMenu from './UserAvatarMenu';

interface MainLayoutProps {
    children: ReactNode;
    headerContent?: ReactNode;
}

const MainLayout = ({ children, headerContent }: MainLayoutProps) => {
    const { isAdmin } = useAuthStore();
    const [showOperationsMenu, setShowOperationsMenu] = useState(false);
    const [showClientsMenu, setShowClientsMenu] = useState(false);
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 flex flex-col shadow-2xl flex-shrink-0 z-50">
                <div className="flex flex-col h-full">
                    {/* OTEC Logo */}
                    <div className="px-4 pt-6 pb-4 flex-shrink-0 border-b border-primary-700/50">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/logo.png"
                                alt="OTEC Logo"
                                className="h-10 w-auto object-contain flex-shrink-0"
                            />
                            <div className="flex flex-col justify-center">
                                <h1 className="text-2xl font-bold text-white leading-tight">O T E C</h1>
                                <p className="text-[9px] text-blue-200 font-medium leading-tight mt-0.5">OIL TECHNOLOGY</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 min-h-0 custom-scrollbar">
                        {/* Dashboard */}
                        <Link
                            to="/dashboard"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === '/dashboard'
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                                : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                }`}
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
                                className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 rounded-lg ${isActive('/operations')
                                    ? 'bg-primary-700 text-white shadow-md'
                                    : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                                    </svg>
                                    <span>Operations</span>
                                </div>
                                <svg
                                    className={`w-4 h-4 transform transition-transform ${showOperationsMenu || isActive('/operations') ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {(showOperationsMenu || isActive('/operations')) && (
                                <div className="mt-1 ml-4 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    <Link
                                        to="/operations/tools"
                                        className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${location.pathname === '/operations/tools'
                                            ? 'bg-primary-600 text-white'
                                            : 'text-blue-50 hover:bg-primary-600'
                                            }`}
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
                                        className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${location.pathname === '/operations/inventory'
                                            ? 'bg-primary-600 text-white'
                                            : 'text-blue-50 hover:bg-primary-600'
                                            }`}
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
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname.startsWith('/orders')
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                                : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                }`}
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
                                className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 rounded-lg ${isActive('/clients')
                                    ? 'bg-primary-700 text-white shadow-md'
                                    : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                    }`}
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
                                    className={`w-4 h-4 transform transition-transform ${showClientsMenu || isActive('/clients') ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {(showClientsMenu || isActive('/clients')) && (
                                <div className="mt-1 ml-4 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    <Link
                                        to="/clients/customers"
                                        className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${location.pathname === '/clients/customers'
                                            ? 'bg-primary-600 text-white'
                                            : 'text-blue-50 hover:bg-primary-600'
                                            }`}
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
                                        className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${location.pathname === '/clients/locations'
                                            ? 'bg-primary-600 text-white'
                                            : 'text-blue-50 hover:bg-primary-600'
                                            }`}
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
                                        className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:shadow-sm ${location.pathname === '/clients/rigs'
                                            ? 'bg-primary-600 text-white'
                                            : 'text-blue-50 hover:bg-primary-600'
                                            }`}
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
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === '/reports'
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                                : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                }`}
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

                        {/* Users (Admin Only) */}
                        {isAdmin() && (
                            <Link
                                to="/users"
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/users')
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                                    : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                    }`}
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
                        )}

                        {/* Roles (Admin Only) */}
                        {isAdmin() && (
                            <Link
                                to="/roles"
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/roles')
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                                    : 'text-blue-100 hover:bg-primary-700 hover:shadow-md'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                                <span>Roles</span>
                            </Link>
                        )}
                    </nav>

                    {/* User Avatar - Fixed at bottom */}
                    <UserAvatarMenu />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {headerContent && (
                        <div className="mb-6 animate-slideDown">
                            {headerContent}
                        </div>
                    )}
                    <div className="animate-fadeIn">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
