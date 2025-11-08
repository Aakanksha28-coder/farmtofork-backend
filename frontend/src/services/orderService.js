import { API_BASE_URL as BASE_URL } from '../config/api';
const API_URL = `${BASE_URL}/orders`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const createOrder = async (payload) => {
  const response = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getMyOrders = async () => {
  const response = await fetch(`${API_URL}/mine`, { headers: { ...getAuthHeader() } });
  return handleResponse(response);
};

export const getFarmerOrders = async () => {
  const response = await fetch(`${API_URL}/farmer`, { headers: { ...getAuthHeader() } });
  return handleResponse(response);
};

export const getOrderById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, { headers: { ...getAuthHeader() } });
  return handleResponse(response);
};

export const updateOrderStatus = async (id, status, note) => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status, note })
  });
  return handleResponse(response);
};