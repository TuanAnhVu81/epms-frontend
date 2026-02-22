import axiosClient from './axiosClient';

const BASE = '/api/analytics';

// GET /api/analytics/dashboard — single call for entire dashboard (Manager/Admin)
export const getDashboard = () =>
  axiosClient.get(`${BASE}/dashboard`).then((r) => r.data.result);

// GET /api/analytics/po-status-summary — PO count by status
export const getPOStatusSummary = () =>
  axiosClient.get(`${BASE}/po-status-summary`).then((r) => r.data.result);

// GET /api/analytics/top-vendors?limit=5 — top vendors by purchase value
export const getTopVendors = (limit = 5) =>
  axiosClient.get(`${BASE}/top-vendors`, { params: { limit } }).then((r) => r.data.result);

// GET /api/analytics/recent-trend?months=6 — trend for last N months
export const getRecentTrend = (months = 6) =>
  axiosClient.get(`${BASE}/recent-trend`, { params: { months } }).then((r) => r.data.result);
