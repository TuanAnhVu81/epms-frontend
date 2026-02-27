import React, { useEffect, useState } from 'react';
import {
    Row, Col, Card, Tag, Table, Descriptions, Button, Space,
    Typography, Divider, Modal, Input, message, Spin, Alert, Popconfirm, Tooltip
} from 'antd';
import {
    ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
    CloseCircleOutlined, DeleteOutlined, EditOutlined, TruckOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    getPurchaseOrderById,
    submitPurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    deletePurchaseOrder,
    receiveGoods,
} from '../api/purchaseOrderApi';
import { PO_STATUS_CONFIG, ROLES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

// Helper: format currency với locale
const formatCurrency = (val, currency = 'VND') =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(val || 0);

// Helper: format date
const formatDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
const formatDateTime = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—');

export default function PODetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // State for Reject modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Role shortcuts
    const isEmployee = user?.roles?.includes(ROLES.EMPLOYEE);
    const isManager = user?.roles?.includes(ROLES.MANAGER);
    const isAdmin = user?.roles?.includes(ROLES.ADMIN);
    const isCreator = po?.createdBy === user?.username;

    const loadPO = async () => {
        try {
            setLoading(true);
            const data = await getPurchaseOrderById(id);
            setPo(data);
        } catch (err) {
            console.error('Failed to load PO:', err);
            setLoadError('Không thể tải chi tiết Đơn mua hàng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPO();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ─── Action handlers ───────────────────────────────────────────────────────

    const handleSubmit = async () => {
        try {
            setActionLoading(true);
            await submitPurchaseOrder(id);
            message.success('Đã trình duyệt đơn hàng thành công!');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi trình duyệt');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await approvePurchaseOrder(id);
            message.success('Đã phê duyệt đơn hàng!');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi phê duyệt');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            message.warning('Vui lòng nhập lý do từ chối');
            return;
        }
        try {
            setActionLoading(true);
            await rejectPurchaseOrder(id, rejectReason.trim());
            message.success('Đã từ chối đơn hàng!');
            setRejectModalOpen(false);
            setRejectReason('');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi từ chối');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            await deletePurchaseOrder(id);
            message.success('Đã hủy đơn hàng!');
            navigate(-1); // Go back after cancel
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi hủy đơn hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle goods receipt confirmation (EMPLOYEE, APPROVED → RECEIVED)
    const handleReceive = async () => {
        try {
            setActionLoading(true);
            await receiveGoods(id);
            message.success('Xác nhận nhận hàng thành công! Tồn kho đã được cập nhật.');
            loadPO(); // Refresh to show RECEIVED status
        } catch (err) {
            message.error(err?.response?.data?.message || 'Lỗi khi xác nhận nhận hàng');
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Loading / error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Đang tải chi tiết đơn hàng..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: 24 }}>
                <Alert type="error" message={loadError} showIcon />
                <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
                    <ArrowLeftOutlined /> Quay lại
                </Button>
            </div>
        );
    }

    if (!po) return null;

    // ─── Derived values ────────────────────────────────────────────────────────
    const statusConfig = PO_STATUS_CONFIG[po.status] || {};
    const isCreated = po.status === 'CREATED';
    const isPending = po.status === 'PENDING';

    // Action button visibility rules
    const canSubmit = isEmployee && isCreator && isCreated;
    const canEdit = isEmployee && isCreator && isCreated;
    const canDelete = (isEmployee && isCreator && isCreated) || isAdmin;
    const canApprove = isManager && isPending;
    const canReject = isManager && isPending;
    // EMPLOYEE can confirm goods receipt when the PO is APPROVED
    const canReceive = isEmployee && po.status === 'APPROVED';

    // ─── Line items table columns ──────────────────────────────────────────────
    const itemColumns = [
        {
            title: '#',
            key: 'idx',
            width: 48,
            render: (_, __, i) => i + 1,
        },
        {
            title: 'Mã vật tư',
            dataIndex: 'materialCode',
            key: 'materialCode',
            render: (v, record) => <Text strong style={{ fontFamily: 'monospace' }}>{v || record.material?.materialCode}</Text>,
        },
        {
            title: 'Tên / Mô tả',
            dataIndex: 'materialDescription',
            key: 'materialDescription',
            render: (v, record) => v || record.material?.description || record.material?.materialName,
        },
        {
            title: 'ĐVT',
            dataIndex: 'unit',
            key: 'unit',
            align: 'center',
            render: (v, record) => v || record.material?.unit,
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            render: (v) => v?.toLocaleString('vi-VN'),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Tiền hàng',
            dataIndex: 'netAmount',
            key: 'netAmount',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Thuế (%)',
            dataIndex: 'taxRate',
            key: 'taxRate',
            align: 'center',
            // taxRate from backend is a decimal (0.1 = 10%)
            render: (v) => `${((v || 0) * 100).toFixed(1)}%`,
        },
        {
            title: 'Tiền thuế',
            dataIndex: 'taxAmount',
            key: 'taxAmount',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Thành tiền',
            dataIndex: 'lineTotal',
            key: 'lineTotal',
            align: 'right',
            render: (v) => (
                <Text strong style={{ color: '#1677ff' }}>{formatCurrency(v, po.currency)}</Text>
            ),
        },
        {
            // Show per-item notes if present; dash when empty
            title: 'Ghi chú dòng',
            dataIndex: 'notes',
            key: 'notes',
            width: 180,
            render: (v) =>
                v ? (
                    <Tooltip title={v}>
                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                            {v}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
                ),
        },
    ];

    return (
        <div style={{ padding: '0 12px' }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Title level={3} style={{ margin: 0 }}>{po.poNumber}</Title>
                            <Tag
                                color={statusConfig.color}
                                style={{ fontSize: 13, padding: '2px 10px', marginLeft: 4 }}
                            >
                                {statusConfig.icon} {statusConfig.label}
                            </Tag>
                        </div>
                        <Text type="secondary">Tạo bởi <strong>{po.createdBy}</strong> lúc {formatDateTime(po.createdAt)}</Text>
                    </div>
                </div>

                {/* Action buttons — shown according to role + status rules */}
                <Space wrap>
                    {canEdit && (
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/my-orders/${id}/edit`)}
                        >
                            Chỉnh sửa
                        </Button>
                    )}
                    {canSubmit && (
                        <Popconfirm
                            title="Trình duyệt đơn hàng?"
                            description="Sau khi trình duyệt, đơn hàng không thể chỉnh sửa."
                            onConfirm={handleSubmit}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <Button type="primary" icon={<SendOutlined />} loading={actionLoading}>
                                Trình duyệt
                            </Button>
                        </Popconfirm>
                    )}
                    {canApprove && (
                        <Popconfirm
                            title="Phê duyệt đơn hàng?"
                            onConfirm={handleApprove}
                            okText="Phê duyệt"
                            cancelText="Hủy"
                            okButtonProps={{ style: { background: '#52c41a' } }}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                loading={actionLoading}
                            >
                                Phê duyệt
                            </Button>
                        </Popconfirm>
                    )}
                    {canReject && (
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={actionLoading}
                            onClick={() => setRejectModalOpen(true)}
                        >
                            Từ chối
                        </Button>
                    )}
                    {/* EMPLOYEE receives goods when status is APPROVED */}
                    {canReceive && (
                        <Popconfirm
                            title="Xác nhận Nhận hàng?"
                            description={
                                <span style={{ maxWidth: 300, display: 'block' }}>
                                    Hành động này sẽ cập nhật trực tiếp vào số lượng tồn kho của hệ thống.
                                    Bạn có chắc chắn hàng đã về đầy đủ?
                                </span>
                            }
                            onConfirm={handleReceive}
                            okText="Xác nhận nhận hàng"
                            cancelText="Hủy"
                            okButtonProps={{ style: { background: '#13c2c2', borderColor: '#13c2c2' } }}
                        >
                            <Button
                                style={{ background: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }}
                                icon={<TruckOutlined />}
                                loading={actionLoading}
                            >
                                Xác nhận Nhận hàng
                            </Button>
                        </Popconfirm>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Hủy đơn hàng?"
                            description="Hành động này không thể hoàn tác."
                            onConfirm={handleDelete}
                            okText="Xác nhận hủy"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<DeleteOutlined />} loading={actionLoading}>
                                Hủy đơn
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            </div>

            <Row gutter={[16, 16]}>

                {/* ── LEFT COLUMN: Header info + Financial summary ─────────── */}
                <Col xs={24} lg={16}>

                    {/* Header info */}
                    <Card title="Thông tin Đơn hàng" bordered={false} style={{ marginBottom: 16 }}>
                        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="Nhà cung cấp">
                                <Text strong>{po.vendor?.vendorName || po.vendorName || '—'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã PO">
                                <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{po.poNumber}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày đặt hàng">
                                {formatDate(po.orderDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày giao dự kiến">
                                {formatDate(po.deliveryDate || po.expectedDeliveryDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
                                {po.deliveryAddress || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiền tệ">{po.currency}</Descriptions.Item>
                            <Descriptions.Item label="Ghi chú" span={2}>
                                {po.notes || <Text type="secondary">(Không có)</Text>}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Line items table */}
                    <Card title={`Danh sách Vật tư (${po.items?.length || 0} mục)`} bordered={false}>
                        <Table
                            columns={itemColumns}
                            dataSource={po.items || []}
                            rowKey="id"
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            size="small"
                            summary={() => (
                                <Table.Summary fixed>
                                    <Table.Summary.Row style={{ background: '#fafafa' }}>
                                        <Table.Summary.Cell index={0} colSpan={6} align="right">
                                            <Text strong>Tổng cộng</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text>{formatCurrency(po.totalAmount, po.currency)}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} />
                                        <Table.Summary.Cell index={3} align="right">
                                            <Text>{formatCurrency(po.taxAmount, po.currency)}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} align="right">
                                            <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                                                {formatCurrency(po.grandTotal, po.currency)}
                                            </Text>
                                        </Table.Summary.Cell>
                                        {/* Empty cell for the Ghi chú dòng column */}
                                        <Table.Summary.Cell index={5} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                    </Card>
                </Col>

                {/* ── RIGHT COLUMN: Financial summary + Approval + Audit ───── */}
                <Col xs={24} lg={8}>

                    {/* Financial summary card */}
                    <Card title="Tổng kết tài chính" bordered={false} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Tiền hàng (trước thuế)</Text>
                                <Text>{formatCurrency(po.totalAmount, po.currency)}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Tổng tiền thuế</Text>
                                <Text>{formatCurrency(po.taxAmount, po.currency)}</Text>
                            </div>
                            <Divider style={{ margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: 15 }}>Grand Total</Text>
                                <Text strong style={{ fontSize: 22, color: '#1677ff' }}>
                                    {formatCurrency(po.grandTotal, po.currency)}
                                </Text>
                            </div>
                        </div>
                    </Card>

                    {/* Approval info — only show if PO has gone through approval flow */}
                    {(po.approver || po.approvedDate || po.rejectionReason) && (
                        <Card
                            title="Thông tin Phê duyệt"
                            bordered={false}
                            style={{ marginBottom: 16 }}
                            headStyle={{
                                color: po.status === 'APPROVED' ? '#52c41a'
                                    : po.status === 'REJECTED' ? '#ff4d4f' : undefined,
                            }}
                        >
                            <Descriptions column={1} size="small">
                                {po.approver && (
                                    <Descriptions.Item label="Người phê duyệt">
                                        <Text strong>{po.approver.fullName || po.approver.username}</Text>
                                    </Descriptions.Item>
                                )}
                                {po.approvedDate && (
                                    <Descriptions.Item label="Ngày phê duyệt">
                                        {formatDateTime(po.approvedDate)}
                                    </Descriptions.Item>
                                )}
                                {po.rejectionReason && (
                                    <Descriptions.Item label="Lý do từ chối">
                                        <Text type="danger">{po.rejectionReason}</Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    )}

                    {/* Audit info */}
                    <Card title="Thông tin Audit" bordered={false}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Tạo bởi">
                                <Text strong>{po.createdBy}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {formatDateTime(po.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối">
                                {formatDateTime(po.modifiedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số mục vật tư">
                                {po.items?.length || 0} dòng
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            {/* ── Reject Modal ───────────────────────────────────────────── */}
            <Modal
                title={<Text type="danger"><CloseCircleOutlined /> Từ chối Đơn mua hàng</Text>}
                open={rejectModalOpen}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectReason('');
                }}
                onOk={handleRejectConfirm}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: actionLoading, disabled: !rejectReason.trim() }}
                destroyOnClose
            >
                <p>Bạn đang từ chối đơn hàng <strong>{po.poNumber}</strong>. Vui lòng nhập lý do:</p>
                <Input.TextArea
                    rows={4}
                    placeholder="Nhập lý do từ chối (bắt buộc)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    maxLength={500}
                    showCount
                    autoFocus
                />
            </Modal>
        </div>
    );
}
