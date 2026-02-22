import axiosClient from './axiosClient';

// POST /auth/login — returns token string from result
export const loginApi = (data) =>
  axiosClient.post('/auth/login', data).then((r) => r.data.result);

// POST /auth/register — returns created user info from result
export const registerApi = (data) =>
  axiosClient.post('/auth/register', data).then((r) => r.data.result);
