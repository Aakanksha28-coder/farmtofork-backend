// Base API URL - replace with your actual backend URL
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    throw new Error(error);
  }
  
  return data;
};

// Get auth token from local storage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Login user with real API
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse(response);

    // Normalize possible response shapes: { token, user } or top-level fields
    const token = data?.token || data?.data?.token;
    const userRaw = data?.user || data?.data?.user || data;

    const userData = {
      _id: userRaw?._id,
      name: userRaw?.name || userRaw?.username || userRaw?.fullName || '',
      email: userRaw?.email,
      role: userRaw?.role
    };

    // Save token and user to localStorage
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    // Return in a consistent shape expected by AuthContext
    return { user: userData, token };
  } catch (error) {
    throw error;
  }
};

// Register user with real API
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await handleResponse(response);

    // Normalize possible response shapes
    const token = data?.token || data?.data?.token;
    const userRaw = data?.user || data?.data?.user || data;

    const createdUser = {
      _id: userRaw?._id,
      name: userRaw?.name || userRaw?.username || userRaw?.fullName || '',
      email: userRaw?.email,
      role: userRaw?.role
    };

    // Save token and user to localStorage
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(createdUser));
    }

    // Return in a consistent shape expected by AuthContext
    return { user: createdUser, token };
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return { success: true };
};

// Get current user from API
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      headers: {
        ...getAuthHeader()
      }
    });
    
    const resData = await handleResponse(response);
    // Support both { user } and direct user object responses
    const user = resData?.user || resData;
    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};