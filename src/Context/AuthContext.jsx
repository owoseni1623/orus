import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: 'https://orus-home.onrender.com/api/auth',
    headers: {
      'Content-Type': 'application/json',
    },
    // Enable sending cookies across domains if needed
    withCredentials: true
  });

  // Add response interceptor for handling token-related errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear invalid token and user data
        logout();
      }
      return Promise.reject(error);
    }
  );

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await fetchUserProfile();
          setIsTokenValid(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Process error messages
  const processErrorMessage = (error) => {
    console.error('API Error:', error); // Enhanced error logging
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.status === 401) {
      return 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 0 && error.message.includes('Network Error')) {
      return 'Network error. This might be due to CORS policy restrictions.';
    } else if (error.response) {
      return `Server error: ${error.response.status}`;
    } else if (error.request) {
      return 'No response from server. Please check your connection.';
    }
    return 'An unexpected error occurred.';
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data.user);
      setError(null);
      return response.data.user;
    } catch (error) {
      const errorMessage = processErrorMessage(error);
      setError(errorMessage);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Log the request being made
      console.log('Attempting login request to:', api.defaults.baseURL + '/login');
      
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;

      // Validate token format before storing
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received');
      }

      // Store token and update headers
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setIsTokenValid(true);

      return {
        success: true,
        role: user.userType
      };
    } catch (error) {
      const errorMessage = processErrorMessage(error);
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/register', userData);
      const { token, user } = response.data;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received');
      }

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setIsTokenValid(true);

      return {
        success: true,
        role: user.userType
      };
    } catch (error) {
      const errorMessage = processErrorMessage(error);
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
    setIsTokenValid(false);
  };

  // Context value
  const authContextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: isTokenValid && !!user,
    setError,
    refreshUser: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};