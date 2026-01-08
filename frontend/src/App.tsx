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
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
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
              <Tools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:customerId"
          element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operations/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/locations"
          element={
            <ProtectedRoute>
              <Locations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/rigs"
          element={
            <ProtectedRoute>
              <Rigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <RoleCRUD />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/assign"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <RoleManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/:roleId/permissions"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <RolePermissions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/create"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <CreateUser />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;


