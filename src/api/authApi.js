import axiosClient from './axiosClient';

// POST /auth/login — returns token string from result
export const loginApi = (data) =>
  axiosClient.post('/auth/login', data).then((r) => r.data.result);
