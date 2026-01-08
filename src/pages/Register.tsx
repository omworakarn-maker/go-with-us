import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (formData.password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            // Navigate to home on success
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-in fade-in duration-500">
                    <Link to="/" className="inline-flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="text-3xl font-black tracking-tighter">GoWithUs.</span>
                    </Link>
                    <p className="text-gray-500 text-sm font-medium">เริ่มต้นการผจญภัยของคุณ</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">สมัครสมาชิก</h2>
                    <p className="text-gray-500 text-sm mb-8">สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-gray-400 tracking-widest">
                                ชื่อ-นามสกุล
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-gray-400 tracking-widest">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
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
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="block text-xs uppercase font-bold text-gray-400 tracking-widest">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <label className="text-xs text-gray-600">
                                ฉันยอมรับ{' '}
                                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                                    เงื่อนไขการใช้งาน
                                </a>{' '}
                                และ{' '}
                                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                                    นโยบายความเป็นส่วนตัว
                                </a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    กำลังสมัครสมาชิก...
                                </span>
                            ) : (
                                'สมัครสมาชิก'
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

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-gray-600 text-sm">
                            มีบัญชีอยู่แล้ว?{' '}
                            <Link to="/login" className="font-bold text-purple-600 hover:text-purple-700 transition-colors">
                                เข้าสู่ระบบ
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

export default Register;
