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
            message.error('Failed to load employees');
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
                message.success('Employee information updated!');
            } else {
                // Create: username + role required
                // Form field is 'role', but API expects 'roles' array
                const payload = { ...values, roles: [values.role] };
                await createUser(payload);
                message.success('Account created! Default Password: Welcome@123');
            }
            setFormModal({ open: false, record: null });
            fetchUsers();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Error saving info');
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
            message.success('Role updated!');
            setRoleModal({ open: false, record: null });
            fetchUsers();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Error updating role');
        } finally {
            setRoleLoading(false);
        }
    };

    // ── Toggle active/inactive ───────────────────────────────────────────────
    const handleToggleStatus = async (record) => {
        try {
            const isActive = record.status === 'ACTIVE';
            await updateUserStatus(record.id, { active: !isActive });
            message.success(!isActive ? 'Account activated!' : 'Account deactivated!');
            fetchUsers();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error changing status');
        }
    };

    // ── Reset password ───────────────────────────────────────────────────────
    const handleResetPassword = async (id) => {
        try {
            await resetUserPassword(id);
            message.success('Password reset to Welcome@123!');
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error resetting password');
        }
    };

    // ── Table columns ────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            width: 150,
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Full Name',
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
            title: 'First login change pass',
            dataIndex: 'requirePasswordChange',
            key: 'requirePasswordChange',
            width: 140,
            align: 'center',
            render: (v) => v
                ? <Tag color="warning">⚠ Not changed</Tag>
                : <Tag color="success">✓ Changed</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center',
            render: (v) => v === 'ACTIVE'
                ? <Badge status="success" text="Active" />
                : <Badge status="default" text="Inactive" />,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                const isAdminAccount = record.roles?.includes('ROLE_ADMIN');
                const isActive = record.status === 'ACTIVE';

                if (isAdminAccount) {
                    return <Text type="secondary" style={{ fontSize: 12 }}><i>System Account (Locked)</i></Text>;
                }

                return (
                    <Space>
                        <Tooltip title="Edit info">
                            <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                        </Tooltip>
                        <Tooltip title="Change Role">
                            <Button size="small" icon={<UserSwitchOutlined />} onClick={() => openRoleModal(record)} />
                        </Tooltip>
                        <Popconfirm
                            title="Reset password to Welcome@123?"
                            onConfirm={() => handleResetPassword(record.id)}
                            okText="Reset"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Reset Password">
                                <Button size="small" icon={<KeyOutlined />} />
                            </Tooltip>
                        </Popconfirm>
                        <Popconfirm
                            title={isActive ? 'Deactivate account?' : 'Reactivate account?'}
                            onConfirm={() => handleToggleStatus(record)}
                            okText="Confirm"
                            cancelText="Cancel"
                            okButtonProps={{ danger: isActive }}
                        >
                            <Tooltip title={isActive ? 'Deactivate' : 'Active'}>
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
                    User Management
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Create new account
                </Button>
            </div>

            {/* ── Filter bar ───────────────────────────────────────────────── */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Search by username, email..."
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
                            placeholder="Filter by Role"
                            allowClear
                        >
                            <Option value="ROLE_ADMIN">Admin</Option>
                            <Option value="ROLE_MANAGER">Manager</Option>
                            <Option value="ROLE_EMPLOYEE">Employee</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setFilterRole(null); setPage(0); }}>
                            Refresh
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
                        showTotal: (t) => `Total:  accounts`,
                        onChange: (p, ps) => { setPage(p - 1); setPageSize(ps); },
                    }}
                />
            </Card>

            {/* ══ Create / Edit Modal ═════════════════════════════════════════ */}
            <Modal
                title={formModal.record ? '✏️ Edit info employees' : '➕ Create new account'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Save Changes' : 'Create account'}
                cancelText="Cancel"
                confirmLoading={formLoading}
                width={600}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                {!formModal.record && (
                    <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                        💡 New accounts will have a default password of <strong>Welcome@123</strong>. Employees will be required to change their password on first login.
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
                                        label="Username"
                                        rules={[
                                            { required: true, message: 'Enter username' },
                                            { min: 3, message: 'At least 3 characters' },
                                        ]}
                                    >
                                        <Input placeholder="vd: nguyen.van.a" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="role"
                                        label="Privileges"
                                        rules={[{ required: true, message: 'Select Role' }]}
                                    >
                                        <Select placeholder="Select Role...">
                                            <Option value="ROLE_EMPLOYEE">Employee (employees)</Option>
                                            <Option value="ROLE_MANAGER">Manager (Manager)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        <Col xs={24} md={12}>
                            <Form.Item name="fullName" label="Full Name">
                                <Input placeholder="John Doe" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ type: 'email', message: 'Invalid Email' }, { required: true, message: 'Please enter Email' }]}
                            >
                                <Input placeholder="nva@company.com" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ══ Role Update Modal ═══════════════════════════════════════════ */}
            <Modal
                title={<><UserSwitchOutlined style={{ color: '#1677ff', marginRight: 6 }} />Change Role: <strong>{roleModal.record?.username}</strong></>}
                open={roleModal.open}
                onCancel={() => { setRoleModal({ open: false, record: null }); roleForm.resetFields(); }}
                onOk={handleRoleSubmit}
                okText="Update Role"
                cancelText="Cancel"
                confirmLoading={roleLoading}
                width={400}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={roleForm} layout="vertical">
                    <Form.Item
                        name="role"
                        label="New Role"
                        rules={[{ required: true, message: 'Select Role' }]}
                    >
                        <Select>
                            <Option value="ROLE_EMPLOYEE">Employee (employees)</Option>
                            <Option value="ROLE_MANAGER">Manager (Manager)</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
