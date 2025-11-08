import { API_BASE_URL as BASE_URL } from '../config/api';
const API_URL = `${BASE_URL}/market`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const listPrices = async (category) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const response = await fetch(`${API_URL}/prices?${params.toString()}`);
  return handleResponse(response);
};

export const getLatestPrice = async (product) => {
  const params = new URLSearchParams({ product });
  const response = await fetch(`${API_URL}/latest?${params.toString()}`);
  return handleResponse(response);
};

export const uploadPrice = async ({ productName, category, unit = 'kg', price, source }) => {
  const response = await fetch(`${API_URL}/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ productName, category, unit, price, source })
  });
  return handleResponse(response);
};

// Fetch Indian market prices via backend
export const getIndianPrices = async ({ commodity, state, market, limit } = {}) => {
  const params = new URLSearchParams();
  if (commodity) params.set('commodity', commodity);
  if (state) params.set('state', state);
  if (market) params.set('market', market);
  if (limit) params.set('limit', String(limit));
  const response = await fetch(`${API_URL}/india/prices?${params.toString()}`);
  return handleResponse(response);
};