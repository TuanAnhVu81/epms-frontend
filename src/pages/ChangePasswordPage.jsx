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
            message.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        try {
            setLoading(true);
            await changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            });
            message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            // Force logout so user logs in fresh with new password (clears requirePasswordChange flag)
            setTimeout(() => { logout(); navigate('/login', { replace: true }); }, 1500);
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi đổi mật khẩu');
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
                        Đổi mật khẩu lần đầu
                    </Title>
                    <Text type="secondary">
                        Tài khoản <strong>{user?.username}</strong> đang sử dụng mật khẩu mặc định.<br />
                        Vui lòng đặt mật khẩu mới để tiếp tục sử dụng hệ thống.
                    </Text>
                </div>

                <Alert
                    type="warning"
                    showIcon
                    message="Bắt buộc đổi mật khẩu"
                    description="Đây là lần đăng nhập đầu tiên của bạn. Mật khẩu mặc định là Welcome@123. Hãy đặt mật khẩu mới an toàn hơn."
                    style={{ marginBottom: 24 }}
                />

                <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                    {/* Old Password (default: Welcome@123) */}
                    <Form.Item
                        name="oldPassword"
                        label="Mật khẩu hiện tại (mặc định)"
                        rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu mặc định: Welcome@123"
                        />
                    </Form.Item>

                    {/* New Password */}
                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: 'Nhập mật khẩu mới' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Ít nhất 6 ký tự"
                        />
                    </Form.Item>

                    {/* Confirm Password */}
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        rules={[{ required: true, message: 'Nhập lại mật khẩu mới' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Xác nhận đổi mật khẩu
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
