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
        <nav className="bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="h-8 w-8 bg-indigo-500 rounded flex items-center justify-center shadow-lg">
                                <Layout className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">TaskFlow</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300 hover:text-white hover:bg-white/10">
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
