import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Popconfirm, message, Space, Typography, Card, Tooltip } from 'antd';
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, SendOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    getPurchaseOrders,
    searchPurchaseOrders,
    getPurchaseOrdersByStatus,
    deletePurchaseOrder,
    submitPurchaseOrder
} from '../api/purchaseOrderApi';
import { PO_STATUS_CONFIG } from '../utils/constants';

const { Title } = Typography;
const { Option } = Select;

export default function PurchaseOrderPage() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [statusFilter, setStatusFilter] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');

    const fetchPOs = async (page = 1, size = 10, status = null, keyword = '') => {
        try {
            setLoading(true);
            let res;
            const params = { page: page - 1, size }; // Spring Data JPA pages are 0-indexed

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
            message.error('Không thể tải danh sách Đơn mua hàng');
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
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchPOs(1, pagination.pageSize, statusFilter, value);
    };

    const handleTableChange = (pag) => {
        setPagination({ current: pag.current, pageSize: pag.pageSize });
    };

    const handleDelete = async (id) => {
        try {
            await deletePurchaseOrder(id);
            message.success('Đã xóa Đơn mua hàng!');
            fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        } catch (error) {
            message.error('Lỗi khi xóa Đơn mua hàng');
        }
    };

    const handleSubmit = async (id) => {
        try {
            await submitPurchaseOrder(id);
            message.success('Đã trình duyệt Đơn mua hàng thành công!');
            fetchPOs(pagination.current, pagination.pageSize, statusFilter, searchKeyword);
        } catch (error) {
            message.error('Lỗi khi submit Đơn mua hàng');
        }
    };

    const columns = [
        {
            title: 'Mã PO',
            dataIndex: 'poNumber',
            key: 'poNumber',
            fontWeight: 'bold',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'vendorName',
            key: 'vendorName',
        },
        {
            title: 'Ngày đặt hàng',
            dataIndex: 'orderDate',
            key: 'orderDate',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
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
            title: 'SL Mục',
            dataIndex: 'itemCount',
            key: 'itemCount',
            align: 'center',
            render: (val) => val || 0,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => {
                const canEditDelete = record.status === 'CREATED';

                return (
                    <Space size="middle">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/purchase-orders/${record.id}`)}
                            />
                        </Tooltip>

                        {canEditDelete && (
                            <>
                                <Tooltip title="Chỉnh sửa">
                                    <Button
                                        type="text"
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
                                        <Button type="text" icon={<SendOutlined style={{ color: '#52c41a' }} />} />
                                    </Tooltip>
                                </Popconfirm>

                                <Popconfirm
                                    title="Xóa đơn hàng?"
                                    description="Hành động này không thể hoàn tác."
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Tooltip title="Xóa">
                                        <Button type="text" danger icon={<DeleteOutlined />} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý Đơn mua hàng (My Orders)</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/my-orders/create')}>
                    Tạo P.O mới
                </Button>
            </div>

            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 16 }} wrap>
                    <Input.Search
                        placeholder="Tìm theo mã PO, NCC..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />

                    <Select
                        placeholder="Lọc theo trạng thái"
                        allowClear
                        style={{ width: 200 }}
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
                        showTotal: (t) => `Tổng số ${t} dòng`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
}
