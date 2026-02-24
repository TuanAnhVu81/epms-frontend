import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, Button, Space, Tag, Modal, Form, Input, Select,
    message, Popconfirm, Typography, Card, Row, Col,
    Tooltip, Divider, Switch, Popover, Badge,
} from 'antd';
import {
    PlusOutlined, EditOutlined, KeyOutlined,
    ReloadOutlined, TeamOutlined, UserSwitchOutlined,
    CheckCircleOutlined, StopOutlined, UndoOutlined,
} from '@ant-design/icons';
import {
    getUsers,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
} from '../api/userApi';
import { ROLES } from '../utils/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// Map role code to display label
const ROLE_LABELS = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Manager',
    ROLE_EMPLOYEE: 'Employee',
};

const ROLE_COLORS = {
    ROLE_ADMIN: 'red',
    ROLE_MANAGER: 'blue',
    ROLE_EMPLOYEE: 'green',
};

export default function UserManagementPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState('');
    const [filterRole, setFilterRole] = useState(null);

    // Create / Edit modal state
    const [formModal, setFormModal] = useState({ open: false, record: null });
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // Role update modal
    const [roleModal, setRoleModal] = useState({ open: false, record: null });
    const [roleForm] = Form.useForm();
    const [roleLoading, setRoleLoading] = useState(false);

    // ── Fetch users ─────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, size: pageSize };
            if (keyword) params.keyword = keyword;
            if (filterRole) params.role = filterRole;
            const res = await getUsers(params);
            setData(res?.content || []);
            setTotal(res?.totalElements || 0);
        } catch (err) {
            message.error('Không thể tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, keyword, filterRole]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Form modal (Create / Edit) ───────────────────────────────────────────
    const openFormModal = (record = null) => {
        setFormModal({ open: true, record });
        if (record) {
            form.setFieldsValue({
                fullName: record.fullName,
                email: record.email,
            });
        } else {
            form.resetFields();
        }
    };

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setFormLoading(true);
            if (formModal.record) {
                // Edit: only update personal info
                await updateUser(formModal.record.id, values);
                message.success('Đã cập nhật thông tin nhân viên!');
            } else {
                // Create: username + role required
                // Form field is 'role', but API expects 'roles' array
                const payload = { ...values, roles: [values.role] };
                await createUser(payload);
                message.success('Đã tạo tài khoản! Mật khẩu mặc định: Welcome@123');
            }
            setFormModal({ open: false, record: null });
            fetchUsers();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Lỗi khi lưu thông tin');
        } finally {
            setFormLoading(false);
        }
    };

    // ── Role update ──────────────────────────────────────────────────────────
    const openRoleModal = (record) => {
        setRoleModal({ open: true, record });
        roleForm.setFieldsValue({ role: record.roles?.[0] });
    };

    const handleRoleSubmit = async () => {
        try {
            const values = await roleForm.validateFields();
            setRoleLoading(true);
            await updateUserRole(roleModal.record.id, { role: values.role });
            message.success('Đã cập nhật Role!');
            setRoleModal({ open: false, record: null });
            fetchUsers();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Lỗi khi cập nhật Role');
        } finally {
            setRoleLoading(false);
        }
    };

    // ── Toggle active/inactive ───────────────────────────────────────────────
    const handleToggleStatus = async (record) => {
        try {
            const isActive = record.status === 'ACTIVE';
            await updateUserStatus(record.id, { active: !isActive });
            message.success(!isActive ? 'Đã kích hoạt tài khoản!' : 'Đã vô hiệu hóa tài khoản!');
            fetchUsers();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi thay đổi trạng thái');
        }
    };

    // ── Reset password ───────────────────────────────────────────────────────
    const handleResetPassword = async (id) => {
        try {
            await resetUserPassword(id);
            message.success('Đã reset mật khẩu về Welcome@123!');
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi reset mật khẩu');
        }
    };

    // ── Table columns ────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
            width: 150,
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            ellipsis: true,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
        },
        {
            title: 'Role',
            dataIndex: 'roles',
            key: 'roles',
            width: 120,
            render: (roles) => roles?.map((r) => (
                <Tag key={r} color={ROLE_COLORS[r] || 'default'}>{ROLE_LABELS[r] || r}</Tag>
            )),
        },
        {
            title: 'Đổi pass lần đầu',
            dataIndex: 'requirePasswordChange',
            key: 'requirePasswordChange',
            width: 140,
            align: 'center',
            render: (v) => v
                ? <Tag color="warning">⚠ Chưa đổi</Tag>
                : <Tag color="success">✓ Đã đổi</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center',
            render: (v) => v === 'ACTIVE'
                ? <Badge status="success" text="Active" />
                : <Badge status="default" text="Inactive" />,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 200,
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                const isAdminAccount = record.roles?.includes('ROLE_ADMIN');
                const isActive = record.status === 'ACTIVE';

                if (isAdminAccount) {
                    return <Text type="secondary" style={{ fontSize: 12 }}><i>System Account (Khóa)</i></Text>;
                }

                return (
                    <Space>
                        <Tooltip title="Chỉnh sửa thông tin">
                            <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                        </Tooltip>
                        <Tooltip title="Đổi Role">
                            <Button size="small" icon={<UserSwitchOutlined />} onClick={() => openRoleModal(record)} />
                        </Tooltip>
                        <Popconfirm
                            title="Reset mật khẩu về Welcome@123?"
                            onConfirm={() => handleResetPassword(record.id)}
                            okText="Reset"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Reset Mật khẩu">
                                <Button size="small" icon={<KeyOutlined />} />
                            </Tooltip>
                        </Popconfirm>
                        <Popconfirm
                            title={isActive ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt lại tài khoản?'}
                            onConfirm={() => handleToggleStatus(record)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: isActive }}
                        >
                            <Tooltip title={isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                                <Button
                                    size="small"
                                    danger={isActive}
                                    icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: '0 12px' }}>

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <TeamOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    Quản lý Nhân viên
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Tạo tài khoản mới
                </Button>
            </div>

            {/* ── Filter bar ───────────────────────────────────────────────── */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Tìm theo tên đăng nhập, email..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onSearch={() => { setPage(0); fetchUsers(); }}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={8} md={5}>
                        <Select
                            value={filterRole}
                            onChange={(v) => { setFilterRole(v); setPage(0); }}
                            style={{ width: '100%' }}
                            placeholder="Lọc theo Role"
                            allowClear
                        >
                            <Option value="ROLE_ADMIN">Admin</Option>
                            <Option value="ROLE_MANAGER">Manager</Option>
                            <Option value="ROLE_EMPLOYEE">Employee</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setFilterRole(null); setPage(0); }}>
                            Làm mới
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ── Main table ───────────────────────────────────────────────── */}
            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: page + 1,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng: ${t} tài khoản`,
                        onChange: (p, ps) => { setPage(p - 1); setPageSize(ps); },
                    }}
                />
            </Card>

            {/* ══ Create / Edit Modal ═════════════════════════════════════════ */}
            <Modal
                title={formModal.record ? '✏️ Chỉnh sửa thông tin nhân viên' : '➕ Tạo tài khoản mới'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                cancelText="Hủy"
                confirmLoading={formLoading}
                width={600}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                {!formModal.record && (
                    <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                        💡 Tài khoản mới sẽ có mật khẩu mặc định là <strong>Welcome@123</strong>. Nhân viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
                    </div>
                )}
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        {/* Only show username and role for creation */}
                        {!formModal.record && (
                            <>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="username"
                                        label="Tên đăng nhập"
                                        rules={[
                                            { required: true, message: 'Nhập tên đăng nhập' },
                                            { min: 3, message: 'Ít nhất 3 ký tự' },
                                        ]}
                                    >
                                        <Input placeholder="vd: nguyen.van.a" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="role"
                                        label="Phân quyền"
                                        rules={[{ required: true, message: 'Chọn Role' }]}
                                    >
                                        <Select placeholder="Chọn Role...">
                                            <Option value="ROLE_EMPLOYEE">Employee (Nhân viên)</Option>
                                            <Option value="ROLE_MANAGER">Manager (Quản lý)</Option>
                                            <Option value="ROLE_ADMIN">Admin</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        <Col xs={24} md={12}>
                            <Form.Item name="fullName" label="Họ và tên">
                                <Input placeholder="Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ type: 'email', message: 'Email không hợp lệ' }, { required: true, message: 'Vui lòng nhập Email' }]}
                            >
                                <Input placeholder="nva@company.com" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ══ Role Update Modal ═══════════════════════════════════════════ */}
            <Modal
                title={<><UserSwitchOutlined style={{ color: '#1677ff', marginRight: 6 }} />Thay đổi Role: <strong>{roleModal.record?.username}</strong></>}
                open={roleModal.open}
                onCancel={() => { setRoleModal({ open: false, record: null }); roleForm.resetFields(); }}
                onOk={handleRoleSubmit}
                okText="Cập nhật Role"
                cancelText="Hủy"
                confirmLoading={roleLoading}
                width={400}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={roleForm} layout="vertical">
                    <Form.Item
                        name="role"
                        label="Role mới"
                        rules={[{ required: true, message: 'Chọn Role' }]}
                    >
                        <Select>
                            <Option value="ROLE_EMPLOYEE">Employee (Nhân viên)</Option>
                            <Option value="ROLE_MANAGER">Manager (Quản lý)</Option>
                            <Option value="ROLE_ADMIN">Admin</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
