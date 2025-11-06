const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/contact`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const submitContactMessage = async (formData) => {
  const response = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(formData)
  });
  return handleResponse(response);
};

export const getContactMessages = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  if (filters.q) params.set('q', filters.q);
  
  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(response);
};

export const getContactMessageById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(response);
};

export const updateMessageStatus = async (id, status) => {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status })
  });
  return handleResponse(response);
};