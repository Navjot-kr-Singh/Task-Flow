import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogOut, Layout, User } from 'lucide-react';
import Button from './ui/Button';

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
                                <Layout className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200" />
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
