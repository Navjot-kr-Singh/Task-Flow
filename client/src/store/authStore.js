import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            set({
                user: res.data.user,
                token: res.data.token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.error || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    register: async (name, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/auth/register', { name, email, password, role });
            localStorage.setItem('token', res.data.token);
            set({
                user: res.data.user,
                token: res.data.token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.error || 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        set({ isLoading: true });
        try {
            if (!localStorage.getItem('token')) {
                set({ isLoading: false });
                return;
            }
            const res = await api.get('/auth/me');
            set({ user: res.data.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },
}));

export default useAuthStore;
