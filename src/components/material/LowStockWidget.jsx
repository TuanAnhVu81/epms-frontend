import React, { useEffect, useState } from 'react';
import {
    Card, Table, Tag, Button, Typography, Space, Spin, Alert, Tooltip
} from 'antd';
import {
    WarningOutlined, PlusOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLowStockMaterials } from '../../api/materialApi';

const { Text } = Typography;

/**
 * LowStockWidget — displays a table of materials below minimum stock level.
 * Designed for the ADMIN/MANAGER Dashboard page.
 *
 * Columns (per FE_Agent_Prompt.md):
 *   Mã vật tư | Tên Vật tư | Tồn kho hiện tại | Ngưỡng cảnh báo | Vị trí kho | Tạo PO
 */
export default function LowStockWidget() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getLowStockMaterials();
            // API may return the list directly or wrapped in an array
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load low stock:', err);
            setError('Không thể tải danh sách vật tư sắp hết hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    const columns = [
        {
            title: 'Mã vật tư',
            dataIndex: 'materialCode',
            key: 'materialCode',
            render: (code) => <Text strong style={{ color: '#1677ff' }}>{code}</Text>,
        },
        {
            title: 'Tên Vật tư',
            dataIndex: 'materialDescription',
            key: 'materialDescription',
            ellipsis: true,
        },
        {
            title: 'Tồn kho',
            dataIndex: 'quantityOnHand',
            key: 'quantityOnHand',
            align: 'center',
            render: (val) => (
                <Tag color="error" icon={<WarningOutlined />}>
                    {val ?? 0}
                </Tag>
            ),
        },
        {
            title: 'Ngưỡng tối thiểu',
            dataIndex: 'minimumStockLevel',
            key: 'minimumStockLevel',
            align: 'center',
            render: (val) => <Text>{val ?? 0}</Text>,
        },
        {
            title: 'Vị trí kho',
            dataIndex: 'warehouseLocation',
            key: 'warehouseLocation',
            render: (val) => val || '—',
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Tooltip title="Tạo PO mua vật tư này">
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/my-orders/create')}
                    >
                        Tạo PO
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <Card
            title={
                <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>Cảnh báo Tồn kho thấp (Low Stock Alerts)</Text>
                </Space>
            }
            extra={
                <Tooltip title="Tải lại">
                    <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        onClick={fetchLowStock}
                        loading={loading}
                    />
                </Tooltip>
            }
            bordered={false}
            style={{ marginTop: 16 }}
        >
            {error && (
                <Alert type="warning" message={error} showIcon style={{ marginBottom: 12 }} />
            )}

            <Table
                columns={columns}
                dataSource={items}
                rowKey={(r) => r.materialId ?? r.materialCode}
                loading={loading}
                size="small"
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
                locale={{ emptyText: '🎉 Tất cả vật tư đều đang ở mức tồn kho an toàn!' }}
            />
        </Card>
    );
}
