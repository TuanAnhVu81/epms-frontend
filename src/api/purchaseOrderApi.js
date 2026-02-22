import axiosClient from './axiosClient';

const BASE = '/api/purchase-orders';

// GET /api/purchase-orders — paginated summary list (backend filters by role automatically)
export const getPurchaseOrders = (params) =>
  axiosClient.get(BASE, { params }).then((r) => r.data);

// GET /api/purchase-orders/:id — full detail with line items
export const getPurchaseOrderById = (id) =>
  axiosClient.get(`${BASE}/${id}`).then((r) => r.data.result);

// POST /api/purchase-orders — create new PO (EMPLOYEE only)
export const createPurchaseOrder = (data) =>
  axiosClient.post(BASE, data).then((r) => r.data.result);

// PUT /api/purchase-orders/:id — update PO (only when status = CREATED)
export const updatePurchaseOrder = (id, data) =>
  axiosClient.put(`${BASE}/${id}`, data).then((r) => r.data.result);

// DELETE /api/purchase-orders/:id — delete PO (only when status = CREATED)
export const deletePurchaseOrder = (id) =>
  axiosClient.delete(`${BASE}/${id}`);

// POST /api/purchase-orders/:id/submit — submit for approval (CREATED → PENDING)
export const submitPurchaseOrder = (id) =>
  axiosClient.post(`${BASE}/${id}/submit`).then((r) => r.data.result);

// POST /api/purchase-orders/:id/approve — approve PO (MANAGER only, PENDING → APPROVED)
export const approvePurchaseOrder = (id) =>
  axiosClient.post(`${BASE}/${id}/approve`).then((r) => r.data.result);

// POST /api/purchase-orders/:id/reject — reject PO with reason (MANAGER only, PENDING → REJECTED)
export const rejectPurchaseOrder = (id, rejectionReason) =>
  axiosClient.post(`${BASE}/${id}/reject`, { rejectionReason }).then((r) => r.data.result);

// GET /api/purchase-orders/search — search by keyword with pagination
export const searchPurchaseOrders = (keyword, params) =>
  axiosClient.get(`${BASE}/search`, { params: { keyword, ...params } }).then((r) => r.data);

// GET /api/purchase-orders/status/:status — filter by status
export const getPurchaseOrdersByStatus = (status, params) =>
  axiosClient.get(`${BASE}/status/${status}`, { params }).then((r) => r.data);
