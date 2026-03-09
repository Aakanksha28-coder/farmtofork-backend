import { API_BASE_URL as BASE_URL } from '../config/api';
const API_URL = `${BASE_URL}/negotiations`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const startNegotiation = async (productId) => {
  const response = await fetch(`${API_URL}/${productId}/start`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(response);
};

export const postMessage = async (id, { text, price }) => {
  const response = await fetch(`${API_URL}/${id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ text, price })
  });
  return handleResponse(response);
};

export const acceptNegotiation = async (id, finalPrice) => {
  const response = await fetch(`${API_URL}/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ finalPrice })
  });
  return handleResponse(response);
};

export const getNegotiationsForProduct = async (productId) => {
  const response = await fetch(`${API_URL}/product/${productId}`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(response);
};