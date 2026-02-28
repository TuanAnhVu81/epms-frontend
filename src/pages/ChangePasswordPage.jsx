import React, { useState } from 'react';
import {
    Card, Form, Input, Button, Typography, message, Alert,
} from 'antd';
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { changePassword, getMyProfile } from '../api/userApi';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const onFinish = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('Passwords do not match!');
            return;
        }
        try {
            setLoading(true);
            await changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            });
            message.success('Password changed successfully! Please login again.');
            // Force logout so user logs in fresh with new password (clears requirePasswordChange flag)
            setTimeout(() => { logout(); navigate('/login', { replace: true }); }, 1500);
        } catch (err) {
            message.error(err?.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <Card style={styles.card} bordered={false}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.iconBox}>
                        <SafetyCertificateOutlined style={{ fontSize: 32, color: '#fff' }} />
                    </div>
                    <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                        First Time Change Password
                    </Title>
                    <Text type="secondary">
                        Account <strong>{user?.username}</strong> is using default password.<br />
                        Please set a new password to continue using the system.
                    </Text>
                </div>

                <Alert
                    type="warning"
                    showIcon
                    message="Password Change Required"
                    description="This is your first login. Default password is Welcome@123. Please set a more secure password."
                    style={{ marginBottom: 24 }}
                />

                <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                    {/* Old Password (default: Welcome@123) */}
                    <Form.Item
                        name="oldPassword"
                        label="Current Password (Default)"
                        rules={[{ required: true, message: 'Enter current password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Default Password: Welcome@123"
                        />
                    </Form.Item>

                    {/* New Password */}
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Enter password...i' },
                            { min: 6, message: 'Password must have at least 6 characters' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="At least 6 characters"
                        />
                    </Form.Item>

                    {/* Confirm Password */}
                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        rules={[{ required: true, message: 'Re-enter new password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Re-enter new password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Confirm Change Password
                        </Button>
                    </Form.Item>
                </Form>
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
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 460,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    },
    header: {
        textAlign: 'center',
        marginBottom: 24,
    },
    iconBox: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: 72,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #fa8c16, #fa541c)',
        boxShadow: '0 8px 24px rgba(250,140,22,0.4)',
    },
};
