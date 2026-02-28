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

// Helper: format currency with locale
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
            setLoadError('Failed to load PO details. Please try again.');
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
            message.success('PO submitted for approval successfully!');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error submitting');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await approvePurchaseOrder(id);
            message.success('PO approved successfully!');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error approving');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            message.warning('Please enter rejection reason');
            return;
        }
        try {
            setActionLoading(true);
            await rejectPurchaseOrder(id, rejectReason.trim());
            message.success('PO rejected successfully!');
            setRejectModalOpen(false);
            setRejectReason('');
            loadPO();
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error rejecting');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            await deletePurchaseOrder(id);
            message.success('PO cancelled successfully!');
            navigate(-1); // Go back after cancel
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error cancelling PO');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle goods receipt confirmation (EMPLOYEE, APPROVED → RECEIVED)
    const handleReceive = async () => {
        try {
            setActionLoading(true);
            await receiveGoods(id);
            message.success('Receipt confirmed! Stock levels updated.');
            loadPO(); // Refresh to show RECEIVED status
        } catch (err) {
            message.error(err?.response?.data?.message || 'Error confirming receipt');
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Loading / error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Loading PO details..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: 24 }}>
                <Alert type="error" message={loadError} showIcon />
                <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
                    <ArrowLeftOutlined /> Back
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
            title: 'Code materials',
            dataIndex: 'materialCode',
            key: 'materialCode',
            render: (v, record) => <Text strong style={{ fontFamily: 'monospace' }}>{v || record.material?.materialCode}</Text>,
        },
        {
            title: 'Name / Description',
            dataIndex: 'materialDescription',
            key: 'materialDescription',
            render: (v, record) => v || record.material?.description || record.material?.materialName,
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            align: 'center',
            render: (v, record) => v || record.material?.unit,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            render: (v) => v?.toLocaleString('vi-VN'),
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Subtotal',
            dataIndex: 'netAmount',
            key: 'netAmount',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Tax (%)',
            dataIndex: 'taxRate',
            key: 'taxRate',
            align: 'center',
            // taxRate from backend is a decimal (0.1 = 10%)
            render: (v) => `${((v || 0) * 100).toFixed(1)}%`,
        },
        {
            title: 'Tax Amount',
            dataIndex: 'taxAmount',
            key: 'taxAmount',
            align: 'right',
            render: (v) => formatCurrency(v, po.currency),
        },
        {
            title: 'Total',
            dataIndex: 'lineTotal',
            key: 'lineTotal',
            align: 'right',
            render: (v) => (
                <Text strong style={{ color: '#1677ff' }}>{formatCurrency(v, po.currency)}</Text>
            ),
        },
        {
            // Show per-item notes if present; dash when empty
            title: 'Line Notes',
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
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
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
                        <Text type="secondary">Created by <strong>{po.createdBy}</strong> at {formatDateTime(po.createdAt)}</Text>
                    </div>
                </div>

                {/* Action buttons — shown according to role + status rules */}
                <Space wrap>
                    {canEdit && (
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/my-orders/${id}/edit`)}
                        >
                            Edit
                        </Button>
                    )}
                    {canSubmit && (
                        <Popconfirm
                            title="Submit PO?"
                            description="Once submitted, PO cannot be edited."
                            onConfirm={handleSubmit}
                            okText="Confirm"
                            cancelText="Cancel"
                        >
                            <Button type="primary" icon={<SendOutlined />} loading={actionLoading}>
                                Submit
                            </Button>
                        </Popconfirm>
                    )}
                    {canApprove && (
                        <Popconfirm
                            title="Approve orders?"
                            onConfirm={handleApprove}
                            okText="Approve"
                            cancelText="Cancel"
                            okButtonProps={{ style: { background: '#52c41a' } }}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                loading={actionLoading}
                            >
                                Approve
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
                            Reject
                        </Button>
                    )}
                    {/* EMPLOYEE receives goods when status is APPROVED */}
                    {canReceive && (
                        <Popconfirm
                            title="Confirm Receipt?"
                            description={
                                <span style={{ maxWidth: 300, display: 'block' }}>
                                    This action will directly update system inventory quantities.
                                    Are you sure all goods have arrived?
                                </span>
                            }
                            onConfirm={handleReceive}
                            okText="Confirm Receipt"
                            cancelText="Cancel"
                            okButtonProps={{ style: { background: '#13c2c2', borderColor: '#13c2c2' } }}
                        >
                            <Button
                                style={{ background: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }}
                                icon={<TruckOutlined />}
                                loading={actionLoading}
                            >
                                Confirm Receipt
                            </Button>
                        </Popconfirm>
                    )}
                    {canDelete && (
                        <Popconfirm
                            title="Cancel orders?"
                            description="This action cannot be undone."
                            onConfirm={handleDelete}
                            okText="Confirm Cancel"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<DeleteOutlined />} loading={actionLoading}>
                                Cancel PO
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            </div>

            <Row gutter={[16, 16]}>

                {/* ── LEFT COLUMN: Header info + Financial summary ─────────── */}
                <Col xs={24} lg={16}>

                    {/* Header info */}
                    <Card title="Order Information" bordered={false} style={{ marginBottom: 16 }}>
                        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                            <Descriptions.Item label="Vendor">
                                <Text strong>{po.vendor?.vendorName || po.vendorName || '—'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="PO Number">
                                <Text strong style={{ fontFamily: 'monospace', color: '#1677ff' }}>{po.poNumber}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Order Date">
                                {formatDate(po.orderDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Expected Delivery Date">
                                {formatDate(po.deliveryDate || po.expectedDeliveryDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Delivery Address" span={2}>
                                {po.deliveryAddress || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Currency">{po.currency}</Descriptions.Item>
                            <Descriptions.Item label="Notes" span={2}>
                                {po.notes || <Text type="secondary">(None)</Text>}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Line items table */}
                    <Card title={`Material List (${po.items?.length || 0} items)`} bordered={false}>
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
                                            <Text strong>Grand Total</Text>
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
                                        {/* Empty cell for the Line Notes column */}
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
                    <Card title="Financial Summary" bordered={false} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Subtotal (before tax)</Text>
                                <Text>{formatCurrency(po.totalAmount, po.currency)}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Total Tax</Text>
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
                            title="Approval Information"
                            bordered={false}
                            style={{ marginBottom: 16 }}
                            headStyle={{
                                color: po.status === 'APPROVED' ? '#52c41a'
                                    : po.status === 'REJECTED' ? '#ff4d4f' : undefined,
                            }}
                        >
                            <Descriptions column={1} size="small">
                                {po.approver && (
                                    <Descriptions.Item label="Approved by">
                                        <Text strong>{po.approver.fullName || po.approver.username}</Text>
                                    </Descriptions.Item>
                                )}
                                {po.approvedDate && (
                                    <Descriptions.Item label="Approval Date">
                                        {formatDateTime(po.approvedDate)}
                                    </Descriptions.Item>
                                )}
                                {po.rejectionReason && (
                                    <Descriptions.Item label="Reason rejected">
                                        <Text type="danger">{po.rejectionReason}</Text>
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </Card>
                    )}

                    {/* Audit info */}
                    <Card title="Audit Information" bordered={false}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Created by">
                                <Text strong>{po.createdBy}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created Date">
                                {formatDateTime(po.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Last Updated">
                                {formatDateTime(po.modifiedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Number of items">
                                {po.items?.length || 0} lines
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            {/* ── Reject Modal ───────────────────────────────────────────── */}
            <Modal
                title={<Text type="danger"><CloseCircleOutlined /> Reject Purchase Order</Text>}
                open={rejectModalOpen}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectReason('');
                }}
                onOk={handleRejectConfirm}
                okText="Confirm rejected"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: actionLoading, disabled: !rejectReason.trim() }}
                destroyOnClose
            >
                <p>You are rejecting PO <strong>{po.poNumber}</strong>. Please enter reason:</p>
                <Input.TextArea
                    rows={4}
                    placeholder="Enter rejection reason (Required)..."
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
