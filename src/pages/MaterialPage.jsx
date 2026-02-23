import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, Button, Space, Tag, Modal, Form, Input, Select,
    InputNumber, message, Popconfirm, Typography, Card,
    Row, Col, Tooltip, Switch, Divider,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SearchOutlined, ReloadOutlined, AppstoreOutlined,
    CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
} from '../api/materialApi';
import { MATERIAL_TYPE_LABELS } from '../utils/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Format currency helper
const formatCurrency = (val) =>
    val != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : '—';

export default function MaterialPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [filterActive, setFilterActive] = useState(null); // null = all

    // Form modal state
    const [formModal, setFormModal] = useState({ open: false, record: null });
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // ── Fetch materials ──────────────────────────────────────────────────────
    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            // Pass active filter if set; backend supports ?active=true/false
            const params = { page, size: pageSize };
            if (filterActive !== null) params.active = filterActive;
            const res = await getMaterials(params);
            setData(res?.content || []);
            setTotal(res?.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch materials:', err);
            message.error('Không thể tải danh sách Vật tư');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, filterActive]);

    useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

    // ── Open form modal ───────────────────────────────────────────────────────
    const openFormModal = (record = null) => {
        setFormModal({ open: true, record });
        if (record) {
            form.setFieldsValue({
                materialCode: record.materialCode,
                description: record.description,
                materialType: record.materialType,
                basePrice: record.basePrice,
                unit: record.unit,
                category: record.category,
                currency: record.currency || 'VND', // Load existing currency
                active: record.active,
                notes: record.notes,
            });
        } else {
            form.resetFields();
            // Default to active when creating new
            form.setFieldsValue({
                active: true,
                currency: 'VND'
            });
        }
    };

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();

            setFormLoading(true);
            if (formModal.record) {
                await updateMaterial(formModal.record.id, values);
                message.success('Đã cập nhật Vật tư thành công!');
            } else {
                await createMaterial(values);
                message.success('Đã thêm Vật tư mới thành công!');
            }
            setFormModal({ open: false, record: null });
            fetchMaterials();
        } catch (err) {
            if (err?.errorFields) return; // AntD validation—do nothing
            message.error(err?.response?.data?.message || 'Lỗi khi lưu Vật tư');
        } finally {
            setFormLoading(false);
        }
    };

    // ── Delete (soft delete = toggle inactive via DELETE API) ────────────────
    const handleDelete = async (id) => {
        try {
            await deleteMaterial(id);
            message.success('Đã tắt hoạt động Vật tư!');
            fetchMaterials();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi xóa');
        }
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Mã Vật tư',
            dataIndex: 'materialCode',
            key: 'materialCode',
            width: 140,
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Mô tả / Tên',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Loại vật tư',
            dataIndex: 'materialType',
            key: 'materialType',
            width: 140,
            render: (v) => {
                const typeColors = {
                    ROH: 'red', HALB: 'orange', FERT: 'green',
                    HAWA: 'blue', DIEN: 'geekblue', NLAG: 'purple',
                };
                return <Tag color={typeColors[v] || 'default'}>{v}</Tag>;
            },
        },
        {
            title: 'Đơn giá cơ bản',
            dataIndex: 'basePrice',
            key: 'basePrice',
            align: 'right',
            width: 150,
            render: (v, record) => <Text type={v ? undefined : 'secondary'}>
                {v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: record.currency || 'VND' }).format(v) : '—'}
            </Text>,
        },
        {
            title: 'ĐVT',
            dataIndex: 'unit',
            key: 'unit',
            align: 'center',
            width: 80,
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 130,
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive', // Backend response uses isActive
            key: 'isActive',
            align: 'center',
            width: 110,
            render: (v) => v
                ? <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
                : <Tag icon={<StopOutlined />} color="default">Inactive</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa / Tắt hoạt động?"
                        description="Vật tư sẽ bị đánh dấu Inactive (soft delete)."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa (Soft Delete)">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '0 12px' }}>

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <AppstoreOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    Quản lý Vật tư
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Thêm Vật tư
                </Button>
            </div>

            {/* ── Filter bar ──────────────────────────────────────────────── */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col>
                        <Text type="secondary">Lọc trạng thái: </Text>
                        <Select
                            value={filterActive}
                            onChange={(val) => { setFilterActive(val); setPage(0); }}
                            style={{ width: 150, marginLeft: 8 }}
                        >
                            <Option value={null}>Tất cả</Option>
                            <Option value={true}>Đang Active</Option>
                            <Option value={false}>Đã Inactive</Option>
                        </Select>
                    </Col>
                    <Col>
                        <Button icon={<ReloadOutlined />} onClick={() => { setFilterActive(null); setPage(0); fetchMaterials(); }}>
                            Làm mới
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* ── Main table ──────────────────────────────────────────────── */}
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
                        showTotal: (t) => `Tổng: ${t} vật tư`,
                        onChange: (p, ps) => { setPage(p - 1); setPageSize(ps); },
                    }}
                    rowClassName={(record) => !record.isActive ? 'ant-table-row-disabled' : ''}
                />
            </Card>

            {/* ══════════════════════════════════════════════════════════════
                Create / Edit Modal
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={formModal.record ? '✏️ Chỉnh sửa Vật tư' : '➕ Thêm Vật tư mới'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Lưu thay đổi' : 'Tạo mới'}
                cancelText="Hủy"
                confirmLoading={formLoading}
                width={700}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        {/* Material Code — auto-generated by backend */}
                        <Col xs={24} md={12}>
                            <Form.Item name="materialCode" label="Mã Vật tư" tooltip="Để trống để hệ thống tự tạo">
                                <Input placeholder="MAT-2026-XXXX (tự động nếu để trống)" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="materialType"
                                label="Loại vật tư (SAP)"
                                rules={[{ required: true, message: 'Chọn loại vật tư' }]}
                            >
                                <Select placeholder="Chọn loại...">
                                    {Object.entries(MATERIAL_TYPE_LABELS).map(([k, v]) => (
                                        <Option key={k} value={k}>{v}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="description"
                                label="Mô tả / Tên vật tư"
                                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                            >
                                <Input placeholder="Tên đầy đủ của vật tư..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="unit"
                                label="Đơn vị tính (ĐVT)"
                                rules={[{ required: true, message: 'Nhập ĐVT' }]}
                            >
                                <Input placeholder="PCS, KG, M2..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Đơn giá cơ bản" style={{ marginBottom: 0 }}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Form.Item name="currency" noStyle>
                                        <Select style={{ width: '35%' }}>
                                            <Option value="VND">VND</Option>
                                            <Option value="USD">USD</Option>
                                            <Option value="EUR">EUR</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="basePrice" noStyle>
                                        <InputNumber
                                            style={{ width: '65%' }}
                                            min={0}
                                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(v) => v.replace(/,/g, '')}
                                            placeholder="0"
                                        />
                                    </Form.Item>
                                </Space.Compact>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="category" label="Danh mục">
                                <Input placeholder="IT, Office, Manufacturing..." />
                            </Form.Item>
                        </Col>
                        {/* Show active toggle only in Edit mode */}
                        {formModal.record && (
                            <Col xs={24} md={8}>
                                <Form.Item name="active" label="Trạng thái" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        )}
                        <Col xs={24}>
                            <Form.Item name="notes" label="Ghi chú">
                                <TextArea rows={2} placeholder="Thông tin bổ sung về vật tư..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
