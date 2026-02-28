import React, { useEffect, useRef, useState } from 'react';
import {
    Form, Select, DatePicker, Input, Button,
    Card, Row, Col, Typography, Divider, Space, message, Spin
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createPurchaseOrder } from '../api/purchaseOrderApi';
import { fetchAllVendorsForDropdown, fetchAllActiveMaterialsForDropdown } from '../api/odataApi';
import POItemForm from '../components/po/POItemForm';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CURRENCIES = ['VND', 'USD', 'EUR'];

export default function POCreatePage() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [currency, setCurrency] = useState('VND');
    // Ref used to blur Select after selection — removes cursor completely
    const vendorSelectRef = useRef(null);

    // Load vendors and materials for dropdowns
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [vendors, materials] = await Promise.all([
                    fetchAllVendorsForDropdown(),
                    fetchAllActiveMaterialsForDropdown(),
                ]);
                // OData returns flat array directly (no .content wrapper)
                setVendors(vendors);
                setMaterials(materials);
            } catch (err) {
                console.error('Failed to load dropdowns:', err);
                message.error('Failed to load Vendor / Material list');
            } finally {
                setLoadingData(false);
            }
        };
        loadDropdowns();
    }, []);

    const onFinish = async (values) => {
        try {
            setSubmitting(true);

            // Build request body according to backend API contract
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
                    // Forward per-item note to backend PurchaseOrderItemRequest.notes
                    notes: item.notes || null,
                })),
            };

            await createPurchaseOrder(payload);
            message.success('Purchase order created successfully!', 2);
            navigate('/my-orders');
        } catch (error) {
            console.error('Create PO error:', error);
            message.error(error?.response?.data?.message || 'Failed to create PO. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Loading data..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my-orders')}>
                    Back
                </Button>
                <Title level={3} style={{ margin: 0 }}>Create New Purchase Order</Title>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    currency: 'VND',
                    orderDate: dayjs(),
                    items: [{ taxRate: 10 }], // Start with 1 empty item row
                }}
                scrollToFirstError
            >
                {/* === SECTION 1: Header Info === */}
                <Card title="Order Information" bordered={false} style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 0]}>
                        {/* Vendor */}
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="vendorId"
                                label="Vendor"
                                rules={[{ required: true, message: 'Please select vendors' }]}
                            >
                                <Select
                                    ref={vendorSelectRef}
                                    showSearch
                                    placeholder="Search and select vendors..."
                                    optionFilterProp="label"
                                    optionLabelProp="label"
                                    // Blur after selection to remove cursor completely
                                    onSelect={() => vendorSelectRef.current?.blur()}
                                >
                                    {vendors.map((v) => (
                                        // label prop used for optionFilterProp="label" search
                                        <Option key={v.id} value={v.id} label={`${v.name} (${v.vendorCode})`}>
                                            <Space direction="vertical" size={0}>
                                                {/* v.name matches VendorResponse.name from backend */}
                                                <Text strong>{v.name}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{v.vendorCode}</Text>
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        {/* Currency */}
                        <Col xs={24} md={6}>
                            <Form.Item
                                name="currency"
                                label="Currency"
                                rules={[{ required: true }]}
                            >
                                <Select onChange={(val) => setCurrency(val)}>
                                    {CURRENCIES.map((c) => (
                                        <Option key={c} value={c}>{c}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        {/* Order Date */}
                        <Col xs={24} md={6}>
                            <Form.Item
                                name="orderDate"
                                label="Order Date"
                                rules={[{ required: true, message: 'Please select an order date' }]}
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

                        {/* Delivery Address */}
                        <Col xs={24} md={16}>
                            <Form.Item name="deliveryAddress" label="Delivery Address">
                                <Input placeholder="Street, Ward, District, City..." />
                            </Form.Item>
                        </Col>

                        {/* Notes */}
                        <Col xs={24}>
                            <Form.Item name="notes" label="Notes">
                                <TextArea rows={2} placeholder="Additional notes (optional)..." />
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

                {/* === SECTION 3: Grand Total Preview + Submit === */}
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
                                Create orders
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Form>
        </div>
    );
}
