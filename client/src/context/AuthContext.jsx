import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('erp_token');
        const savedUser = localStorage.getItem('erp_user');
        if (token && savedUser) {
            // Validate token is not expired by calling /auth/me
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => {
                    // Token invalid/expired — clear everything
                    localStorage.removeItem('erp_token');
                    localStorage.removeItem('erp_refresh_token');
                    localStorage.removeItem('erp_user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
            return; // Don't call setLoading(false) below
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('erp_token', accessToken);
        localStorage.setItem('erp_refresh_token', refreshToken);
        localStorage.setItem('erp_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh_token');
        localStorage.removeItem('erp_user');
        setUser(null);
    };

    const hasRole = (...roles) => user && roles.includes(user.role);

    const value = { user, login, logout, loading, isAuthenticated: !!user, hasRole };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
