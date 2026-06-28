import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Production Render URL
const getBaseUrl = () => {
  return 'https://study-app-backend-em3o.onrender.com/api';
};

export const API_BASE_URL = getBaseUrl();

// Token management
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (e) {
    console.log('Error saving token:', e);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (e) {
    console.log('Error removing token:', e);
  }
};

// Generic API request helper with JWT
export const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const textData = await response.text();
    
    let data = {};
    if (textData && textData.trim().length > 0) {
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.log(`[API Error ${endpoint}]: Non-JSON response`, textData.substring(0, 150));
        throw new Error(`Server returned invalid data (Status ${response.status}). Are you sure the backend is fully deployed?`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Convenience methods
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

  post: (endpoint, body = {}) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),

  upload: (endpoint, formData) => apiRequest(endpoint, {
    method: 'POST',
    body: formData,
  }),
};
