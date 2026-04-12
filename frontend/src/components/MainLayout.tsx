import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import UserAvatarMenu from './UserAvatarMenu';
import ThemeToggler from './ThemeToggler';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const ChevronDown = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface MainLayoutProps {
    children: ReactNode;
    headerContent?: ReactNode;
}

const MainLayout = ({ children, headerContent }: MainLayoutProps) => {
    useAuthStore();
    const { can } = usePermissions();
    const [showOperationsMenu, setShowOperationsMenu] = useState(false);
    const [showClientsMenu, setShowClientsMenu] = useState(false);
    const [showMaintenanceMenu, setShowMaintenanceMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const NavLink = ({ to, icon, label, active }: { to: string; icon: ReactNode; label: string; active: boolean }) => (
        <Link
            to={to}
            className={`group relative flex items-center gap-3 rounded-xl py-2.5 px-4 font-semibold text-sm transition-all duration-300 ${active
                ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {/* Active indicator bar */}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-r-full shadow-[0_0_8px_rgba(25,86,168,0.6)]"></div>
            )}
            <div className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {icon}
            </div>
            <span className="tracking-wide">{label}</span>
        </Link>
    );

    return (
        <div className="h-screen flex overflow-hidden bg-slate-100 dark:bg-boxdark-2">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 z-[9999] flex h-screen w-72 flex-col overflow-y-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Decorative gradient line at top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-500"></div>

                {/* OTEC Logo Area */}
                <div className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
                    <Link to="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
                        <div className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-[0_4px_15px_rgba(25,86,168,0.3)] group-hover:shadow-[0_4px_20px_rgba(25,86,168,0.5)] transition-shadow duration-300">
                            <img src="/logo.png" alt="OTEC" className="h-7 w-auto object-contain brightness-0 invert" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white tracking-[0.15em]">OTEC</span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Oil Technology</span>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar py-6">
                    {/* Navigation */}
                    <nav className="px-4">
                        {/* Main Menu Label */}
                        <div className="mb-4 px-4">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em]">Main Menu</span>
                        </div>

                        <ul className="space-y-1">
                            {/* Dashboard */}
                            {can('dashboard', 'view') && (
                            <li>
                                <NavLink
                                    to="/dashboard"
                                    active={location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')}
                                    label="Dashboard"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                                />
                            </li>
                            )}

                            {/* Operations (Tools only — Inventory is now top-level) */}
                            {can('operations', 'view') && (
                            <li>
                                <button
                                    onClick={() => setShowOperationsMenu(!showOperationsMenu)}
                                    className={`group relative flex w-full items-center justify-between gap-3 rounded-xl py-2.5 px-4 font-semibold text-sm transition-all duration-300 ${isActive('/operations') ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {isActive('/operations') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-r-full shadow-[0_0_8px_rgba(25,86,168,0.6)]"></div>}
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 transition-colors duration-300 ${isActive('/operations') ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="tracking-wide">Operations</span>
                                    </div>
                                    <ChevronDown className={`transition-transform duration-300 text-slate-500 ${showOperationsMenu || isActive('/operations') ? 'rotate-180 text-slate-300' : ''}`} />
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showOperationsMenu || isActive('/operations') ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <ul className="mt-2 ml-8 space-y-1 border-l border-white/10 pl-4">
                                        <li><Link to="/operations/tools" onClick={() => setSidebarOpen(false)} className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${location.pathname === '/operations/tools' ? 'text-blue-400 font-semibold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Tools</Link></li>
                                    </ul>
                                </div>
                            </li>
                            )}

                            {/* Orders */}
                            {can('orders', 'view') && (
                            <li>
                                <NavLink
                                    to="/orders"
                                    active={location.pathname === '/orders'}
                                    label="Orders"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                                />
                            </li>
                            )}

                            {/* Inventory — top-level */}
                            {can('inventory', 'view') && (
                            <li>
                                <NavLink
                                    to="/inventory"
                                    active={isActive('/inventory')}
                                    label="Inventory"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                                />
                            </li>
                            )}

                            {/* Maintenance — top-level */}
                            {can('maintenance', 'view') && (
                            <li>
                                <button
                                    onClick={() => setShowMaintenanceMenu(!showMaintenanceMenu)}
                                    className={`group relative flex w-full items-center justify-between gap-3 rounded-xl py-2.5 px-4 font-semibold text-sm transition-all duration-300 ${isActive('/maintenance') ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {isActive('/maintenance') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-500 rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>}
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 transition-colors duration-300 ${isActive('/maintenance') ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                        </svg>
                                        <span className="tracking-wide">Maintenance</span>
                                    </div>
                                    <ChevronDown className={`transition-transform duration-300 text-slate-500 ${showMaintenanceMenu || isActive('/maintenance') ? 'rotate-180 text-slate-300' : ''}`} />
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMaintenanceMenu || isActive('/maintenance') ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <ul className="mt-2 ml-8 space-y-1 border-l border-white/10 pl-4">
                                        <li><Link to="/maintenance" onClick={() => setSidebarOpen(false)} className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${location.pathname === '/maintenance' ? 'text-amber-400 font-semibold bg-amber-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Overview</Link></li>
                                    </ul>
                                </div>
                            </li>
                            )}

                            {/* Clients */}
                            {can('customers', 'view') && (
                            <li>
                                <button
                                    onClick={() => setShowClientsMenu(!showClientsMenu)}
                                    className={`group relative flex w-full items-center justify-between gap-3 rounded-xl py-2.5 px-4 font-semibold text-sm transition-all duration-300 ${isActive('/clients') ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {isActive('/clients') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-r-full shadow-[0_0_8px_rgba(25,86,168,0.6)]"></div>}
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 transition-colors duration-300 ${isActive('/clients') ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="tracking-wide">Clients</span>
                                    </div>
                                    <ChevronDown className={`transition-transform duration-300 text-slate-500 ${showClientsMenu || isActive('/clients') ? 'rotate-180 text-slate-300' : ''}`} />
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showClientsMenu || isActive('/clients') ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <ul className="mt-2 ml-8 space-y-1 border-l border-white/10 pl-4">
                                        <li><Link to="/clients/customers" onClick={() => setSidebarOpen(false)} className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${location.pathname === '/clients/customers' ? 'text-blue-400 font-semibold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Customers</Link></li>
                                        <li><Link to="/clients/locations" onClick={() => setSidebarOpen(false)} className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${location.pathname === '/clients/locations' ? 'text-blue-400 font-semibold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Locations</Link></li>
                                        <li><Link to="/clients/rigs" onClick={() => setSidebarOpen(false)} className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200 ${location.pathname === '/clients/rigs' ? 'text-blue-400 font-semibold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Rigs</Link></li>
                                    </ul>
                                </div>
                            </li>
                            )}

                            {/* Reports */}
                            {can('reports', 'view') && (
                            <li>
                                <NavLink
                                    to="/reports"
                                    active={location.pathname === '/reports'}
                                    label="Reports"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                />
                            </li>
                            )}
                        </ul>

                        {(can('users', 'view') || can('roles', 'view')) && (
                            <div className="mt-8">
                                <div className="mb-4 px-4 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.25em]">Administration</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                                </div>
                                <ul className="space-y-1">
                                    {can('users', 'view') && (
                                    <li>
                                        <NavLink
                                            to="/users"
                                            active={isActive('/users')}
                                            label="Users"
                                            icon={(
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        />
                                    </li>
                                    )}
                                    {can('roles', 'view') && (
                                    <li>
                                        <NavLink
                                            to="/roles"
                                            active={isActive('/roles')}
                                            label="Roles"
                                            icon={(
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            )}
                                        />
                                    </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </nav>
                </div>

                {/* Sidebar Footer */}
                <div className="border-t border-white/5 p-4 flex items-center justify-between gap-2 bg-slate-900/50 backdrop-blur-sm">
                    <ThemeToggler />
                    <UserAvatarMenu />
                </div>
            </aside>

            {/* Main Content Areas */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-auto">
                {/* Header */}
                <header className="sticky top-0 z-999 flex w-full glass-premium dark:bg-boxdark/90 dark:backdrop-blur-md border-b border-slate-200/50 dark:border-white/5">
                    <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-boxdark border border-slate-200 dark:border-strokedark shadow-sm hover:shadow-md transition-all"
                        >
                            <svg className="w-5 h-5 text-slate-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="hidden sm:block w-full">
                            {headerContent}
                        </div>

                        <div className="flex items-center gap-3 2xsm:gap-7">
                            {/* Controls moved to sidebar */}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
