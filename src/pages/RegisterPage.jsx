import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import {
    UserOutlined, LockOutlined, MailOutlined,
    IdcardOutlined, UserAddOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../api/authApi';
import { handleApiError } from '../utils/errorHandler';

const { Title, Text } = Typography;

export default function RegisterPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // Handle registration: call registerApi then redirect to login
    const onFinish = async (values) => {
        try {
            await registerApi({
                username: values.username,
                password: values.password,
                email: values.email,
                fullName: values.fullName,
            });
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login', { replace: true });
        } catch (error) {
            handleApiError(error);
        }
    };

    return (
        <div style={styles.wrapper}>
            <Card style={styles.card} bordered={false}>
                {/* Logo / Brand */}
                <div style={styles.header}>
                    <div style={styles.logo}>EPMS</div>
                    <Title level={3} style={styles.title}>
                        Tạo tài khoản mới
                    </Title>
                    <Text type="secondary">Enterprise Procurement Management System</Text>
                </div>

                {/* Notice: only EMPLOYEE accounts can be self-registered */}
                <Alert
                    message="Lưu ý: Đăng ký chỉ tạo tài khoản Employee"
                    description="Tài khoản Admin và Manager được cấp bởi quản trị viên hệ thống."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                    requiredMark={false}
                >
                    {/* Full name field */}
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input
                            prefix={<IdcardOutlined />}
                            placeholder="Nguyễn Văn A"
                        />
                    </Form.Item>

                    {/* Email field */}
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="email@company.com"
                        />
                    </Form.Item>

                    {/* Username field: min 3 chars as per backend rule */}
                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                            { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Tối thiểu 3 ký tự"
                            autoComplete="username"
                        />
                    </Form.Item>

                    {/* Password field: min 6 chars as per backend rule */}
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Tối thiểu 6 ký tự"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    {/* Confirm password: client-side validation only */}
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    {/* Submit button */}
                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<UserAddOutlined />}
                            block
                        >
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>

                {/* Back to login link */}
                <div style={styles.footer}>
                    <Text type="secondary">Đã có tài khoản? </Text>
                    <Link to="/login">Đăng nhập</Link>
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
        maxWidth: 480,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    },
    header: {
        textAlign: 'center',
        marginBottom: 24,
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
};
