// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  clearAuthToken,
  getApiError,
  getCurrentUser,
  loginUser,
  registerUser,
  setAuthToken,
  updateCurrentUser
} from '../services/api';

const AuthContext = createContext();
const AUTH_USER_STORAGE_KEY = 'campusvibe_user';
const AUTH_TOKEN_STORAGE_KEY = 'campusvibe_token';

const safeParseUser = () => {
  const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => safeParseUser());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const isLoggedIn = Boolean(token && user);

  useEffect(() => {
    let isMounted = true;

    const bootAuth = async () => {
      if (!token) {
        if (isMounted) {
          clearAuthToken();
          setIsAuthLoading(false);
        }
        return;
      }

      setAuthToken(token);

      try {
        const response = await getCurrentUser();
        const currentUser = response?.data?.data;

        if (!currentUser) {
          throw new Error('Invalid auth response');
        }

        if (!isMounted) {
          return;
        }

        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        if (!isMounted) {
          return;
        }

        clearAuthToken();
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    bootAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async ({ student_id, password }) => {
    try {
      const response = await loginUser({ student_id, password });
      const authToken = response?.data?.data?.token;
      const loggedInUser = response?.data?.data?.user;

      if (!authToken || !loggedInUser) {
        throw new Error('Invalid auth response');
      }

      setAuthToken(authToken);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loggedInUser));

      setToken(authToken);
      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      throw getApiError(error, 'Login failed');
    }
  };

  const register = async ({ name, email, student_id, password }) => {
    try {
      await registerUser({ name, email, student_id, password });
    } catch (error) {
      throw getApiError(error, 'Registration failed');
    }
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (payload) => {
    try {
      const response = await updateCurrentUser(payload);
      const updatedUser = response?.data?.data;

      if (!updatedUser) {
        throw new Error('Invalid profile response');
      }

      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      throw getApiError(error, 'Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAuthLoading, token, user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);