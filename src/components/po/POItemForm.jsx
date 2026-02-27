import React, { useRef } from 'react';
import {
    Form, Button, Select, InputNumber, Input, Space, Divider,
    Typography, Card, Row, Col
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

// Format currency dynamically based on PO's currency
const formatAmount = (val, currency = 'VND') =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(val || 0);

/**
 * POItemForm — dynamic Form.List for PO line items.
 * Props:
 *   - materials: array of { id, materialCode, description/materialDescription, unit/unitOfMeasure, basePrice, currency }
 *   - poCurrency: string (VND | USD | EUR) — the currency of the current PO
 *   - onTotalChange(grandTotal): callback to parent to show grand total preview
 */
export default function POItemForm({ materials = [], poCurrency = 'VND', onTotalChange }) {
    const form = Form.useFormInstance();
    // Store refs per row to blur Select after selection — removes cursor completely
    const materialRefs = useRef({});

    // Calculate line total whenever a field in an item changes
    const recalculate = (changedIndex) => {
        const items = form.getFieldValue('items') || [];
        let grandTotal = 0;

        const updated = items.map((item, index) => {
            const qty = Number(item?.quantity) || 0;
            const price = Number(item?.unitPrice) || 0;
            const taxRate = Number(item?.taxRate) || 0;

            const netAmount = qty * price;
            const taxAmount = netAmount * (taxRate / 100);
            const lineTotal = netAmount + taxAmount;

            grandTotal += lineTotal;

            return index === changedIndex
                ? { ...item, netAmount, taxAmount, lineTotal }
                : { ...item, netAmount: qty * price, taxAmount: qty * price * (taxRate / 100), lineTotal: qty * price + qty * price * (taxRate / 100) };
        });

        form.setFieldValue('items', updated);
        if (onTotalChange) onTotalChange(grandTotal);
    };

    const handleMaterialSelect = (materialId, index) => {
        // Auto-fill unit AND suggest basePrice from material catalog
        const material = materials.find((m) => m.id === materialId);
        if (material) {
            const items = form.getFieldValue('items') || [];
            items[index] = {
                ...items[index],
                unit: material.unit || material.unitOfMeasure,
                // Auto-suggest catalog price; user can override
                unitPrice: material.basePrice ?? items[index]?.unitPrice,
                // Store catalog currency for mismatch warning display
                _catalogCurrency: material.currency || 'VND',
                _catalogPrice: material.basePrice,
            };
            form.setFieldValue('items', items);
            // Trigger recalculation since price was just changed
            recalculate(index);
        }
    };

    return (
        <Form.List
            name="items"
            rules={[
                // Validation: at least 1 item required
                {
                    validator: async (_, items) => {
                        if (!items || items.length < 1) {
                            return Promise.reject(new Error('Đơn hàng phải có ít nhất 1 mục vật tư'));
                        }
                    },
                },
            ]}
        >
            {(fields, { add, remove }, { errors }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        // Read computed values from form state for live preview
                        const items = form.getFieldValue('items') || [];
                        const item = items[name] || {};
                        const netAmt = item.netAmount || 0;
                        const taxAmt = item.taxAmount || 0;
                        const lineTotal = item.lineTotal || 0;

                        return (
                            <Card
                                key={key}
                                size="small"
                                style={{ marginBottom: 12, background: '#fafafa', border: '1px solid #f0f0f0' }}
                                title={<Text strong>Mục #{index + 1}</Text>}
                                extra={
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            remove(name);
                                            // Recalculate grand total after removal
                                            setTimeout(() => recalculate(-1), 0);
                                        }}
                                    >
                                        Xóa
                                    </Button>
                                }
                            >
                                <Row gutter={[12, 0]}>
                                    {/* Column 1: Material Select */}
                                    <Col xs={24} md={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'materialId']}
                                            label="Vật tư"
                                            rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
                                        >
                                            <Select
                                                ref={(el) => { materialRefs.current[name] = el; }}
                                                showSearch
                                                placeholder="Tìm và chọn vật tư..."
                                                optionFilterProp="label"
                                                optionLabelProp="label"
                                                onChange={(val) => handleMaterialSelect(val, name)}
                                                style={{ width: '100%' }}
                                                // Blur after selection to remove cursor completely
                                                onSelect={() => materialRefs.current[name]?.blur()}
                                            >
                                                {materials.map((m) => (
                                                    <Option
                                                        key={m.id}
                                                        value={m.id}
                                                        // label used for optionFilterProp="label" search
                                                        label={`${m.description || m.materialDescription} (${m.materialCode})`}
                                                    >
                                                        <div>
                                                            {/* description (name) in bold — consistent with Vendor dropdown */}
                                                            <Text strong>{m.description || m.materialDescription}</Text>
                                                            <br />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {m.materialCode} — ĐVT: {m.unit || m.unitOfMeasure}
                                                            </Text>
                                                        </div>
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    {/* Column 2: Quantity */}
                                    <Col xs={8} md={4}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'quantity']}
                                            label="Số lượng"
                                            rules={[
                                                { required: true, message: 'Bắt buộc' },
                                                { type: 'number', min: 0.01, message: 'Phải > 0' },
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0.01}
                                                precision={2}
                                                placeholder="0"
                                                onChange={() => recalculate(name)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {/* Column 3: Unit Price */}
                                    <Col xs={8} md={5}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'unitPrice']}
                                            label={
                                                // Show catalog reference price hint if available
                                                (() => {
                                                    const catalogPrice = item._catalogPrice;
                                                    const catalogCurrency = item._catalogCurrency;
                                                    const hasMismatch = catalogCurrency && catalogCurrency !== poCurrency;
                                                    if (catalogPrice != null) {
                                                        return (
                                                            <span>
                                                                Đơn giá&nbsp;
                                                                <Text type={hasMismatch ? 'warning' : 'secondary'} style={{ fontSize: 11 }}>
                                                                    (gốc: {formatAmount(catalogPrice, catalogCurrency || poCurrency)})
                                                                    {hasMismatch && ` ⚠️ khác tiền PO (${poCurrency})`}
                                                                </Text>
                                                            </span>
                                                        );
                                                    }
                                                    return 'Đơn giá';
                                                })()
                                            }
                                            rules={[
                                                { required: true, message: 'Bắt buộc' },
                                                { type: 'number', min: 0, message: 'Phải >= 0' },
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                precision={2}
                                                placeholder="0"
                                                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={(val) => val.replace(/,/g, '')}
                                                onChange={() => recalculate(name)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {/* Column 4: Tax Rate */}
                                    <Col xs={8} md={5}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'taxRate']}
                                            label="Thuế (%)"
                                            initialValue={10}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                min={0}
                                                max={100}
                                                precision={1}
                                                suffix="%"
                                                placeholder="10"
                                                onChange={() => recalculate(name)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Row 2: Notes per line item */}
                                <Row gutter={[12, 0]}>
                                    <Col xs={24}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'notes']}
                                            label="Ghi chú dòng hàng"
                                        >
                                            <Input
                                                placeholder="VD: Yêu cầu đặc biệt, mã màu, phiên bản... (tùy chọn)"
                                                maxLength={500}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Live calculation preview per line */}
                                <div style={{ background: '#f0f5ff', borderRadius: 6, padding: '6px 12px' }}>
                                    <Space size="large">
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Tiền hàng: <strong>{formatAmount(netAmt, poCurrency)}</strong>
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Thuế: <strong>{formatAmount(taxAmt, poCurrency)}</strong>
                                        </Text>
                                        <Text style={{ fontSize: 13, color: '#1677ff' }}>
                                            Thành tiền: <strong>{formatAmount(lineTotal, poCurrency)}</strong>
                                        </Text>
                                    </Space>
                                </div>
                            </Card>
                        );
                    })}

                    {/* Add new item button */}
                    <Form.Item>
                        <Button
                            type="dashed"
                            onClick={() => add({ taxRate: 10 })}
                            block
                            icon={<PlusOutlined />}
                        >
                            Thêm vật tư
                        </Button>
                        <Form.ErrorList errors={errors} />
                    </Form.Item>
                </>
            )}
        </Form.List>
    );
}
