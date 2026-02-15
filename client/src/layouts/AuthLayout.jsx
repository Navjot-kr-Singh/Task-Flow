import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Layout } from 'lucide-react';

const AuthLayout = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return <div>Loading...</div>;
    if (isAuthenticated) return <Navigate to="/" />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Layout className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Task Collaboration Platform
                </h2>
            </div>

            <Outlet />
        </div>
    );
};

export default AuthLayout;
