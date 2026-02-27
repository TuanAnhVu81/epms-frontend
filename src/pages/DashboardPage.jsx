import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, Alert, Empty } from 'antd';
import {
    DollarOutlined,
    ShoppingCartOutlined,
    ClockCircleOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line,
    ResponsiveContainer
} from 'recharts';
import { getDashboard } from '../api/analyticsApi';
import { PO_STATUS_CONFIG, ROLES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import LowStockWidget from '../components/material/LowStockWidget';

const { Title } = Typography;

// Component render 4 KPI Cards and 3 Charts for Analytics module
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        statusSummary: [],
        topVendors: [],
        monthlyTrend: [],
    });
    const user = useAuthStore((s) => s.user);
    // Show LowStockWidget only for privileged roles (Admin/Manager)
    const canSeeInventory = user?.roles?.some((r) => [ROLES.ADMIN, ROLES.MANAGER].includes(r));

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getDashboard();
                if (res) {
                    setData(res);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Không thể tải dữ liệu Dashboard. Vui lòng kiểm tra kết nối với server.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <Alert message="Lỗi tải giao diện Dashboard" description={error} type="error" showIcon />
            </div>
        );
    }

    const { statusSummary = [], topVendors = [], monthlyTrend = [] } = data;

    // 1. Calculate metrics for 4 KPI Cards
    const totalOrders = statusSummary.reduce((sum, item) => sum + (item.count || 0), 0);

    // Total value for both APPROVED and RECEIVED POs (Committed Budget)
    const approvedValue = statusSummary
        .filter((s) => s.status === 'APPROVED' || s.status === 'RECEIVED')
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    const pendingCount = statusSummary.find((s) => s.status === 'PENDING')?.count || 0;

    // Approval Rate average from monthlyTrend
    const avgApprovalRate = monthlyTrend.length > 0
        ? monthlyTrend.reduce((sum, item) => sum + (item.approvalRate || 0), 0) / monthlyTrend.length
        : 0;

    // Extract base currency from the first available status group (Backend returns data normalized)
    const baseCurrency = statusSummary.find((s) => s.currency)?.currency || 'VND';

    // Helper functions
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: baseCurrency }).format(val || 0);
    const formatCompact = (val) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(val || 0);

    // Dùng mã màu hex riêng biệt cho từng trạng thái trên biểu đồ
    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#52c41a';    // Xanh lá (rõ)
            case 'PENDING': return '#faad14';     // Vàng cam
            case 'REJECTED': return '#ff4d4f';    // Đỏ
            case 'CREATED': return '#1677ff';     // Xanh dương (Thay vì xám để dễ phân biệt với hủy)
            case 'CANCELLED': return '#bfbfbf';   // Xám
            default: return '#d9d9d9';            // Dự phòng
        }
    };

    // 2. Prepare Donut Chart (PO Status)
    const donutData = statusSummary.map((s) => ({
        name: PO_STATUS_CONFIG[s.status]?.label || s.status,
        value: s.count,
        color: getStatusColor(s.status),
    }));

    // 3. Prepare Bar Chart (Top Vendors)
    const barData = topVendors.map((v) => ({
        name: v.vendorCode,
        value: v.totalPurchaseValue,
    }));

    // 4. Prepare Line Chart (Daily Trend)
    const lineData = monthlyTrend.map((m) => ({
        name: m.monthName, // Backend is now sending "DD/MM" in this field instead
        amount: m.totalValue,
        count: m.totalOrders,
    }));

    // Chart tooltip formatters
    const renderTooltipValue = (value) => {
        return [formatCurrency(value), 'Giá trị'];
    };

    return (
        <div style={{ padding: '0 12px' }}>
            <Title level={3} style={{ marginBottom: 24 }}>Dashboard Quản Trị (Analytics)</Title>

            {/* Row 1: 4 KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable loading={loading}>
                        <Statistic
                            title="Tổng số P.O đã tạo"
                            value={totalOrders}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable loading={loading}>
                        <Statistic
                            title="Tổng giá trị P.O (Đã duyệt)"
                            value={approvedValue}
                            precision={0}
                            prefix={<DollarOutlined />}
                            formatter={(val) => formatCurrency(val)}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable loading={loading}>
                        <Statistic
                            title="Tỉ lệ duyệt trung bình (Monthly)"
                            value={avgApprovalRate}
                            precision={1}
                            suffix="%"
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable loading={loading}>
                        <Statistic
                            title="Đơn đang chờ duyệt (PENDING)"
                            value={pendingCount}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* Row 2 - Left: PO Status Donut Chart */}
                <Col xs={24} lg={8}>
                    <Card title="Phân bổ trạng thái P.O (Số lượng)" bordered={false} hoverable loading={loading} style={{ height: '100%' }}>
                        {statusSummary.length > 0 && totalOrders > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty description="Không có dữ liệu P.O" />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Row 2 - Right: Top Vendors Bar Chart */}
                <Col xs={24} lg={16}>
                    <Card title="Top Nhà cung cấp (Giá trị Mua)" bordered={false} hoverable loading={loading} style={{ height: '100%' }}>
                        {topVendors.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis
                                        tickFormatter={formatCompact}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip formatter={renderTooltipValue} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Legend />
                                    <Bar dataKey="value" name="Giá trị ($)" fill="#1677ff" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty description="Không có dữ liệu NCC" />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Row 3: Daily Trend Line Chart */}
                <Col xs={24}>
                    <Card title="Xu hướng Mua hàng theo thời gian (14 ngày gần nhất)" bordered={false} hoverable loading={loading} style={{ marginTop: 16 }}>
                        {monthlyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />

                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={formatCompact}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: `Giá trị mua (${baseCurrency})`, angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: 'Số lượng PO', angle: 90, position: 'insideRight', style: { fill: '#666' } }}
                                    />

                                    <Tooltip
                                        formatter={(value, name) => [
                                            name === `Giá trị mua (${baseCurrency})` ? formatCurrency(value) : value,
                                            name
                                        ]}
                                    />
                                    <Legend verticalAlign="top" height={36} />

                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="amount"
                                        name={`Giá trị mua (${baseCurrency})`}
                                        stroke="#52c41a"
                                        strokeWidth={3}
                                        activeDot={{ r: 8 }}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="count"
                                        name="Số lượng PO"
                                        stroke="#faad14"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty description="Không có dữ liệu mua hàng" />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Row 4: Low Stock Alerts — only visible for Admin and Manager */}
            {canSeeInventory && <LowStockWidget />}
        </div>
    );
}
