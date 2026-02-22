import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Redirect to / if user does not have any of the required roles
export default function RoleGuard({ roles }) {
    const user = useAuthStore((s) => s.user);
    // Check if user has at least one of the required roles
    const hasRole = roles.some((r) => user?.roles?.includes(r));
    return hasRole ? <Outlet /> : <Navigate to="/" replace />;
}
