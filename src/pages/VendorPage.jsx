import React, { useEffect, useState } from 'react';
import {
    Table, Button, Space, Tag, Modal, Form, Input, Select,
    message, Popconfirm, Typography, Card, Row, Col,
    Rate, Tooltip, Badge, Divider, Alert,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    StarOutlined, ReloadOutlined, ShopOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import {
    createVendor,
    updateVendor,
    deleteVendor,
    updateVendorRating,
} from '../api/vendorApi';
import { queryVendorsOData } from '../api/odataApi';
import { VENDOR_CATEGORY_LABELS } from '../utils/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Vendor status badge helper
const ActiveBadge = ({ status }) =>
    status === 'ACTIVE'
        ? <Badge status="success" text={<Text style={{ color: '#52c41a' }}>Active</Text>} />
        : <Badge status="default" text={<Text type="secondary">Inactive</Text>} />;

/**
 * VendorPage — Refactored to use OData V4 API
 *   ✅ Pagination      → $top / $skip
 *   ✅ Inline count    → $count=true
 *   ✅ Sort by column  → $orderby=name asc / rating desc
 *   ✅ Status filter   → $filter=status eq 'ACTIVE'
 *   ✅ Keyword search  → $filter=contains(name,'kw') or contains(vendorCode,'kw')
 *   ✅ Combined        → $filter=status eq 'ACTIVE' and contains(name,'kw')
 *
 * OData endpoint: GET /odata/Vendors?$top=...&$skip=...&$count=true&$orderby=...&$filter=...
 */
export default function VendorPage() {
    // ── Data state ──────────────────────────────────────────────────────────
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [odataError, setOdataError] = useState(false);

    // ── OData query parameters ──────────────────────────────────────────────
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [keyword, setKeyword] = useState('');

    // ── Form modal state ────────────────────────────────────────────────────
    const [formModal, setFormModal] = useState({ open: false, record: null });
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();

    // ── Rating modal state ──────────────────────────────────────────────────
    const [ratingModal, setRatingModal] = useState({ open: false, record: null });
    const [ratingForm] = Form.useForm();
    const [ratingLoading, setRatingLoading] = useState(false);

    // ── Fetch vendors via OData ──────────────────────────────────────────────
    const fetchVendors = async ({
        page = pagination.current,
        pageSize = pagination.pageSize,
        sort = sorter,
        status = statusFilter,
        kw = keyword,
    } = {}) => {
        try {
            setLoading(true);
            setOdataError(false);

            // queryVendorsOData builds: /odata/Vendors?$top=...&$skip=...&$count=true&$orderby=...&$filter=...
            const { data: rows, total: count } = await queryVendorsOData({
                page, pageSize, sort,
                statusFilter: status,
                keyword: kw,
            });
            setData(rows);
            setTotal(count);
        } catch (err) {
            console.error('[OData] Failed to fetch vendors:', err);
            setData([]);
            setTotal(0);
            setOdataError(true);
            message.error('Không thể tải dữ liệu Nhà cung cấp qua OData');
        } finally {
            setLoading(false);
        }
    };

    // Load on mount and when OData params change
    useEffect(() => {
        fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, sorter, statusFilter]);

    // ── Event handlers ───────────────────────────────────────────────────────

    /** Handle Table pagination/sort change → triggers OData re-query */
    const handleTableChange = (pag, _filters, sorterInfo) => {
        setPagination({ current: pag.current, pageSize: pag.pageSize });
        // Convert Ant Design sort format → OData $orderby field/direction
        setSorter(sorterInfo?.column ? { field: sorterInfo.field, order: sorterInfo.order } : null);
    };

    const handleSearch = (value) => {
        const kw = value?.trim() || '';
        setKeyword(kw);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchVendors({ page: 1, pageSize: pagination.pageSize, kw });
    };

    const handleStatusChange = (val) => {
        setStatusFilter(val || null);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleRefresh = () => fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });

    // ── CRUD handlers (use standard REST — OData is read-only layer) ─────────
    const openFormModal = (record = null) => {
        setFormModal({ open: true, record });
        if (record) {
            form.setFieldsValue({
                name: record.name, category: record.category, email: record.email,
                phone: record.phone, address: record.address, contactPerson: record.contactPerson,
                taxId: record.taxId, paymentTerms: record.paymentTerms,
                bankName: record.bankName, bankAccountNumber: record.bankAccountNumber,
                bankBranch: record.bankBranch, notes: record.notes,
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
                await updateVendor(formModal.record.id, values);
                message.success('Đã cập nhật Nhà cung cấp thành công!');
            } else {
                await createVendor(values);
                message.success('Đã thêm Nhà cung cấp mới thành công!');
            }
            setFormModal({ open: false, record: null });
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Lỗi khi lưu Nhà cung cấp');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteVendor(id);
            message.success('Đã xóa Nhà cung cấp!');
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi xóa');
        }
    };

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
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Lỗi khi cập nhật rating');
        } finally {
            setRatingLoading(false);
        }
    };

    // ── Table columns (sorter=true → triggers $orderby via OData) ───────────
    const columns = [
        {
            title: 'Mã NCC',
            dataIndex: 'vendorCode',
            key: 'vendorCode',
            width: 140,
            sorter: true, // OData: $orderby=vendorCode asc/desc
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Tên Nhà cung cấp',
            dataIndex: 'name',
            key: 'name',
            sorter: true, // OData: $orderby=name asc/desc
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
            width: 130,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 140,
            align: 'center',
            sorter: true, // OData: $orderby=rating desc → sort tốt nhất lên đầu!
            render: (v) => (
                <Tooltip title={`${v ?? '—'} / 5`}>
                    <Rate disabled value={v ?? 0} style={{ fontSize: 13 }} />
                </Tooltip>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: (v) => <ActiveBadge status={v} />,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
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
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
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

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <ShopOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                        Quản lý Nhà cung cấp
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                        Powered by <Text code style={{ fontSize: 11 }}>OData V4</Text>
                        &nbsp;— Sort, Filter, Search phía Server
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Thêm Nhà cung cấp
                </Button>
            </div>

            {/* ── OData Error Banner ───────────────────────────────────────── */}
            {odataError && (
                <Alert type="warning" showIcon
                    message="OData V4 Endpoint không khả dụng"
                    description="Endpoint: GET /odata/Vendors — Vui lòng kiểm tra Backend."
                    style={{ marginBottom: 16 }}
                    action={<Button size="small" onClick={handleRefresh}>Thử lại</Button>}
                />
            )}

            <Card bordered={false}>
                {/* ── Filter & Search Bar ──────────────────────────────────── */}
                <Space style={{ marginBottom: 16 }} wrap>
                    {/* Keyword search → OData $filter=contains(name,'kw') or contains(vendorCode,'kw') */}
                    <Input.Search
                        placeholder="Tìm theo Tên hoặc Mã NCC..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 280 }}
                    />

                    {/* Status filter → OData $filter=status eq 'ACTIVE' */}
                    <Select
                        placeholder="Lọc theo trạng thái"
                        allowClear
                        style={{ width: 180 }}
                        onChange={handleStatusChange}
                    >
                        <Option value="ACTIVE">✅ Active</Option>
                        <Option value="INACTIVE">⛔ Inactive</Option>
                    </Select>

                    <Tooltip title="Làm mới">
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
                    </Tooltip>

                    {/* Show live OData $filter being sent to backend */}
                    {(statusFilter || keyword) && (
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {'$filter='}
                            {statusFilter && `status eq '${statusFilter}'`}
                            {statusFilter && keyword && ' and '}
                            {keyword && `contains(name, '${keyword}')`}
                        </Text>
                    )}
                </Space>

                {/* ── Data Table ───────────────────────────────────────────── */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange} // Sort & pagination → OData re-query
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,       // From @odata.count
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (t, range) => `${range[0]}–${range[1]} / ${t} NCC`,
                    }}
                />
            </Card>

            {/* ── Create / Edit Modal ──────────────────────────────────────── */}
            <Modal
                title={formModal.record ? '✏️ Chỉnh sửa Nhà cung cấp' : '➕ Thêm Nhà cung cấp mới'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Lưu thay đổi' : 'Tạo mới'}
                cancelText="Hủy"
                confirmLoading={formLoading}
                width={720} centered destroyOnClose
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Tên Nhà cung cấp" rules={[{ required: true, message: 'Vui lòng nhập tên NCC' }]}>
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
                            <Form.Item name="taxId" label="Mã số thuế" rules={[{ required: true, message: 'Vui lòng nhập MST' }]}>
                                <Input placeholder="MST..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
                                <Input placeholder="090xxxxxxx" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                                <Input placeholder="contact@vendor.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="contactPerson" label="Người liên hệ">
                                <Input placeholder="Họ tên người phụ trách..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="paymentTerms" label="Điều khoản thanh toán">
                                <Select placeholder="Chọn điều khoản...">
                                    <Option value="Immediate">Thanh toán ngay (Immediate)</Option>
                                    <Option value="Net 15">Net 15</Option>
                                    <Option value="Net 30">Net 30 (Mặc định)</Option>
                                    <Option value="Net 60">Net 60</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="address" label="Địa chỉ">
                                <Input placeholder="Địa chỉ trụ sở..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24}><Divider orientation="left" plain style={{ margin: '8px 0' }}>Thông tin ngân hàng</Divider></Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankName" label="Ngân hàng"><Input placeholder="Vietcombank..." /></Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankAccountNumber" label="Số tài khoản"><Input placeholder="12345678x..." /></Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankBranch" label="Chi nhánh"><Input placeholder="Ba Đình, TP.HCM..." /></Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="notes" label="Ghi chú">
                                <TextArea rows={2} placeholder="Thông tin bổ sung..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ── Rating Modal ─────────────────────────────────────────────── */}
            <Modal
                title={<><StarOutlined style={{ color: '#faad14', marginRight: 6 }} />Cập nhật Rating: <strong>{ratingModal.record?.name}</strong></>}
                open={ratingModal.open}
                onCancel={() => { setRatingModal({ open: false, record: null }); ratingForm.resetFields(); }}
                onOk={handleRatingSubmit}
                okText="Lưu Rating" cancelText="Hủy"
                confirmLoading={ratingLoading}
                destroyOnClose centered width={400}
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={ratingForm} layout="vertical">
                    <Form.Item name="rating" label="Điểm đánh giá (1–5 sao)" rules={[{ required: true, message: 'Vui lòng chọn rating' }]}>
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
