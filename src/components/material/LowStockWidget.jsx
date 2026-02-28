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
 *   Code materials | Material Description | Stock Content hiện tại | Warning Threshold | Warehouse Location | Create PO
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
            setError('Failed to load low stock materials list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    const columns = [
        {
            title: 'Code materials',
            dataIndex: 'materialCode',
            key: 'materialCode',
            render: (code) => <Text strong style={{ color: '#1677ff' }}>{code}</Text>,
        },
        {
            title: 'Material Description',
            dataIndex: 'materialDescription',
            key: 'materialDescription',
            ellipsis: true,
        },
        {
            title: 'Stock Content',
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
            title: 'Minimum Threshold',
            dataIndex: 'minimumStockLevel',
            key: 'minimumStockLevel',
            align: 'center',
            render: (val) => <Text>{val ?? 0}</Text>,
        },
        {
            title: 'Warehouse Location',
            dataIndex: 'warehouseLocation',
            key: 'warehouseLocation',
            render: (val) => val || '—',
        },
        {
            title: 'Actions',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Tooltip title="Create PO mua materials này">
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/my-orders/create')}
                    >
                        Create PO
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
                    <Text strong>Low Stock Warning (Low Stock Alerts)</Text>
                </Space>
            }
            extra={
                <Tooltip title="Reload">
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
                locale={{ emptyText: '🎉 All materials are at safe stock levels!' }}
            />
        </Card>
    );
}
