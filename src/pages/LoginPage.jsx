import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { handleApiError } from '../utils/errorHandler';

const { Title, Text } = Typography;

export default function LoginPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);

    // Handle form submission: call login API then save token
    const onFinish = async (values) => {
        try {
            const result = await loginApi(values);  // returns { token, expiresIn }

            if (!result?.token) {
                message.error('Lỗi: Server không trả về token!');
                return;
            }

            login(result.token);  // decode JWT and store roles in Zustand
            message.success('Đăng nhập thành công!');
            navigate('/', { replace: true });

        } catch (error) {
            // Network error: backend not running or CORS blocked
            if (!error.response) {
                message.error(
                    'Không kết nối được với server. Vui lòng kiểm tra backend đang chạy.'
                );
            } else {
                // API error: wrong credentials, server error, etc.
                handleApiError(error);
            }
        }
    };

    return (
        <div style={styles.wrapper}>
            <Card style={styles.card} bordered={false}>
                {/* Logo / Brand */}
                <div style={styles.header}>
                    <div style={styles.logo}>EPMS</div>
                    <Title level={3} style={styles.title}>
                        Đăng nhập hệ thống
                    </Title>
                    <Text type="secondary">Enterprise Procurement Management System</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                    requiredMark={false}
                >
                    {/* Username field */}
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Tên đăng nhập"
                            autoComplete="username"
                        />
                    </Form.Item>

                    {/* Password field */}
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    {/* Submit button */}
                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<LoginOutlined />}
                            block
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>

                {/* Register link */}
                <div style={styles.footer}>
                    <Text type="secondary">Chưa có tài khoản? </Text>
                    <Link to="/register">Đăng ký ngay</Link>
                </div>

                {/* Demo credentials hint */}
                <div style={styles.hint}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        💡 Demo: <strong>admin</strong> / <strong>123456a</strong> &nbsp;|&nbsp;
                        <strong>manager</strong> / <strong>123456m</strong>
                    </Text>
                </div>
            </Card>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '24px',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    },
    header: {
        textAlign: 'center',
        marginBottom: 32,
    },
    logo: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #1677ff, #0958d9)',
        color: '#fff',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 1,
        marginBottom: 16,
        boxShadow: '0 8px 24px rgba(22,119,255,0.4)',
    },
    title: {
        marginBottom: 4,
        marginTop: 0,
    },
    footer: {
        textAlign: 'center',
        marginTop: 8,
    },
    hint: {
        textAlign: 'center',
        marginTop: 16,
        padding: '8px 12px',
        background: '#f5f5f5',
        borderRadius: 8,
    },
};
