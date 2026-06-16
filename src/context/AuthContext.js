import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../config/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await api.get('/auth/me');
          if (data.success && data.user) {
            setUser(data.user);
            setUserRole(data.user.role || 'user');
          }
        }
      } catch (error) {
        console.log('Auth check failed:', error.message);
        await removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });

      if (data.success) {
        await setToken(data.token);
        setUser(data.user);
        setUserRole(data.user.role || 'user');
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, displayName, role = 'user') => {
    try {
      const data = await api.post('/auth/register', {
        name: displayName,
        email,
        password,
        role,
      });

      if (data.success) {
        await setToken(data.token);
        setUser(data.user);
        setUserRole(data.user.role || 'user');
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Signup failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
      setUserRole('user');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      const data = await api.post(`/courses/${courseId}/enroll`);
      if (data.success) {
        setUser((prev) => ({
          ...prev,
          enrolledCourses: data.enrolledCourses,
        }));
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to enroll' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const unenrollFromCourse = async (courseId) => {
    try {
      const data = await api.delete(`/courses/${courseId}/enroll`);
      if (data.success) {
        setUser((prev) => ({
          ...prev,
          enrolledCourses: data.enrolledCourses,
        }));
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to unenroll' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (name) => {
    try {
      const data = await api.put('/auth/profile', { name });
      if (data.success) {
        setUser((prev) => ({ ...prev, ...data.user }));
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update profile' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isAdmin,
        loading,
        login,
        signup,
        logout,
        enrollInCourse,
        unenrollFromCourse,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
