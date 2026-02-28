import { useState } from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Typography, theme } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const userMenuSettings = {
        items: [
            {
                key: 'profile',
                label: (
                    <Space>
                        <UserOutlined />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Role: {user?.roles?.join(', ') || 'N/A'}
                        </Text>
                    </Space>
                ),
            },
            {
                type: 'divider',
            },
            {
                key: 'logout',
                danger: true,
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: handleLogout,
            },
        ],
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Dynamic Sidebar */}
            <Sidebar collapsed={collapsed} />

            <Layout>
                {/* Top Header */}
                <Header
                    style={{
                        padding: '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                        zIndex: 1, // Ensure shadow overlaps content
                        position: 'sticky',
                        top: 0
                    }}
                >
                    {/* Collapse Toggle Button */}
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                            marginLeft: -24, // Shift left to align with padding
                        }}
                    />

                    {/* User Profile & Logout */}
                    <Dropdown menu={userMenuSettings} placement="bottomRight" arrow>
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong>{user?.username}</Text>
                            <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                        </div>
                    </Dropdown>
                </Header>

                {/* Main Content Area */}
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: 'auto', // Ensure long content scrolls in this area
                    }}
                >
                    {/* Child routes render here */}
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
