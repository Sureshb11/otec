import { useAuthStore } from '../store/authStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isUsersPage = location.pathname === '/users';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              {!isUsersPage && <h1 className="text-xl font-bold text-gray-900">OTEC</h1>}
              <div className="flex space-x-4">
                {!isUsersPage && (
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/dashboard')
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {isAdmin() && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Admin Panel
                    </Link>
                    <Link
                      to="/users"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/users')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Users
                    </Link>
                    <Link
                      to="/roles"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/roles') || isActive('/roles/assign')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Roles
                    </Link>
                  </>
                )}
                <Link
                  to="/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/settings')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900 block">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.roles?.join(', ') || 'user'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


