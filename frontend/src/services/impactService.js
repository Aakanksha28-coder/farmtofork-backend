import { API_BASE_URL as BASE_URL } from '../config/api';
const API_URL = `${BASE_URL}/impact`;

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  } else {
    const text = await response.text();
    if (!response.ok) throw new Error(text || `Unexpected response (${response.status})`);
    return text;
  }
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getStories = async () => {
  const params = new URLSearchParams();
  params.set('_', String(Date.now()));
  const response = await fetch(`${API_URL}?${params.toString()}`);
  return handleResponse(response);
};

export const createStory = async (storyData) => {
  const isFormData = storyData instanceof FormData;
  const response = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: isFormData ? { ...getAuthHeader() } : { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: isFormData ? storyData : JSON.stringify(storyData)
  });
  return handleResponse(response);
};