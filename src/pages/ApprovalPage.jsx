import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Popconfirm, message, Space, Typography, Card, Tooltip, Modal } from 'antd';
import {
    EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    approvePurchaseOrder,
    rejectPurchaseOrder
} from '../api/purchaseOrderApi';
import { queryPurchaseOrdersOData } from '../api/odataApi';
import { PO_STATUS_CONFIG } from '../utils/constants';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ApprovalPage() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to PENDING for approvals
    const [searchKeyword, setSearchKeyword] = useState('');

    const [sorter, setSorter] = useState(null); // { field, order }

    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchPOs = async ({ page = pagination.current, size = pagination.pageSize, status = statusFilter, keyword = searchKeyword, sort = sorter } = {}) => {
        try {
            setLoading(true);
            const { data: resData, total: totalCount } = await queryPurchaseOrdersOData({
                page,
                pageSize: size,
                statusFilter: status || null,
                keyword: keyword || '',
                sort,
            });
            setData(resData);
            setTotal(totalCount);
        } catch (error) {
            console.error('Error fetching POs:', error);
            message.error('Failed to load PO approval list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPOs({ page: pagination.current, size: pagination.pageSize, status: statusFilter, keyword: searchKeyword, sort: sorter });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, statusFilter, sorter]);

    const handleSearch = (value) => {
        setSearchKeyword(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
        // Pass value explicitly — DO NOT rely on searchKeyword state here
        // State update is async so searchKeyword would still be the OLD value
        // when fetchPOs reads it from its default params
        fetchPOs({ page: 1, size: pagination.pageSize, status: statusFilter, keyword: value, sort: sorter });
    };

    const handleTableChange = (pag, filters, currentSorter) => {
        setPagination({ current: pag.current, pageSize: pag.pageSize });
        if (currentSorter && currentSorter.field && currentSorter.order) {
            setSorter({ field: currentSorter.field, order: currentSorter.order });
        } else {
            setSorter(null);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approvePurchaseOrder(id);
            message.success('approved PO successfully!');
            fetchPOs({ page: pagination.current, size: pagination.pageSize, status: statusFilter, keyword: searchKeyword, sort: sorter });
        } catch (error) {
            message.error('Failed to approve PO');
        }
    };

    const openRejectModal = (id) => {
        setRejectId(id);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning('Please enter rejection reason');
            return;
        }

        try {
            await rejectPurchaseOrder(rejectId, rejectReason);
            message.success('PO rejected successfully!');
            setRejectModalOpen(false);
            fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        } catch (error) {
            message.error('Failed to reject PO');
        }
    };

    const columns = [
        {
            title: 'PO Number',
            dataIndex: 'poNumber',
            key: 'poNumber',
            sorter: true,
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Vendor',
            dataIndex: 'vendorName',
            key: 'vendorName',
            sorter: true,
        },
        {
            title: 'Creator',
            dataIndex: 'createdBy',
            key: 'createdBy',
        },
        {
            title: 'Order Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            sorter: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
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
            title: 'Total Amount',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            align: 'right',
            render: (val, record) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: record.currency || 'VND' }).format(val || 0),
        },
        {
            title: 'Actions',
            key: 'action',
            align: 'center',
            render: (_, record) => {
                const isPending = record.status === 'PENDING';

                return (
                    <Space size="middle">
                        <Tooltip title="View Details (Read Only)">
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/purchase-orders/${record.id}`)}
                            />
                        </Tooltip>

                        {isPending && (
                            <>
                                <Popconfirm
                                    title="Approve orders ngay?"
                                    onConfirm={() => handleApprove(record.id)}
                                    okText="Confirm"
                                    cancelText="Cancel"
                                >
                                    <Tooltip title="Approve / Approve">
                                        <Button
                                            type="text"
                                            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
                                        />
                                    </Tooltip>
                                </Popconfirm>

                                <Tooltip title="Reject / Reject">
                                    <Button
                                        type="text"
                                        danger
                                        icon={<CloseCircleOutlined style={{ fontSize: 18 }} />}
                                        onClick={() => openRejectModal(record.id)}
                                    />
                                </Tooltip>
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    // Build live OData $filter string for visual display in toolbar
    // Same pattern as MaterialPage — helps HR/interviewer see OData in action
    const liveFilterDisplay = (() => {
        const parts = [];
        if (statusFilter) parts.push(`status eq '${statusFilter}'`);
        if (searchKeyword && searchKeyword.trim())
            parts.push(`contains(poNumber, '${searchKeyword.trim()}')`);
        return parts.join(' and ');
    })();

    return (
        <div style={{ padding: '0 12px' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, padding: 0 }}>Purchase Order Approvals</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    Powered by&nbsp;
                    <Text code style={{ fontSize: 11 }}>OData V4</Text>
                    &nbsp;— Server-side search, filter, and sort supported
                </Text>
            </div>

            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        placeholder="Search PO Number, Vendor Name..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />

                    <Select
                        placeholder="Filter by Status"
                        allowClear
                        value={statusFilter}
                        style={{ width: 220 }}
                        onChange={(val) => {
                            setStatusFilter(val);
                            setPagination({ ...pagination, current: 1 });
                        }}
                    >
                        {Object.entries(PO_STATUS_CONFIG).map(([key, config]) => (
                            <Option key={key} value={key}>
                                {config.icon} {config.label}
                            </Option>
                        ))}
                    </Select>

                    {/* Reload button */}
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchPOs()}
                            loading={loading}
                        />
                    </Tooltip>

                    {/* Live OData $filter display — shows exact query string sent to backend */}
                    {liveFilterDisplay && (
                        <Text
                            type="secondary"
                            style={{ fontSize: 11, fontFamily: 'monospace', color: '#8c8c8c' }}
                        >
                            $filter={liveFilterDisplay}
                        </Text>
                    )}
                </Space>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: total,
                        showSizeChanger: true,
                        showTotal: (t) => `Total ${t} orders`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Reject Reason Modal */}
            <Modal
                title="Reject PO"
                open={isRejectModalOpen}
                onOk={handleReject}
                onCancel={() => setRejectModalOpen(false)}
                okText="Reject ngay"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <div style={{ marginBottom: 12 }}>
                    Please enter rejection reason (Required):
                </div>
                <TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specify rejection reason..."
                />
            </Modal>
        </div>
    );
}
