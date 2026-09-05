import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [customerUser, setCustomerUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const customerToken = localStorage.getItem('electrostore_customer_token');
    const adminToken = localStorage.getItem('electrostore_admin_token');

    const promises = [];

    if (customerToken) {
      promises.push(
        authAPI.getMe('customer')
          .then(res => setCustomerUser(res.data))
          .catch((err) => {
            // Only clear token if server returned 401 Unauthorized or 403 Forbidden
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              localStorage.removeItem('electrostore_customer_token');
            }
            setCustomerUser(null);
          })
      );
    } else {
      setCustomerUser(null);
    }

    if (adminToken) {
      promises.push(
        authAPI.getMe('admin')
          .then(res => setAdminUser(res.data))
          .catch((err) => {
            // Only clear token if server returned 401 Unauthorized or 403 Forbidden
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              localStorage.removeItem('electrostore_admin_token');
            }
            setAdminUser(null);
          })
      );
    } else {
      setAdminUser(null);
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch (e) {
        console.error("Error fetching sessions:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleStorageChange = (e) => {
      if (e.key === 'electrostore_customer_token' || e.key === 'electrostore_admin_token') {
        fetchCurrentUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (token, userData) => {
    if (userData.role === 'admin') {
      localStorage.setItem('electrostore_admin_token', token);
      setAdminUser(userData);
    } else {
      localStorage.setItem('electrostore_customer_token', token);
      setCustomerUser(userData);
    }
  };

  const logout = () => {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    
    localStorage.removeItem('electrostore_customer_token');
    localStorage.removeItem('electrostore_admin_token');
    setCustomerUser(null);
    setAdminUser(null);

    if (isAdminPath) {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  // Determine active user based on current route
  const isAdminPath = window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login';
  const user = isAdminPath ? adminUser : (customerUser || adminUser);

  return (
    <AuthContext.Provider value={{
      user,
      customerUser,
      adminUser,
      loading,
      login,
      logout,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
