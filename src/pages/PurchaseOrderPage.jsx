import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, Button, Input, Select, Tag, Popconfirm,
    message, Space, Typography, Card, Tooltip, Badge, Alert
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    SendOutlined, EyeOutlined, ThunderboltOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queryPurchaseOrdersOData } from '../api/odataApi';
import { deletePurchaseOrder, submitPurchaseOrder } from '../api/purchaseOrderApi';
import { PO_STATUS_CONFIG } from '../utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * PurchaseOrderPage — Refactored to use OData V4 API for:
 *   ✅ Server-side Pagination  → $top / $skip
 *   ✅ Server-side Sorting     → $orderby (click column header)
 *   ✅ Dynamic Status Filter   → $filter=status eq 'APPROVED'
 *   ✅ Keyword Search          → $filter=contains(poNumber, 'kw') or contains(vendorName, 'kw')
 *
 * All above operations send ONE unified OData query string — no separate API endpoints needed.
 *
 * OData endpoint used: GET /odata/PurchaseOrders?$top=10&$skip=0&$count=true&$filter=...
 */
export default function PurchaseOrderPage() {
    const navigate = useNavigate();

    // ── Data state ────────────────────────────────────────────────────────────
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [odataError, setOdataError] = useState(false); // Flag if OData endpoint fails

    // ── OData query parameters state ──────────────────────────────────────────
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState(null);           // { field, order }
    const [statusFilter, setStatusFilter] = useState(null);
    const [keyword, setKeyword] = useState('');

    // ── Fetch via OData ───────────────────────────────────────────────────────
    // Defined as a plain function (not useCallback) to always read latest state
    // All params are passed explicitly to avoid stale closure issues
    const fetchPOs = async ({
        page = pagination.current,
        pageSize = pagination.pageSize,
        sort = sorter,
        status = statusFilter,
        kw = keyword,
    } = {}) => {
        try {
            setLoading(true);
            setOdataError(false);

            // Build and send OData query: all params merged into ONE request
            const { data: rows, total: count } = await queryPurchaseOrdersOData({
                page,
                pageSize,
                sort,
                statusFilter: status,
                keyword: kw,
            });

            setData(rows);
            setTotal(count);
        } catch (err) {
            console.error('[OData] Failed to fetch POs:', err);
            // Clear stale data so user doesn't see old results after a failed filtered request
            setData([]);
            setTotal(0);
            setOdataError(true);
            message.error('Không thể tải dữ liệu qua OData V4. Vui lòng kiểm tra kết nối backend.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and re-fetch whenever any query param changes
    useEffect(() => {
        fetchPOs({ page: pagination.current, pageSize: pagination.pageSize });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, sorter, statusFilter]);

    // ── Event handlers ────────────────────────────────────────────────────────

    /** Handle Ant Design Table change: fires on sort/page/pageSize change */
    const handleTableChange = (pag, _filters, sorterInfo) => {
        // Update pagination
        setPagination({ current: pag.current, pageSize: pag.pageSize });

        // Update OData $orderby from column sorter
        // Ant Design sorter: { field: 'grandTotal', order: 'descend' }
        if (sorterInfo?.column) {
            setSorter({ field: sorterInfo.field, order: sorterInfo.order });
        } else {
            setSorter(null); // Reset to default sort when user clears sorter
        }
    };

    const handleSearch = (value) => {
        const kw = value?.trim() || '';
        setKeyword(kw);
        setPagination((prev) => ({ ...prev, current: 1 })); // Reset to page 1 on new search
        fetchPOs({ page: 1, pageSize: pagination.pageSize, kw });
    };

    const handleStatusChange = (val) => {
        setStatusFilter(val || null);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleRefresh = () => {
        fetchPOs({ page: pagination.current, pageSize: pagination.pageSize });
    };

    const handleDelete = async (id) => {
        try {
            await deletePurchaseOrder(id);
            message.success('Đã hủy Đơn mua hàng!');
            fetchPOs({ page: pagination.current, pageSize: pagination.pageSize });
        } catch {
            message.error('Lỗi khi hủy Đơn mua hàng');
        }
    };

    const handleSubmit = async (id) => {
        try {
            await submitPurchaseOrder(id);
            message.success('Đã trình duyệt Đơn mua hàng thành công!');
            fetchPOs({ page: pagination.current, pageSize: pagination.pageSize });
        } catch {
            message.error('Lỗi khi submit Đơn mua hàng');
        }
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Mã PO',
            dataIndex: 'poNumber',
            key: 'poNumber',
            sorter: true, // Enable server-side $orderby via OData
            render: (text) => (
                <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'vendorName',
            key: 'vendorName',
            sorter: true,
            ellipsis: true,
        },
        {
            title: 'Ngày đặt hàng',
            dataIndex: 'orderDate',
            key: 'orderDate',
            sorter: true, // OData: $orderby=orderDate asc/desc
            width: 140,
            render: (val) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (status) => {
                const config = PO_STATUS_CONFIG[status];
                return config ? (
                    <Tag color={config.color} icon={<span style={{ marginRight: 4 }}>{config.icon}</span>}>
                        {config.label}
                    </Tag>
                ) : <Tag>{status}</Tag>;
            },
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            align: 'right',
            sorter: true, // OData: $orderby=grandTotal desc → sort by value!
            width: 160,
            render: (val, record) =>
                new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: record.currency || 'VND',
                }).format(val || 0),
        },
        {
            title: 'SL Mục',
            dataIndex: 'itemCount',
            key: 'itemCount',
            align: 'center',
            width: 80,
            render: (val) => (
                <Badge count={val || 0} showZero color="#1677ff" />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            width: 140,
            render: (_, record) => {
                const canEditDelete = record.status === 'CREATED';

                return (
                    <Space size="small">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/purchase-orders/${record.id}`)}
                            />
                        </Tooltip>

                        {canEditDelete && (
                            <>
                                <Tooltip title="Chỉnh sửa">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined style={{ color: '#1677ff' }} />}
                                        onClick={() => navigate(`/my-orders/${record.id}/edit`)}
                                    />
                                </Tooltip>

                                <Popconfirm
                                    title="Trình duyệt PO?"
                                    description="Sau khi trình duyệt, đơn hàng không thể chỉnh sửa."
                                    onConfirm={() => handleSubmit(record.id)}
                                    okText="Trình duyệt"
                                    cancelText="Hủy"
                                >
                                    <Tooltip title="Trình duyệt">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<SendOutlined style={{ color: '#52c41a' }} />}
                                        />
                                    </Tooltip>
                                </Popconfirm>

                                <Popconfirm
                                    title="Hủy đơn hàng?"
                                    description="Hành động này không thể hoàn tác."
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Tooltip title="Hủy đơn">
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                    </Tooltip>
                                </Popconfirm>
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: '0 12px' }}>

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý Đơn mua hàng</Title>
                    {/* OData badge — great talking point in CV interviews! */}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                        Powered by&nbsp;
                        <Text code style={{ fontSize: 11 }}>OData V4</Text>
                        &nbsp;— Hỗ trợ tìm kiếm, lọc, sắp xếp phía Server
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/my-orders/create')}>
                    Tạo P.O mới
                </Button>
            </div>

            {/* ── OData Error Banner ───────────────────────────────────────── */}
            {odataError && (
                <Alert
                    type="warning"
                    showIcon
                    message="OData V4 Endpoint không khả dụng"
                    description="Backend OData service có thể chưa được khởi động. Endpoint: GET /odata/PurchaseOrders"
                    style={{ marginBottom: 16 }}
                    action={
                        <Button size="small" onClick={handleRefresh}>Thử lại</Button>
                    }
                />
            )}

            <Card bordered={false}>
                {/* ── Filter & Search Bar ──────────────────────────────────── */}
                <Space style={{ marginBottom: 16 }} wrap>
                    {/* Keyword search → OData $filter=contains(...) */}
                    <Input.Search
                        placeholder="Tìm mã PO hoặc Nhà cung cấp..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        enterButton={<SearchButton />}
                    />

                    {/* Status filter → OData $filter=status eq '...' */}
                    <Select
                        placeholder="Lọc theo trạng thái"
                        allowClear
                        style={{ width: 210 }}
                        onChange={handleStatusChange}
                    >
                        {Object.entries(PO_STATUS_CONFIG).map(([key, config]) => (
                            <Option key={key} value={key}>
                                {config.icon} {config.label}
                            </Option>
                        ))}
                    </Select>

                    {/* Refresh button */}
                    <Tooltip title="Làm mới dữ liệu">
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
                    </Tooltip>

                    {/* Show active OData query for educational/debug purposes */}
                    {(statusFilter || keyword) && (
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {'$filter='}
                            {statusFilter && `status eq '${statusFilter}'`}
                            {statusFilter && keyword && ' and '}
                            {keyword && `contains(poNumber, '${keyword}')`}
                        </Text>
                    )}
                </Space>

                {/* ── Data Table ───────────────────────────────────────────── */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}  // Handles sort + pagination changes → triggers OData re-query
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,               // From OData @odata.count
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (t, range) =>
                            `${range[0]}–${range[1]} / ${t} đơn hàng`,
                    }}
                />
            </Card>
        </div>
    );
}

// Tiny icon component for Search button label
function SearchButton() {
    return <span>Tìm</span>;
}
