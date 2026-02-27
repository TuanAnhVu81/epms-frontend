import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import VendorPage from '../pages/VendorPage';
import MaterialPage from '../pages/MaterialPage';
import UserManagementPage from '../pages/UserManagementPage';
import PurchaseOrderPage from '../pages/PurchaseOrderPage';
import POCreatePage from '../pages/POCreatePage';
import POEditPage from '../pages/POEditPage';
import PODetailPage from '../pages/PODetailPage';
import ApprovalPage from '../pages/ApprovalPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import { ROLES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

// Smart redirect based on role and requirePasswordChange flag
const RootRedirect = () => {
    const user = useAuthStore(s => s.user);
    // Force first-time password change
    if (user?.requirePasswordChange) {
        return <Navigate to="/change-password" replace />;
    }
    if (user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.MANAGER)) {
        return <Navigate to="/dashboard" replace />;
    }
    if (user?.roles?.includes(ROLES.EMPLOYEE)) {
        return <Navigate to="/my-orders" replace />;
    }
    return <Navigate to="/login" replace />;
};

// Guard: if requirePasswordChange, force to /change-password even on direct navigation
const RequirePasswordChangeGuard = ({ children }) => {
    const user = useAuthStore(s => s.user);
    if (user?.requirePasswordChange) {
        return <Navigate to="/change-password" replace />;
    }
    return children;
};

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Force password change — authenticated but isolated (no AppLayout) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>

            {/* Protected routes — must be authenticated */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                    {/* Root → redirect based on role */}
                    <Route index element={<RootRedirect />} />

                    {/* ADMIN & MANAGER routes (Dashboards) */}
                    <Route element={<RoleGuard roles={[ROLES.ADMIN, ROLES.MANAGER]} />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                    </Route>

                    {/* ADMIN only routes */}
                    <Route element={<RoleGuard roles={[ROLES.ADMIN]} />}>
                        <Route path="/vendors" element={<VendorPage />} />
                        <Route path="/materials" element={<MaterialPage />} />
                        <Route path="/users" element={<UserManagementPage />} />
                    </Route>

                    {/* EMPLOYEE only routes */}
                    <Route element={<RoleGuard roles={[ROLES.EMPLOYEE]} />}>
                        <Route path="/my-orders" element={<PurchaseOrderPage />} />
                        <Route path="/my-orders/create" element={<POCreatePage />} />
                        <Route path="/my-orders/:id/edit" element={<POEditPage />} />
                    </Route>

                    {/* MANAGER only routes */}
                    <Route element={<RoleGuard roles={[ROLES.MANAGER]} />}>
                        <Route path="/approvals" element={<ApprovalPage />} />
                    </Route>

                    {/* Shared — all authenticated roles can view PO detail */}
                    <Route path="/purchase-orders/:id" element={<PODetailPage />} />

                </Route>
            </Route>

            {/* Fallback: redirect any unknown route to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

