import React, { useEffect, useState } from 'react';
import {
    Table, Button, Space, Tag, Modal, Form, Input, Select,
    InputNumber, message, Popconfirm, Typography, Card,
    Row, Col, Tooltip, Switch, Divider, Alert,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SearchOutlined, ReloadOutlined, AppstoreOutlined,
    CheckCircleOutlined, StopOutlined, InboxOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import {
    createMaterial,
    updateMaterial,
    deleteMaterial,
} from '../api/materialApi';
import { queryMaterialsOData } from '../api/odataApi';
import { MATERIAL_TYPE_LABELS } from '../utils/constants';
import MaterialStockCard from '../components/material/MaterialStockCard';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Format currency helper
const formatCurrency = (val, currency = 'VND') =>
    val != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(val) : '—';

/**
 * Build OData $filter string for Material queries.
 * Combines isActive and keyword into a single OData expression.
 *
 * Examples:
 *   (active=true, kw='thép')  → "isActive eq true and contains(description, 'thép')"
 *   (active=true, kw='')      → "isActive eq true"
 *   (active=null, kw='thép')  → "contains(description, 'thép') or contains(materialCode, 'thép')"
 *   (active=null, kw='')      → null (no filter → fetch all)
 */
function buildMaterialFilter(active, kw) {
    const parts = [];
    // isActive filter: isActive eq true / isActive eq false
    if (active !== null && active !== undefined) {
        parts.push(`isActive eq ${active}`);
    }
    // Keyword: search across description and materialCode
    if (kw && kw.trim()) {
        const escaped = kw.trim().replace(/'/g, "''"); // Escape single quotes
        parts.push(`(contains(description, '${escaped}') or contains(materialCode, '${escaped}'))`);
    }
    return parts.length > 0 ? parts.join(' and ') : null;
}

/**
 * MaterialPage — Refactored to use OData V4 API
 *   ✅ Pagination       → $top / $skip
 *   ✅ Inline count     → $count=true
 *   ✅ Sort by column   → $orderby=basePrice desc / description asc
 *   ✅ Active filter    → $filter=isActive eq true/false
 *   ✅ Keyword search   → $filter=contains(description,'kw') or contains(materialCode,'kw')
 *   ✅ Combined         → $filter=isActive eq true and contains(description,'thép')
 *
 * OData endpoint: GET /odata/Materials?$top=...&$skip=...&$count=true&$orderby=...&$filter=...
 */
export default function MaterialPage() {
    // ── Data state ──────────────────────────────────────────────────────────
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [odataError, setOdataError] = useState(false);

    // ── OData query parameters ──────────────────────────────────────────────
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState(null);
    const [activeFilter, setActiveFilter] = useState(null); // null=all, true=active, false=inactive
    const [keyword, setKeyword] = useState('');

    // ── Form modal state ────────────────────────────────────────────────────
    const [formModal, setFormModal] = useState({ open: false, record: null });
    const [formLoading, setFormLoading] = useState(false);
    const [form] = Form.useForm();
    // ── Stock viewer modal state ────────────────────────────────────────────
    const [stockModal, setStockModal] = useState({ open: false, record: null });

    // ── Fetch materials via OData ───────────────────────────────────────────
    const fetchMaterials = async ({
        page = pagination.current,
        pageSize = pagination.pageSize,
        sort = sorter,
        active = activeFilter,
        kw = keyword,
    } = {}) => {
        try {
            setLoading(true);
            setOdataError(false);

            // Build $filter: isActive eq true and contains(description,'kw')
            // queryMaterialsOData internally calls buildODataQuery() which handles statusFilter
            // For Material we repurpose 'statusFilter' as the isActive flag string
            const odataFilter = buildMaterialFilter(active, kw);

            const { data: rows, total: count } = await queryMaterialsOData({
                page, pageSize, sort,
                // Pass raw $filter string — we need to extend odataApi slightly
                customFilter: odataFilter,
            });
            setData(rows);
            setTotal(count);
        } catch (err) {
            console.error('[OData] Failed to fetch materials:', err);
            setData([]);
            setTotal(0);
            setOdataError(true);
            message.error('Failed to fetch data Material qua OData');
        } finally {
            setLoading(false);
        }
    };

    // Load on mount and when OData params change
    useEffect(() => {
        fetchMaterials({ page: pagination.current, pageSize: pagination.pageSize });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, sorter, activeFilter]);

    // ── Open form modal ───────────────────────────────────────────────────────
    const openFormModal = (record = null) => {
        setFormModal({ open: true, record });
        if (record) {
            form.setFieldsValue({
                description: record.description, materialType: record.materialType,
                basePrice: record.basePrice, unit: record.unit, category: record.category,
                manufacturer: record.manufacturer, specifications: record.specifications,
                imageUrl: record.imageUrl, currency: record.currency || 'VND',
                isActive: record.isActive, notes: record.notes,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true, currency: 'VND' });
        }
    };

    /** Handle Table pagination/sort change → triggers OData re-query */
    const handleTableChange = (pag, _filters, sorterInfo) => {
        setPagination({ current: pag.current, pageSize: pag.pageSize });
        setSorter(sorterInfo?.column ? { field: sorterInfo.field, order: sorterInfo.order } : null);
    };

    const handleSearch = (value) => {
        const kw = value?.trim() || '';
        setKeyword(kw);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchMaterials({ page: 1, pageSize: pagination.pageSize, kw });
    };

    const handleActiveChange = (val) => {
        setActiveFilter(val !== undefined ? val : null);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleRefresh = () => {
        setKeyword('');
        setActiveFilter(null);
        setPagination({ current: 1, pageSize: pagination.pageSize });
        fetchMaterials({ page: 1, pageSize: pagination.pageSize, active: null, kw: '' });
    };

    // ── CRUD handlers (REST API) ──────────────────────────────────────────────
    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setFormLoading(true);
            if (formModal.record) {
                await updateMaterial(formModal.record.id, values);
                message.success('Material updated successfully!');
            } else {
                await createMaterial(values);
                message.success('New material added successfully!');
            }
            setFormModal({ open: false, record: null });
            fetchMaterials({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err?.response?.data?.message || 'Error saving Material');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMaterial(id);
            message.success('Material deactivated!');
            fetchMaterials({ page: pagination.current, pageSize: pagination.pageSize });
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error deleting');
        }
    };

    // ── Table columns (sorter=true → triggers $orderby via OData) ───────────
    const columns = [
        {
            title: 'Material Code',
            dataIndex: 'materialCode',
            key: 'materialCode',
            width: 140,
            sorter: true, // OData: $orderby=materialCode asc/desc
            render: (v) => <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</Text>,
        },
        {
            title: 'Description / Name',
            dataIndex: 'description',
            key: 'description',
            sorter: true, // OData: $orderby=description asc/desc
            ellipsis: true,
        },
        {
            title: 'Material Type',
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
            title: 'Base Unit Price',
            dataIndex: 'basePrice',
            key: 'basePrice',
            align: 'right',
            width: 160,
            sorter: true, // OData: $orderby=basePrice desc → sort most expensive first!
            render: (v, record) => (
                <Text type={v ? undefined : 'secondary'}>
                    {v != null ? formatCurrency(v, record.currency || 'VND') : '—'}
                </Text>
            ),
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            align: 'center',
            width: 80,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 130,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            align: 'center',
            width: 110,
            render: (v) => v
                ? <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
                : <Tag icon={<StopOutlined />} color="default">Inactive</Tag>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => openFormModal(record)} />
                    </Tooltip>
                    <Tooltip title="View Stock">
                        <Button
                            size="small"
                            icon={<InboxOutlined style={{ color: '#13c2c2' }} />}
                            onClick={() => setStockModal({ open: true, record })}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete / Deactivate?"
                        description="Material will be marked as Inactive (soft delete)."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Confirm"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete (Soft Delete)">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const stockModalTitle = stockModal.record
        ? `Stock Content: ${stockModal.record.materialCode} — ${stockModal.record.description}`
        : 'Stock Information';

    // Build OData $filter string displayed in UI (live preview)
    const liveFilterDisplay = (() => {
        const parts = [];
        if (activeFilter !== null) parts.push(`isActive eq ${activeFilter}`);
        if (keyword) parts.push(`contains(description, '${keyword}')`);
        return parts.join(' and ');
    })();

    return (
        <div style={{ padding: '0 12px' }}>

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <AppstoreOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                        Material Management
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                        Powered by <Text code style={{ fontSize: 11 }}>OData V4</Text>
                        &nbsp;— Sort, Filter, Search Server-side
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormModal()}>
                    Add Material
                </Button>
            </div>

            {/* ── OData Error Banner ───────────────────────────────────────── */}
            {odataError && (
                <Alert type="warning" showIcon
                    message="OData V4 Endpoint unavailable"
                    description="Endpoint: GET /odata/Materials — Please check backend."
                    style={{ marginBottom: 16 }}
                    action={<Button size="small" onClick={handleRefresh}>Retry</Button>}
                />
            )}

            <Card bordered={false}>
                {/* ── Filter & Search Bar ──────────────────────────────────── */}
                <Space style={{ marginBottom: 16 }} wrap>
                    {/* Keyword search → OData $filter=contains(description,'kw') */}
                    <Input.Search
                        placeholder="Search by Name or Code materials..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 280 }}
                    />

                    {/* Active filter → OData $filter=isActive eq true/false */}
                    <Select
                        placeholder="Filter by status"
                        allowClear
                        style={{ width: 180 }}
                        onChange={handleActiveChange}
                        value={activeFilter}
                    >
                        <Option value={true}>✅ Active</Option>
                        <Option value={false}>⛔ Inactive</Option>
                    </Select>

                    <Tooltip title="Refresh">
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
                    </Tooltip>

                    {/* Show live OData $filter being sent */}
                    {liveFilterDisplay && (
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            $filter={liveFilterDisplay}
                        </Text>
                    )}
                </Space>

                {/* ── Data Table ───────────────────────────────────────────── */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (t, range) => `${range[0]}–${range[1]} / ${t} materials`,
                    }}
                    rowClassName={(record) => !record.isActive ? 'ant-table-row-disabled' : ''}
                />
            </Card>

            {/* ══════════════════════════════════════════════════════════════
                Create / Edit Modal
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={formModal.record ? '✏️ Edit Material' : '➕ Add New Material'}
                open={formModal.open}
                onCancel={() => { setFormModal({ open: false, record: null }); form.resetFields(); }}
                onOk={handleFormSubmit}
                okText={formModal.record ? 'Save Changes' : 'Create'}
                cancelText="Cancel"
                confirmLoading={formLoading}
                width={720}
                centered
                style={{ top: 20 }}
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}
                destroyOnClose
            >
                <Divider style={{ margin: '12px 0' }} />
                <Form form={form} layout="vertical" scrollToFirstError>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="materialType"
                                label="Material Type (SAP)"
                                rules={[{ required: true, message: 'Select material type' }]}
                            >
                                <Select placeholder="Select type...">
                                    {Object.entries(MATERIAL_TYPE_LABELS).map(([k, v]) => (
                                        <Option key={k} value={k}>{v}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="category" label="Category">
                                <Input placeholder="IT, Office, Manufacturing..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                name="description"
                                label="Description / Name materials"
                                rules={[{ required: true, message: 'Please enter description' }]}
                            >
                                <Input placeholder="Full material description..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="unit"
                                label="Unit of Measure (Unit)"
                                rules={[{ required: true, message: 'Enter Unit' }]}
                            >
                                <Input placeholder="PCS, KG, M2..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Base Unit Price" style={{ marginBottom: 0 }}>
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
                        <Col xs={24} md={12}>
                            <Form.Item name="manufacturer" label="Manufacturer">
                                <Input placeholder="Apple, Samsung, Double A..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="imageUrl" label="Image URL">
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="specifications" label="Specifications">
                                <TextArea rows={2} placeholder="RAM 16GB, SSD 512GB..." />
                            </Form.Item>
                        </Col>
                        {/* Show active toggle only in Edit mode */}
                        {formModal.record && (
                            <Col xs={24} md={8}>
                                <Form.Item name="isActive" label="Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        )}
                        <Col xs={24}>
                            <Form.Item name="notes" label="Notes">
                                <TextArea rows={2} placeholder="Additional material info..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ══════════════════════════════════════════════════════════════
                Stock Info Modal — shows live inventory for selected material
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={stockModalTitle}
                open={stockModal.open}
                onCancel={() => setStockModal({ open: false, record: null })}
                footer={null}
                centered
                width={600}
                destroyOnClose
            >
                {stockModal.record && (
                    <MaterialStockCard materialId={stockModal.record.id} />
                )}
            </Modal>
        </div>
    );
}
