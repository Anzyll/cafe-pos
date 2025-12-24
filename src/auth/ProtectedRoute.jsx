import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect based on role if they try to access unauthorized pages
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'waiter') return <Navigate to="/waiter" replace />;
        if (role === 'cashier') return <Navigate to="/cashier" replace />;
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
