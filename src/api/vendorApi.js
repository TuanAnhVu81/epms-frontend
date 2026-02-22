import axiosClient from './axiosClient';

const BASE = '/api/vendors';

// GET /api/vendors — returns Spring Page object (paginated)
export const getVendors = (params) =>
  axiosClient.get(BASE, { params }).then((r) => r.data);

// GET /api/vendors/:id — returns single vendor detail
export const getVendorById = (id) =>
  axiosClient.get(`${BASE}/${id}`).then((r) => r.data.result);

// POST /api/vendors — create new vendor (ADMIN only)
export const createVendor = (data) =>
  axiosClient.post(BASE, data).then((r) => r.data.result);

// PUT /api/vendors/:id — update vendor (ADMIN only)
export const updateVendor = (id, data) =>
  axiosClient.put(`${BASE}/${id}`, data).then((r) => r.data.result);

// DELETE /api/vendors/:id — soft delete vendor (ADMIN only)
export const deleteVendor = (id) =>
  axiosClient.delete(`${BASE}/${id}`);

// PUT /api/vendors/:id/rating — update vendor rating
export const updateVendorRating = (id, data) =>
  axiosClient.put(`${BASE}/${id}/rating`, data).then((r) => r.data.result);

// GET /api/vendors/search?code=VEN-001 — search by vendor code
export const searchVendorByCode = (code) =>
  axiosClient.get(`${BASE}/search`, { params: { code } }).then((r) => r.data.result);
