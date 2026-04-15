import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import RoleCRUD from './pages/RoleCRUD';
import RolePermissions from './pages/RolePermissions';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';
import Settings from './pages/Settings';
import Orders from './pages/Orders';
import CustomerDetails from './pages/CustomerDetails';
import OrderDetails from './pages/OrderDetails';
import Inventory from './pages/Inventory';
import Tools from './pages/Tools';
import Customers from './pages/Customers';
import Locations from './pages/Locations';
import Rigs from './pages/Rigs';
import Reports from './pages/Reports';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import ToolBoard from './pages/SingleView';
import { MaintenanceOverview, MaintenanceToolDetail } from './pages/Maintenance';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route
            path="/request-password-reset"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <RequestPasswordReset />}
          />
          <Route
            path="/reset-password"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <ResetPassword />}
          />
          {/* Public registration disabled - only admins can create users */}
          {/* <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} /> */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operations/tools"
            element={
              <ProtectedRoute>
                <PermissionRoute module="operations">
                  <Tools />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <PermissionRoute module="orders">
                  <Orders />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />


          <Route
            path="/operations/inventory"
            element={<Navigate to="/inventory" replace />}
          />
          {/* Inventory — top-level */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <PermissionRoute module="inventory">
                  <Inventory />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/customers"
            element={
              <ProtectedRoute>
                <PermissionRoute module="customers">
                  <Customers />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/locations"
            element={
              <ProtectedRoute>
                <PermissionRoute module="locations">
                  <Locations />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/rigs"
            element={
              <ProtectedRoute>
                <PermissionRoute module="rigs">
                  <Rigs />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <PermissionRoute module="reports">
                  <Reports />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          {/* Tool Board — TV display, no MainLayout wrapper (full-screen) */}
          <Route
            path="/dashboard/tool-board"
            element={
              <ProtectedRoute>
                <ToolBoard />
              </ProtectedRoute>
            }
          />
          {/* Maintenance */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <PermissionRoute module="maintenance">
                  <MaintenanceOverview />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance/:toolId"
            element={
              <ProtectedRoute>
                <PermissionRoute module="maintenance">
                  <MaintenanceToolDetail />
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout>
                  <AdminPanel />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <PermissionRoute module="users">
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <PermissionRoute module="roles">
                  <MainLayout>
                    <RoleCRUD />
                  </MainLayout>
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/assign"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout>
                  <RoleManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:roleId/permissions"
            element={
              <ProtectedRoute>
                <PermissionRoute module="roles" action="edit">
                  <MainLayout>
                    <RolePermissions />
                  </MainLayout>
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/create"
            element={
              <ProtectedRoute>
                <PermissionRoute module="users" action="add">
                  <MainLayout>
                    <CreateUser />
                  </MainLayout>
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute>
                <PermissionRoute module="users" action="edit">
                  <MainLayout>
                    <EditUser />
                  </MainLayout>
                </PermissionRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;


