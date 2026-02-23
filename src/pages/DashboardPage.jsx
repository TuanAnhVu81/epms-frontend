import { Card, Typography, Tag, Button, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

// Placeholder stub — will be fully implemented in Phase 3
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    // Handle logout: clear store and redirect to login
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div style={{ padding: 24 }}>
            <Card style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
                <Title level={2}>✅ Đăng nhập thành công!</Title>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <Text type="secondary">Xin chào, </Text>
                        <Text strong style={{ fontSize: 16 }}>{user?.username}</Text>
                    </div>

                    <div>
                        <Text type="secondary">Vai trò: </Text>
                        {user?.roles?.length > 0
                            ? user.roles.map((r) => <Tag key={r} color="blue">{r}</Tag>)
                            : <Tag color="red">Không có role (lỗi decode JWT)</Tag>
                        }
                    </div>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        📊 Dashboard (Phase 3) — sẽ có charts và KPI cards
                    </Text>
                </Space>
            </Card>
        </div>
    );
}
