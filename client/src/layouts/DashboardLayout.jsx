import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
    const { isAuthenticated, isLoading, loadUser } = useAuthStore();

    // Try to load user if token exists but no user loaded yet
    useEffect(() => {
        if (!isAuthenticated && localStorage.getItem('token')) {
            loadUser();
        }
    }, [loadUser, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated && !localStorage.getItem('token')) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
