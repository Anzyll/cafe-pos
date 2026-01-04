import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/Dashboard';
import WaiterDashboard from './pages/waiter/Dashboard';
import TakeOrder from './pages/waiter/TakeOrder';
import CashierDashboard from './pages/cashier/Dashboard';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<Layout />}>
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Waiter Routes */}
            <Route element={<ProtectedRoute allowedRoles={['waiter']} />}>
              <Route path="/waiter" element={<WaiterDashboard />} />
              <Route path="/waiter/table/:tableId" element={<TakeOrder />} />
            </Route>

            {/* Cashier Routes */}
            <Route element={<ProtectedRoute allowedRoles={['cashier', 'admin']} />}>
              <Route path="/cashier" element={<CashierDashboard />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
         <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastStyle={{
          borderLeft: "6px solid #EA6031",
          fontWeight: 500
        }}
      />
    </AuthProvider>
    
  );
}

export default App;
