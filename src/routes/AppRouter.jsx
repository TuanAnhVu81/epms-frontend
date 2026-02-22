import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import VendorPage from '../pages/VendorPage';
import MaterialPage from '../pages/MaterialPage';
import PurchaseOrderPage from '../pages/PurchaseOrderPage';
import POCreatePage from '../pages/POCreatePage';
import POEditPage from '../pages/POEditPage';
import PODetailPage from '../pages/PODetailPage';
import ApprovalPage from '../pages/ApprovalPage';
import { ROLES } from '../utils/constants';

export default function AppRouter() {
    return (
        <Routes>
            {/* Public routes — no auth required */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — must be authenticated */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                    {/* Root → redirect to dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* ADMIN only routes */}
                    <Route element={<RoleGuard roles={[ROLES.ADMIN]} />}>
                        <Route path="/vendors" element={<VendorPage />} />
                        <Route path="/materials" element={<MaterialPage />} />
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
