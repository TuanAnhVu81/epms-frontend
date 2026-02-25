import axiosClient from './axiosClient';

const BASE = '/api/materials';

// GET /api/materials — paginated list (all materials)
export const getMaterials = (params) =>
  axiosClient.get(BASE, { params }).then((r) => r.data);

// GET /api/materials/active — only active materials (used in PO form dropdown)
export const getActiveMaterials = (params) =>
  axiosClient.get(`${BASE}/active`, { params }).then((r) => r.data);

// GET /api/materials/:id — single material detail
export const getMaterialById = (id) =>
  axiosClient.get(`${BASE}/${id}`).then((r) => r.data.result);

// POST /api/materials — create material (ADMIN only)
export const createMaterial = (data) =>
  axiosClient.post(BASE, data).then((r) => r.data.result);

// PUT /api/materials/:id — update material (ADMIN only)
export const updateMaterial = (id, data) =>
  axiosClient.put(`${BASE}/${id}`, data).then((r) => r.data.result);

// DELETE /api/materials/:id — soft delete material (ADMIN only)
export const deleteMaterial = (id) =>
  axiosClient.delete(`${BASE}/${id}`);

// GET /api/materials/:id/stock — get inventory/stock info for a material
// Returns: quantityOnHand, reservedQuantity, availableQuantity, minimumStockLevel, lowStock, warehouseLocation
// On 404 (new material with no stock record yet): caller should handle and default to 0
export const getMaterialStock = (id) =>
  axiosClient.get(`${BASE}/${id}/stock`).then((r) => r.data.result);

// GET /api/materials/stock/low — get all materials with low stock (for ADMIN/MANAGER dashboard)
export const getLowStockMaterials = () =>
  axiosClient.get(`${BASE}/stock/low`).then((r) => r.data.result ?? r.data);

