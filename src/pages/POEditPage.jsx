import React, { useEffect, useState } from 'react';
import {
    Form, Select, DatePicker, Input, Button,
    Card, Row, Col, Typography, Space, message, Spin, Alert
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPurchaseOrderById, updatePurchaseOrder } from '../api/purchaseOrderApi';
import { fetchAllVendorsForDropdown, fetchAllActiveMaterialsForDropdown } from '../api/odataApi';
import POItemForm from '../components/po/POItemForm';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CURRENCIES = ['VND', 'USD', 'EUR'];

export default function POEditPage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams(); // Get PO id from URL (e.g. /my-orders/:id/edit)

    const [submitting, setSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [currency, setCurrency] = useState('VND');
    const [poStatus, setPoStatus] = useState(null);

    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoadingData(true);

                // Load PO details + dropdowns in parallel
                const [vendors, materials, poRes] = await Promise.all([
                    fetchAllVendorsForDropdown(),
                    fetchAllActiveMaterialsForDropdown(),
                    getPurchaseOrderById(id),
                ]);

                // OData returns flat array directly (no .content wrapper)
                setVendors(vendors);
                setMaterials(materials);

                // Populate form with existing PO data
                if (poRes) {
                    setPoStatus(poRes.status);
                    setCurrency(poRes.currency || 'VND');

                    form.setFieldsValue({
                        vendorId: poRes.vendorId,
                        currency: poRes.currency,
                        orderDate: poRes.orderDate ? dayjs(poRes.orderDate) : null,
                        deliveryDate: poRes.deliveryDate ? dayjs(poRes.deliveryDate) : null,
                        deliveryAddress: poRes.deliveryAddress,
                        notes: poRes.notes,
                        // Map existing line items to form structure
                        items: (poRes.items || []).map((item) => ({
                            materialId: item.material?.id,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxRate: (item.taxRate || 0) * 100,
                            netAmount: item.netAmount,
                            taxAmount: item.taxAmount,
                            lineTotal: item.lineTotal,
                        })),
                    });

                    // Set initial grand total from saved data
                    const saved = (poRes.items || []).reduce((sum, it) => sum + (it.lineTotal || 0), 0);
                    setGrandTotal(saved);
                }
            } catch (err) {
                console.error('Failed to load initial PO details:', err);
                setLoadError('Failed to fetch Purchase Order data. Please go back and try again.');
            } finally {
                setLoadingData(false);
            }
        };

        loadAll();
    }, [id, form]);

    const onFinish = async (values) => {
        try {
            setSubmitting(true);

            const payload = {
                vendorId: values.vendorId,
                orderDate: values.orderDate ? values.orderDate.format('YYYY-MM-DD') : null,
                deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : null,
                deliveryAddress: values.deliveryAddress,
                currency: values.currency,
                notes: values.notes,
                items: (values.items || []).map((item) => ({
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: (item.taxRate ?? 10) / 100,
                })),
            };

            await updatePurchaseOrder(id, payload);
            message.success('Purchase Order updated successfully!', 2);
            navigate('/my-orders');
        } catch (error) {
            console.error('Update PO error:', error);
            message.error(error?.response?.data?.message || 'Failed to update PO.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Loading PO data..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: 24 }}>
                <Alert type="error" message={loadError} showIcon />
                <Button style={{ marginTop: 16 }} onClick={() => navigate('/my-orders')}>
                    <ArrowLeftOutlined /> Back to list
                </Button>
            </div>
        );
    }

    // Guard: can only edit if status is CREATED
    if (poStatus && poStatus !== 'CREATED') {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    type="warning"
                    message={`PO is at status "${poStatus}" — cannot be edited.`}
                    description="Only CREATED (Draft) POs can be edited."
                    showIcon
                />
                <Button style={{ marginTop: 16 }} onClick={() => navigate('/my-orders')}>
                    <ArrowLeftOutlined /> Back to list
                </Button>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my-orders')}>
                    Back
                </Button>
                <Title level={3} style={{ margin: 0 }}>Edit Purchase Order</Title>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                scrollToFirstError
            >
                {/* === SECTION 1: Header Info === */}
                <Card title="Order Information" bordered={false} style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="vendorId"
                                label="Vendor"
                                rules={[{ required: true, message: 'Please select vendors' }]}
                            >
                                <Select showSearch placeholder="Select vendors..." optionFilterProp="label">
                                    {vendors.map((v) => (
                                        <Option key={v.id} value={v.id} label={`${v.vendorCode} — ${v.vendorName}`}>
                                            <Space direction="vertical" size={0}>
                                                <Text strong>{v.vendorCode}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{v.vendorName}</Text>
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                                <Select onChange={(val) => setCurrency(val)}>
                                    {CURRENCIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                name="orderDate"
                                label="Order Date"
                                rules={[{ required: true, message: 'Please select date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        {/* Delivery Date */}
                        <Col xs={24} md={8}>
                            <Form.Item name="deliveryDate" label="Expected Delivery Date">
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Select date" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={16}>
                            <Form.Item name="deliveryAddress" label="Delivery Address">
                                <Input placeholder="Delivery Address..." />
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item name="notes" label="Notes">
                                <TextArea rows={2} placeholder="Additional notes..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* === SECTION 2: Line Items === */}
                <Card title="Material List" bordered={false} style={{ marginBottom: 16 }}>
                    <POItemForm
                        materials={materials}
                        poCurrency={currency}
                        onTotalChange={setGrandTotal}
                    />
                </Card>

                {/* === SECTION 3: Grand Total + Save === */}
                <Card bordered={false}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <Text type="secondary">Grand Total (Grand Total):</Text>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff', marginTop: 4 }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(grandTotal)}
                            </div>
                        </div>

                        <Space>
                            <Button onClick={() => navigate('/my-orders')}>Cancel</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={submitting}
                                size="large"
                            >
                                Save Changes
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </div>
    );
}
