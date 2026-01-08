import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            // Redirect to the page they tried to visit or home
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-in fade-in duration-500">
                    <Link to="/" className="inline-flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="text-3xl font-black tracking-tighter">GoWithUs.</span>
                    </Link>
                    <p className="text-gray-500 text-sm font-medium">ไปกับเราสนุกกว่า</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h2>
                    <p className="text-gray-500 text-sm mb-8">ยินดีต้อนรับกลับมา!</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-gray-400 tracking-widest">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-gray-400 tracking-widest">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Forgot Password */}
                        <div className="text-right">
                            <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                ลืมรหัสผ่าน?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    กำลังเข้าสู่ระบบ...
                                </span>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">หรือ</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-600 text-sm">
                            ยังไม่มีบัญชี?{' '}
                            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                สมัครสมาชิก
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                        ← กลับหน้าแรก
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
