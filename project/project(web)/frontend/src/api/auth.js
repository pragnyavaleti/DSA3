import api, { setAuthToken, getAuthToken } from './client.js';

export async function loginApi(email, password) {
  const data = await api.post('/api/auth/login', { email, password });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data.user;
}

export async function registerApi(name, email, password) {
  const data = await api.post('/api/auth/register', { name, email, password });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data.user;
}

export async function getCurrentUserApi() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const data = await api.get('/api/auth/me');
    return data?.user || null;
  } catch (err) {
    setAuthToken(null);
    return null;
  }
}

export async function logoutApi() {
  setAuthToken(null);
  return true;
}
