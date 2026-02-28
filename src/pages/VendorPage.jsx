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
            message.error('Failed to fetch data Vendor qua OData');
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
                message.success('Vendor updated successfully!');
            } else {
                await createVendor(values);
                message.success('New Vendor added successfully!');
            }
            setFormModal({ open: false, record: null });
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Error saving Vendor');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteVendor(id);
            message.success('Vendor deleted!');
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error deleting');
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
            message.success('Rating updated!');
            setRatingModal({ open: false, record: null });
            fetchVendors({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Error updating rating');
        } finally {
            setRatingLoading(false);
        }
    };

    // ── Table columns (sorter=true → triggers $orderby via OData) ───────────
    const columns = [
        {
            title: 'Vendor Code',
            dataIndex: 'vendorCode',
            key: 'vendorCode',
            width: 140,
            sorter: true, // OData: $orderby=vendorCode asc/desc
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Vendor Name',
            dataIndex: 'name',
            key: 'name',
            sorter: true, // OData: $orderby=name asc/desc
            ellipsis: true,
        },
        {
            title: 'Category',
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
            title: 'Phone',
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
            sorter: true, // OData: $orderby=rating desc → sort best first!
            render: (v) => (
                <Tooltip title={`${v ?? '—'} / 5`}>
                    <Rate disabled value={v ?? 0} style={{ fontSize: 13 }} />
                </Tooltip>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: (v) => <ActiveBadge status={v} />,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                    </Tooltip>
                    <Tooltip title="Update Rating">
                        <Button size="small" icon={<StarOutlined />} onClick={() => openRatingModal(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete Vendor?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
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
                        Vendor Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                        Powered by <Text code style={{ fontSize: 11 }}>OData V4</Text>
                        &nbsp;— Sort, Filter, Search Server-side
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Add Vendor
                </Button>
            </div>

            {/* ── OData Error Banner ───────────────────────────────────────── */}
            {odataError && (
                <Alert type="warning" showIcon
                    message="OData V4 Endpoint unavailable"
                    description="Endpoint: GET /odata/Vendors — Please check backend."
                    style={{ marginBottom: 16 }}
                    action={<Button size="small" onClick={handleRefresh}>Retry</Button>}
                />
            )}

            <Card bordered={false}>
                {/* ── Filter & Search Bar ──────────────────────────────────── */}
                <Space style={{ marginBottom: 16 }} wrap>
                    {/* Keyword search → OData $filter=contains(name,'kw') or contains(vendorCode,'kw') */}
                    <Input.Search
                        placeholder="Search by Name or Vendor Code..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 280 }}
                    />

                    {/* Status filter → OData $filter=status eq 'ACTIVE' */}
                    <Select
                        placeholder="Filter by status"
                        allowClear
                        style={{ width: 180 }}
                        onChange={handleStatusChange}
                    >
                        <Option value="ACTIVE">✅ Active</Option>
                        <Option value="INACTIVE">⛔ Inactive</Option>
                    </Select>

                    <Tooltip title="Refresh">
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
                title={formModal.record ? '✏️ Edit Vendor' : '➕ Add New Vendor'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Save Changes' : 'Create'}
                cancelText="Cancel"
                confirmLoading={formLoading}
                width={720} centered destroyOnClose
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Vendor Name" rules={[{ required: true, message: 'Please enter vendor name' }]}>
                                <Input placeholder="Company / Store name..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Select category' }]}>
                                <Select placeholder="Select category NCC">
                                    {Object.entries(VENDOR_CATEGORY_LABELS).map(([k, v]) => (
                                        <Option key={k} value={k}>{v}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="taxId" label="Tax ID" rules={[{ required: true, message: 'Please enter MST' }]}>
                                <Input placeholder="MST..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter Phone' }]}>
                                <Input placeholder="090xxxxxxx" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid Email' }]}>
                                <Input placeholder="contact@vendor.com" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="contactPerson" label="Contact Person">
                                <Input placeholder="Responsible person name..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="paymentTerms" label="Payment Terms">
                                <Select placeholder="Select terms...">
                                    <Option value="Immediate">Immediate (Immediate)</Option>
                                    <Option value="Net 15">Net 15</Option>
                                    <Option value="Net 30">Net 30 (Default)</Option>
                                    <Option value="Net 60">Net 60</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="address" label="Address">
                                <Input placeholder="Headquarters address..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24}><Divider orientation="left" plain style={{ margin: '8px 0' }}>Bank Information</Divider></Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankName" label="Bank Name"><Input placeholder="Vietcombank..." /></Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankAccountNumber" label="Account Number"><Input placeholder="12345678x..." /></Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bankBranch" label="Branch"><Input placeholder="D1, HCMC..." /></Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="notes" label="Notes">
                                <TextArea rows={2} placeholder="Additional information..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ── Rating Modal ─────────────────────────────────────────────── */}
            <Modal
                title={<><StarOutlined style={{ color: '#faad14', marginRight: 6 }} />Update Rating: <strong>{ratingModal.record?.name}</strong></>}
                open={ratingModal.open}
                onCancel={() => { setRatingModal({ open: false, record: null }); ratingForm.resetFields(); }}
                onOk={handleRatingSubmit}
                okText="Save Rating" cancelText="Cancel"
                confirmLoading={ratingLoading}
                destroyOnClose centered width={400}
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={ratingForm} layout="vertical">
                    <Form.Item name="rating" label="Rating (1–5 stars)" rules={[{ required: true, message: 'Please select rating' }]}>
                        <Rate allowHalf style={{ fontSize: 28 }} />
                    </Form.Item>
                    <Form.Item name="comment" label="Comments (optional)">
                        <TextArea rows={3} placeholder="Comments on delivery performance, quality..." maxLength={500} showCount />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
