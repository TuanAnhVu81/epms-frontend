import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { handleApiError } from '../utils/errorHandler';

const { Title, Text } = Typography;

export default function LoginPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);

    const [loading, setLoading] = useState(false);

    // Handle form submission: call login API then save token
    const onFinish = async (values) => {
        try {
            setLoading(true);
            const result = await loginApi(values);  // returns { token, expiresIn }

            if (!result?.token) {
                message.error('Error: Server did not return a token!');
                setLoading(false);
                return;
            }

            login(result.token);  // decode JWT and store roles in Zustand
            message.success('Login successful!');
            navigate('/', { replace: true });

        } catch (error) {
            setLoading(false);
            // Network error: backend not running or CORS blocked
            if (!error.response) {
                message.error(
                    'Cannot connect to server. Please check backend.'
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
                        Login system
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
                        rules={[{ required: true, message: 'Please enter username' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Username"
                            autoComplete="username"
                        />
                    </Form.Item>

                    {/* Password field */}
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
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
                            loading={loading}
                        >
                            Login
                        </Button>
                    </Form.Item>
                </Form>

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
    hint: {
        textAlign: 'center',
        marginTop: 16,
        padding: '8px 12px',
        background: '#f5f5f5',
        borderRadius: 8,
    },
};
