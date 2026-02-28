import React, { useEffect, useState } from 'react';
import {
    Card, Descriptions, Badge, Progress, Spin, Tag, Typography, Space, Alert
} from 'antd';
import {
    WarningOutlined, CheckCircleOutlined, InboxOutlined
} from '@ant-design/icons';
import { getMaterialStock } from '../../api/materialApi';

const { Text } = Typography;

/**
 * MaterialStockCard — displays real-time inventory data for a given material.
 * Props:
 *   - materialId (UUID string): the ID of the material to fetch stock for
 *
 * Design rules from FE_Agent_Prompt.md:
 *   - LOW STOCK badge (red/orange) when lowStock === true or quantityOnHand < minimumStockLevel
 *   - IN STOCK badge (green) otherwise
 *   - Handle 404 gracefully (no stock record yet → show "No stock data")
 */
export default function MaterialStockCard({ materialId }) {
    const [stock, setStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!materialId) return;

        const fetchStock = async () => {
            try {
                setLoading(true);
                setNotFound(false);
                const data = await getMaterialStock(materialId);
                setStock(data);
            } catch (err) {
                // Handle 404: material might not have a stock record yet
                if (err?.response?.status === 404) {
                    setNotFound(true);
                } else {
                    console.error('Failed to load stock data:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, [materialId]);

    // Determine if low stock condition is met
    const isLowStock = stock
        ? (stock.lowStock === true || stock.quantityOnHand < stock.minimumStockLevel)
        : false;

    // Calculate stock percentage (0→100) relative to minimum threshold * 2 as "full"
    const stockPercent = stock && stock.minimumStockLevel > 0
        ? Math.min(100, Math.round((stock.quantityOnHand / (stock.minimumStockLevel * 2)) * 100))
        : 0;

    const progressStatus = isLowStock ? 'exception' : 'success';
    const progressColor = isLowStock ? '#ff4d4f' : '#52c41a';

    return (
        <Card
            title={
                <Space>
                    <InboxOutlined style={{ color: '#1677ff' }} />
                    <Text strong>Stock Information</Text>
                    {!loading && !notFound && stock && (
                        isLowStock
                            ? (
                                <Tag color="error" icon={<WarningOutlined />}>
                                    LOW STOCK
                                </Tag>
                            ) : (
                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                    IN STOCK
                                </Tag>
                            )
                    )}
                </Space>
            }
            bordered={false}
            style={{ marginTop: 16 }}
        >
            {loading && <Spin tip="Loading stock data..." />}

            {!loading && notFound && (
                <Alert
                    type="info"
                    showIcon
                    message="No stock data"
                    description="This material has never been received."
                />
            )}

            {!loading && !notFound && stock && (
                <>
                    {/* Stock Progress Bar for visual clarity */}
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Stock Ratio (vs min threshold × 2)
                        </Text>
                        <Progress
                            percent={stockPercent}
                            status={progressStatus}
                            strokeColor={progressColor}
                            format={(p) => `${p}%`}
                        />
                    </div>

                    {/* Inventory detail fields */}
                    <Descriptions column={{ xs: 1, sm: 2, md: 2 }} size="small">
                        <Descriptions.Item label="Actual Stock">
                            <Text strong style={{ color: isLowStock ? '#ff4d4f' : '#52c41a' }}>
                                {stock.quantityOnHand ?? 0}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Reserved Quantity">
                            {stock.reservedQuantity ?? 0}
                        </Descriptions.Item>
                        <Descriptions.Item label="Available">
                            <Text strong>{stock.availableQuantity ?? 0}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Minimum Threshold">
                            {stock.minimumStockLevel ?? 0}
                        </Descriptions.Item>
                        <Descriptions.Item label="Warehouse Location" span={2}>
                            {stock.warehouseLocation || '—'}
                        </Descriptions.Item>
                    </Descriptions>
                </>
            )}
        </Card>
    );
}
