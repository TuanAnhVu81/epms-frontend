import { Menu, Layout } from 'antd';
import {
    DashboardOutlined, ShopOutlined, AppstoreOutlined,
    FileTextOutlined, CheckCircleOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../utils/constants';

const { Sider } = Layout;

export default function Sidebar({ collapsed }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = useAuthStore((s) => s.user);

    const isAdmin = user?.roles?.includes(ROLES.ADMIN);
    const isEmployee = user?.roles?.includes(ROLES.EMPLOYEE);
    const isManager = user?.roles?.includes(ROLES.MANAGER);

    // Dynamic menu items based on user role
    const items = [
        (isAdmin || isManager) && { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },

        // ADMIN menus
        isAdmin && { key: '/vendors', icon: <ShopOutlined />, label: 'Nhà cung cấp' },
        isAdmin && { key: '/materials', icon: <AppstoreOutlined />, label: 'Vật tư' },
        isAdmin && { key: '/users', icon: <TeamOutlined />, label: 'Quản lý Nhân viên' },

        // EMPLOYEE menus
        isEmployee && { key: '/my-orders', icon: <FileTextOutlined />, label: 'Quản lý PO (Employee)' },

        // MANAGER menus
        isManager && { key: '/approvals', icon: <CheckCircleOutlined />, label: 'Duyệt PO (Manager)' },
    ].filter(Boolean);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
            }}
        >
            <div style={styles.logoContainer}>
                <div style={styles.logo}>
                    {collapsed ? 'E' : 'EPMS'}
                </div>
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                items={items}
                onClick={({ key }) => navigate(key)}
            />
        </Sider>
    );
}

const styles = {
    logoContainer: {
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
        transition: 'all 0.3s',
    },
    logo: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    }
};
