import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, Button, Space, Tag, Modal, Form, Input, Select,
    InputNumber, message, Popconfirm, Typography, Card,
    Row, Col, Rate, Tooltip, Badge, Divider,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    StarOutlined, SearchOutlined, ReloadOutlined, ShopOutlined,
} from '@ant-design/icons';
import {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    updateVendorRating,
    searchVendorByCode,
} from '../api/vendorApi';
import { VENDOR_CATEGORY_LABELS } from '../utils/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Vendor status badge helper
const ActiveBadge = ({ active }) =>
    active
        ? <Badge status="success" text={<Text style={{ color: '#52c41a' }}>Active</Text>} />
        : <Badge status="default" text={<Text type="secondary">Inactive</Text>} />;

export default function VendorPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchCode, setSearchCode] = useState('');

    // Create/Edit modal state
    const [formModal, setFormModal] = useState({ open: false, record: null });
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // Rating modal state
    const [ratingModal, setRatingModal] = useState({ open: false, record: null });
    const [ratingForm] = Form.useForm();
    const [ratingLoading, setRatingLoading] = useState(false);

    // ── Fetch vendors ────────────────────────────────────────────────────────
    const fetchVendors = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getVendors({ page, size: pageSize });
            setData(res?.content || []);
            setTotal(res?.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
            message.error('Không thể tải danh sách Nhà cung cấp');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => { fetchVendors(); }, [fetchVendors]);

    // ── Search by vendor code ─────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!searchCode.trim()) { fetchVendors(); return; }
        try {
            setLoading(true);
            const result = await searchVendorByCode(searchCode.trim());
            // API returns single vendor or array; normalise to array
            const list = Array.isArray(result) ? result : result ? [result] : [];
            setData(list);
            setTotal(list.length);
        } catch {
            message.warning('Không tìm thấy nhà cung cấp với mã này');
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => { setSearchCode(''); fetchVendors(); };

    // ── Open form modal for Create or Edit ───────────────────────────────────
    const openFormModal = (record = null) => {
        setFormModal({ open: true, record });
        if (record) {
            // Populate form with existing data
            form.setFieldsValue({
                vendorCode: record.vendorCode,
                name: record.name,
                category: record.category,
                email: record.email,
                phone: record.phone,
                address: record.address,
                contactPerson: record.contactPerson,
                taxCode: record.taxCode,
                notes: record.notes,
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
                // Update existing vendor
                await updateVendor(formModal.record.id, values);
                message.success('Đã cập nhật Nhà cung cấp thành công!');
            } else {
                // Create new vendor
                await createVendor(values);
                message.success('Đã thêm Nhà cung cấp mới thành công!');
            }
            setFormModal({ open: false, record: null });
            fetchVendors();
        } catch (err) {
            if (err?.errorFields) return; // Ant Design validation errors — do nothing
            message.error(err?.response?.data?.message || 'Lỗi khi lưu Nhà cung cấp');
        } finally {
            setFormLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await deleteVendor(id);
            message.success('Đã xóa Nhà cung cấp!');
            fetchVendors();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi xóa');
        }
    };

    // ── Rating modal ─────────────────────────────────────────────────────────
    const openRatingModal = (record) => {
        setRatingModal({ open: true, record });
        ratingForm.setFieldsValue({ rating: record.rating ?? 3, comment: '' });
    };

    const handleRatingSubmit = async () => {
        try {
            const values = await ratingForm.validateFields();
            setRatingLoading(true);
            await updateVendorRating(ratingModal.record.id, values);
            message.success('Đã cập nhật Rating!');
            setRatingModal({ open: false, record: null });
            fetchVendors();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Lỗi khi cập nhật rating');
        } finally {
            setRatingLoading(false);
        }
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Mã NCC',
            dataIndex: 'vendorCode',
            key: 'vendorCode',
            width: 140,
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Tên Nhà cung cấp',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Phân loại',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (v) => {
                const colors = { DOMESTIC: 'blue', FOREIGN: 'purple', ONE_TIME: 'orange', SERVICE: 'cyan' };
                return <Tag color={colors[v] || 'default'}>{VENDOR_CATEGORY_LABELS[v] || v}</Tag>;
            },
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 120,
            align: 'center',
            render: (v) => (
                <Tooltip title={`${v ?? '—'} / 5`}>
                    <Rate disabled value={v ?? 0} style={{ fontSize: 14 }} />
                </Tooltip>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'active',
            key: 'active',
            width: 100,
            align: 'center',
            render: (v) => <ActiveBadge active={v} />,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 160,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                    </Tooltip>
                    <Tooltip title="Cập nhật Rating">
                        <Button size="small" icon={<StarOutlined />} onClick={() => openRatingModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa Nhà cung cấp?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
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
                    <ShopOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    Quản lý Nhà cung cấp
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Thêm Nhà cung cấp
                </Button>
            </div>

            {/* ── Search bar ──────────────────────────────────────────────── */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={14} md={10}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo Mã NCC (VD: VEN-0001)..."
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onPressEnter={handleSearch}
                            allowClear
                            onClear={handleReset}
                        />
                    </Col>
                    <Col>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Tìm kiếm</Button>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
                        </Space>
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
                        showTotal: (t) => `Tổng: ${t} nhà cung cấp`,
                        onChange: (p, ps) => { setPage(p - 1); setPageSize(ps); },
                    }}
                />
            </Card>

            {/* ══════════════════════════════════════════════════════════════
                Create / Edit Modal
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={formModal.record ? '✏️ Chỉnh sửa Nhà cung cấp' : '➕ Thêm Nhà cung cấp mới'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Lưu thay đổi' : 'Tạo mới'}
                cancelText="Hủy"
                confirmLoading={formLoading}
                width={720}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        {/* Vendor code — auto-generated by backend if not provided */}
                        <Col xs={24} md={12}>
                            <Form.Item name="vendorCode" label="Mã NCC" tooltip="Để trống để hệ thống tự tạo">
                                <Input placeholder="VEN-0001 (tự động nếu để trống)" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="Tên Nhà cung cấp"
                                rules={[{ required: true, message: 'Vui lòng nhập tên NCC' }]}
                            >
                                <Input placeholder="Tên công ty / cửa hàng..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="category" label="Phân loại" rules={[{ required: true, message: 'Chọn phân loại' }]}>
                                <Select placeholder="Chọn phân loại NCC">
                                    {Object.entries(VENDOR_CATEGORY_LABELS).map(([k, v]) => (
                                        <Option key={k} value={k}>{v}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="contactPerson" label="Người liên hệ">
                                <Input placeholder="Họ tên người phụ trách..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                            >
                                <Input placeholder="contact@vendor.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input placeholder="+84 xxx..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="address" label="Địa chỉ">
                                <Input placeholder="Địa chỉ trụ sở..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="taxCode" label="Mã số thuế">
                                <Input placeholder="MST..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="notes" label="Ghi chú">
                                <TextArea rows={2} placeholder="Thông tin bổ sung..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ══════════════════════════════════════════════════════════════
                Update Rating Modal
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={<><StarOutlined style={{ color: '#faad14', marginRight: 6 }} />Cập nhật Rating: <strong>{ratingModal.record?.name}</strong></>}
                open={ratingModal.open}
                onCancel={() => { setRatingModal({ open: false, record: null }); ratingForm.resetFields(); }}
                onOk={handleRatingSubmit}
                okText="Lưu Rating"
                cancelText="Hủy"
                confirmLoading={ratingLoading}
                destroyOnClose
                width={400}
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={ratingForm} layout="vertical">
                    <Form.Item
                        name="rating"
                        label="Điểm đánh giá (1–5 sao)"
                        rules={[{ required: true, message: 'Vui lòng chọn rating' }]}
                    >
                        {/* Use InputNumber for precise decimal control, also show Rate stars */}
                        <Rate allowHalf style={{ fontSize: 28 }} />
                    </Form.Item>
                    <Form.Item name="comment" label="Nhận xét (tuỳ chọn)">
                        <TextArea rows={3} placeholder="Nhận xét về hiệu suất giao hàng, chất lượng hàng hoá..." maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
