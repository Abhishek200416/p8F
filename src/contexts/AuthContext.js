import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('plusone_token'));
  const [loading, setLoading] = useState(true);
  const [diamonds, setDiamonds] = useState(0);

  const fetchDiamonds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/user/diamonds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiamonds(res.data.diamonds || 0);
    } catch (err) {
      console.error("Failed to fetch diamonds:", err);
    }
  }, [token]);

  const axiosAuth = useCallback(() => {
    const instance = axios.create({ baseURL: API });
    if (token) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return instance;
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem('plusone_token');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { 
    fetchUser(); 
    if (token) fetchDiamonds();
  }, [fetchUser, fetchDiamonds, token]);

  const login = (newToken, userData) => {
    localStorage.setItem('plusone_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('plusone_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

    return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      diamonds, 
      fetchDiamonds, 
      login, 
      logout, 
      updateUser, 
      axiosAuth, 
      fetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
