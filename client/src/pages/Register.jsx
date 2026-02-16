import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const { register, isLoading, error } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password, role);
        } catch (err) {
            // Error handled in store
        }
    };

    return (
        <div className="flex rounded-3xl overflow-hidden shadow-2xl bg-white min-h-[500px]">
            {/* Left Side - Info/Sign In Prompt */}
            <div className="hidden md:flex w-1/2 bg-black p-8 flex-col justify-center items-center text-white text-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-10 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-5 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
                    <p className="text-gray-300 mb-6 text-base max-w-xs">
                        Login to continue your journey of connections
                    </p>

                    <Link
                        to="/login"
                        className="px-8 py-2.5 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-colors text-sm"
                    >
                        Sign In
                    </Link>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center bg-white relative">
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-black mb-2">Create Account</h2>
                        <p className="text-gray-500 text-sm">Join TaskFlow today</p>
                    </div>

                    <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative text-sm" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            className="w-full px-5 py-3 rounded-full bg-gray-100 border-none text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-black"
                        />

                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full px-5 py-3 rounded-full bg-gray-100 border-none text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-black"
                        />

                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-5 py-3 rounded-full bg-gray-100 border-none text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-black"
                        />

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1 ml-4">
                                Role
                            </label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-5 py-3 rounded-full bg-gray-100 border-none text-gray-900 text-sm focus:ring-2 focus:ring-black appearance-none"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-6 rounded-full bg-black text-white font-bold text-base hover:bg-gray-800 transition-opacity shadow-lg transform hover:-translate-y-0.5 mt-2"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
