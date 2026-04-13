// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearAuthToken,
  getApiError,
  getCurrentUser,
  loginUser,
  registerUnauthorizedHandler,
  registerUser,
  setAuthToken,
  updateCurrentUser
} from '../services/api';

const AuthContext = createContext();
const AUTH_USER_STORAGE_KEY = 'campusvibe_user';
const AUTH_TOKEN_STORAGE_KEY = 'campusvibe_token';
const AUTH_NOTICE_STORAGE_KEY = 'campusvibe_auth_notice';

const withInterestDefaults = (candidate) => {
  if (!candidate || typeof candidate !== 'object') {
    return candidate;
  }

  return {
    ...candidate,
    interest_categories: Array.isArray(candidate.interest_categories) ? candidate.interest_categories : [],
    interest_keywords: Array.isArray(candidate.interest_keywords) ? candidate.interest_keywords : []
  };
};

const safeParseUser = () => {
  const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return withInterestDefaults(JSON.parse(saved));
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

const safeParseAuthNotice = () => {
  const savedNotice = localStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
  if (!savedNotice) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedNotice);
    if (!parsed || typeof parsed.message !== 'string') {
      localStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
      return null;
    }

    return {
      code: parsed.code || 'AUTH_NOTICE',
      message: parsed.message
    };
  } catch {
    localStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => safeParseUser());
  const [authNotice, setAuthNotice] = useState(() => safeParseAuthNotice());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const isLoggedIn = Boolean(token && user);

  const resetAuthState = useCallback((notice = null) => {
    clearAuthToken();
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    if (notice && typeof notice.message === 'string' && notice.message.trim()) {
      const normalizedNotice = {
        code: notice.code || 'AUTH_NOTICE',
        message: notice.message.trim()
      };

      localStorage.setItem(AUTH_NOTICE_STORAGE_KEY, JSON.stringify(normalizedNotice));
      setAuthNotice(normalizedNotice);
    } else {
      localStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
      setAuthNotice(null);
    }

    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    resetAuthState();
  }, [resetAuthState]);

  useEffect(() => {
    const unsubscribe = registerUnauthorizedHandler((error) => {
      const status = error?.response?.status;
      const reason = status === 401 ? 'Your session expired. Please sign in again.' : 'You have been signed out. Please sign in again.';

      resetAuthState({
        code: 'SESSION_EXPIRED',
        message: reason
      });
    });

    return () => {
      unsubscribe();
    };
  }, [resetAuthState]);

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

        const normalizedUser = withInterestDefaults(currentUser);
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } catch {
        if (!isMounted) {
          return;
        }

        resetAuthState();
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
  }, [token, resetAuthState]);

  const login = async ({ student_id, password }) => {
    try {
      const response = await loginUser({ student_id, password });
      const authToken = response?.data?.data?.token;
      const loggedInUser = withInterestDefaults(response?.data?.data?.user);

      if (!authToken || !loggedInUser) {
        throw new Error('Invalid auth response');
      }

      setAuthToken(authToken);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      localStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);

      setToken(authToken);
      setUser(loggedInUser);
      setAuthNotice(null);

      return loggedInUser;
    } catch (error) {
      throw getApiError(error, 'Login failed');
    }
  };

  const register = async ({
    student_id,
    password,
    name,
    email,
    interest_categories,
    interest_keywords
  }) => {
    try {
      await registerUser({
        student_id,
        password,
        name,
        email,
        interest_categories,
        interest_keywords
      });
    } catch (error) {
      throw getApiError(error, 'Registration failed');
    }
  };

  const updateProfile = async (payload) => {
    try {
      const response = await updateCurrentUser(payload);
      const updatedUser = withInterestDefaults(response?.data?.data);

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

  const clearAuthNotice = useCallback(() => {
    localStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
    setAuthNotice(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAuthLoading,
        token,
        user,
        authNotice,
        clearAuthNotice,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);