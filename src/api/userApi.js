import axiosClient from './axiosClient';

// ─── Admin: User Management ────────────────────────────────────────────────

// GET /api/admin/users?page=&size=&keyword=&role=&active=
export const getUsers = (params) =>
  axiosClient.get('/api/admin/users', { params }).then((r) => r.data.result);

// GET /api/admin/users/{id}
export const getUserById = (id) =>
  axiosClient.get(`/api/admin/users/${id}`).then((r) => r.data.result);

// POST /api/admin/users — create account with default password
export const createUser = (data) =>
  axiosClient.post('/api/admin/users', data).then((r) => r.data.result);

// PUT /api/admin/users/{id} — update employee info
export const updateUser = (id, data) =>
  axiosClient.put(`/api/admin/users/${id}`, data).then((r) => r.data.result);

// PUT /api/admin/users/{id}/role — change role
export const updateUserRole = (id, data) =>
  axiosClient.put(`/api/admin/users/${id}/role`, data).then((r) => r.data.result);

// PUT /api/admin/users/{id}/status — toggle active/inactive
export const updateUserStatus = (id, data) =>
  axiosClient.put(`/api/admin/users/${id}/status`, data).then((r) => r.data.result);

// POST /api/admin/users/{id}/reset-password
export const resetUserPassword = (id) =>
  axiosClient.post(`/api/admin/users/${id}/reset-password`).then((r) => r.data.result);

// ─── Profile: Current User ─────────────────────────────────────────────────

// GET /api/profile
export const getMyProfile = () =>
  axiosClient.get('/api/profile').then((r) => r.data.result);

// PUT /api/profile — update personal info
export const updateMyProfile = (data) =>
  axiosClient.put('/api/profile', data).then((r) => r.data.result);

// PUT /api/profile/password — change password
export const changePassword = (data) =>
  axiosClient.put('/api/profile/password', data).then((r) => r.data.result);
