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
