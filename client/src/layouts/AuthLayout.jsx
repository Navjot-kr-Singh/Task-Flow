import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Layout } from 'lucide-react';

const AuthLayout = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return <div>Loading...</div>;
    if (isAuthenticated) return <Navigate to="/" />;

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl relative">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;
