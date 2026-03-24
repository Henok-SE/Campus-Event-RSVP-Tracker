// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('campusvibe_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setIsLoggedIn(true);
      setUser(parsed);
    }
  }, []);

 const login = (email, role = "Student", userData = {}) => {
  const fullUser = {
    email,
    name: userData.name || "Henok",
    student_id: userData.student_id || "U123456",
    role,
    ...userData
  };
  localStorage.setItem('campusvibe_user', JSON.stringify(fullUser));
  setIsLoggedIn(true);
  setUser(fullUser);
};

  const logout = () => {
    localStorage.removeItem('campusvibe_user');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);