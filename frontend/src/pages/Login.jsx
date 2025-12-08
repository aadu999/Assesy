import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(username, password);

        if (result.success) {
            if (username === 'admin') navigate('/admin/dashboard'); // Or check role
            else navigate('/dashboard'); // Generic dashboard
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                        placeholder="Enter your password"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Login;
