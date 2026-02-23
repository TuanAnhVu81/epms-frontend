import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Popconfirm, message, Space, Typography, Card, Tooltip, Modal } from 'antd';
import {
    SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    getPurchaseOrders,
    searchPurchaseOrders,
    getPurchaseOrdersByStatus,
    approvePurchaseOrder,
    rejectPurchaseOrder
} from '../api/purchaseOrderApi';
import { PO_STATUS_CONFIG } from '../utils/constants';

const { Title } = Typography;
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

    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchPOs = async (page = 1, size = 10, status = null, keyword = '') => {
        try {
            setLoading(true);
            let res;
            const params = { page: page - 1, size };

            if (keyword) {
                res = await searchPurchaseOrders(keyword, params);
            } else if (status) {
                res = await getPurchaseOrdersByStatus(status, params);
            } else {
                res = await getPurchaseOrders(params);
            }

            if (res) {
                setData(res.content || []);
                setTotal(res.totalElements || 0);
            }
        } catch (error) {
            console.error('Error fetching POs:', error);
            message.error('Không thể tải danh sách Đơn mua hàng để duyệt');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, statusFilter]);

    const handleSearch = (value) => {
        setSearchKeyword(value);
        setPagination({ ...pagination, current: 1 });
        fetchPOs(1, pagination.pageSize, statusFilter, value);
    };

    const handleTableChange = (pag) => {
        setPagination({ current: pag.current, pageSize: pag.pageSize });
    };

    const handleApprove = async (id) => {
        try {
            await approvePurchaseOrder(id);
            message.success('Đã duyệt đơn mua hàng thành công!');
            fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        } catch (error) {
            message.error('Lỗi khi duyệt đơn hàng');
        }
    };

    const openRejectModal = (id) => {
        setRejectId(id);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            await rejectPurchaseOrder(rejectId, rejectReason);
            message.success('Đã từ chối đơn hàng!');
            setRejectModalOpen(false);
            fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        } catch (error) {
            message.error('Lỗi khi từ chối đơn hàng');
        }
    };

    const columns = [
        {
            title: 'Mã PO',
            dataIndex: 'poNumber',
            key: 'poNumber',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'vendorName',
            key: 'vendorName',
        },
        {
            title: 'Người tạo',
            dataIndex: 'createdBy',
            key: 'createdBy',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
        },
        {
            title: 'Trạng thái',
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
            title: 'Tổng tiền',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            align: 'right',
            render: (val, record) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: record.currency || 'VND' }).format(val || 0),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => {
                const isPending = record.status === 'PENDING';

                return (
                    <Space size="middle">
                        <Tooltip title="Xem chi tiết (Read Only)">
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/purchase-orders/${record.id}`)}
                            />
                        </Tooltip>

                        {isPending && (
                            <>
                                <Popconfirm
                                    title="Duyệt đơn hàng ngay?"
                                    onConfirm={() => handleApprove(record.id)}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                >
                                    <Tooltip title="Duyệt / Approve">
                                        <Button
                                            type="text"
                                            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
                                        />
                                    </Tooltip>
                                </Popconfirm>

                                <Tooltip title="Từ chối / Reject">
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

    return (
        <div style={{ padding: '0 12px' }}>
            <Title level={3} style={{ marginBottom: 24, padding: 0 }}>Duyệt Đơn Mua Hàng (Approvals)</Title>

            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        placeholder="Tìm mã PO, Tên NCC..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />

                    <Select
                        placeholder="Lọc trạng thái"
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
                        showTotal: (t) => `Tổng số ${t} đơn hàng`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Reject Reason Modal */}
            <Modal
                title="Từ chối duyệt cấu hình PO"
                open={isRejectModalOpen}
                onOk={handleReject}
                onCancel={() => setRejectModalOpen(false)}
                okText="Từ chối ngay"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <div style={{ marginBottom: 12 }}>
                    Hãy nhập lý do từ chối (bắt buộc):
                </div>
                <TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Vui lòng nêu rõ lý do từ chối..."
                />
            </Modal>
        </div>
    );
}
