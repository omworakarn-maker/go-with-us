import React, { useState, useEffect } from 'react';
import { TripCard } from '../components/TripCard';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { Trip } from '../types';
import { TRIP_CATEGORIES } from '../constants/categories';
import Loader from '../components/Loader';

interface ExtendedUser {
    id: string;
    email: string;
    name: string;
    role: string;
    interests: string[];
    createdAt: string;
    createdTrips: Trip[];
    participatedTrips: { trip: Trip }[];
}

const Profile: React.FC = () => {
    const { logout, refreshUser } = useAuth();
    const [profile, setProfile] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form States
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newInterests, setNewInterests] = useState<string[]>([]);

    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState<'my-trips' | 'joined-trips'>('my-trips');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await userAPI.getProfile();
            setProfile(data);
            setNewName(data.name);
            setNewInterests(data.interests || []);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            setSaving(true);
            const updateData: any = {
                name: newName,
                interests: newInterests
            };
            if (newPassword) updateData.password = newPassword;

            await userAPI.updateProfile(updateData);
            await fetchProfile(); // Refresh local profile data
            await refreshUser(); // Refresh global auth context

            setSuccess('บันทึกข้อมูลสำเร็จ');
            setNewPassword('');
            setConfirmPassword('');
            setIsEditing(false);

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError('ไม่สามารถอัปเดตข้อมูลได้');
        } finally {
            setSaving(false);
        }
    };

    const toggleInterest = (categoryLabel: string) => {
        setNewInterests(prev => {
            if (prev.includes(categoryLabel)) {
                return prev.filter(i => i !== categoryLabel);
            } else {
                return [...prev, categoryLabel];
            }
        });
    };

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                    <Loader variant="dots" />
                </div>
            </>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-white pb-20">

            <div className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Profile Card - Centered */}
                <div className="max-w-xl mx-auto mb-16">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                        {/* Decorative bg */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gray-50 rounded-t-[2rem]"></div>

                        {/* Avatar */}
                        <div className="w-32 h-32 bg-black rounded-full border-4 border-white shadow-lg overflow-hidden relative z-10 mb-4 flex items-center justify-center text-5xl font-bold text-white">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>

                        {!isEditing ? (
                            <div className="w-full z-10">
                                <h1 className="text-3xl font-black text-gray-900 mb-1">{profile.name}</h1>
                                <p className="text-gray-500 font-medium mb-4">{profile.email}</p>

                                <div className="flex flex-col items-center gap-2 mb-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${profile.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {profile.role}
                                    </span>
                                    {/* Display Interests - Black Theme */}
                                    {profile.interests && profile.interests.length > 0 && (
                                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                            {profile.interests.map(interest => (
                                                <span key={interest} className="px-3 py-1 bg-black/5 text-black text-[10px] font-bold rounded-full border border-black/10">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto mb-8 border-t border-gray-100 pt-6">
                                    <div>
                                        <p className="text-3xl font-black text-black">{profile.createdTrips.length}</p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">ทริปที่สร้าง</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-black">{profile.participatedTrips.length}</p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">ที่เข้าร่วม</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                                    >
                                        แก้ไขโปรไฟล์
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="px-6 py-2 border border-gray-200 text-red-500 rounded-full font-bold text-sm hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
                                    >
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="w-full max-w-sm z-10 text-left space-y-4">
                                <h2 className="text-xl font-bold text-center mb-6">แก้ไขข้อมูลส่วนตัว</h2>

                                {error && <div className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{error}</div>}

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-1 block">ชื่อที่แสดง</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 block">สิ่งที่สนใจ (เลือกได้หลายข้อ)</label>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                        {TRIP_CATEGORIES.map(cat => {
                                            const isSelected = newInterests.includes(cat.label);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleInterest(cat.label)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 group ${isSelected
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <span className="w-3 h-3 bg-white text-black rounded-full flex items-center justify-center text-[8px] group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                            <span className="group-hover:hidden">✓</span>
                                                            <span className="hidden group-hover:inline">✕</span>
                                                        </span>
                                                    )}
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 pl-1">* ระบบจะนำไปช่วยแนะนำทริปที่คุณน่าจะชอบ</p>
                                </div>

                                <div className="pt-2 border-t border-gray-100 mt-2">
                                    <p className="text-xs text-center text-gray-400 mb-4">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-1 block">รหัสผ่านใหม่</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-1 block">ยืนยันรหัสผ่านใหม่</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-center pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setNewName(profile.name);
                                            setNewInterests(profile.interests || []);
                                        }}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                                    >
                                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {success && (
                            <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-in slide-in-from-top-2">
                                {success}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="flex justify-center">
                        <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200 inline-flex">
                            <button
                                onClick={() => setActiveTab('my-trips')}
                                className={`px-8 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'my-trips' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                            >
                                ทริปของฉัน ({profile.createdTrips.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('joined-trips')}
                                className={`px-8 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === 'joined-trips' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                            >
                                ที่เข้าร่วม ({profile.participatedTrips.length})
                            </button>
                        </div>
                    </div>

                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100 flex flex-col gap-6">
                        {activeTab === 'my-trips' ? (
                            <>
                                {profile.createdTrips.length > 0 ? (
                                    profile.createdTrips.map(trip => (
                                        <TripCard key={trip.id} trip={trip} />
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-400 font-medium">คุณยังไม่ได้สร้างทริป</p>
                                        <a href="/" className="text-sm font-bold text-black mt-2 inline-block hover:underline">ไปสร้างทริปกันเถอะ!</a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {profile.participatedTrips.length > 0 ? (
                                    profile.participatedTrips.map(({ trip }) => (
                                        <TripCard key={trip.id} trip={trip} />
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-400 font-medium">คุณยังไม่ได้เข้าร่วมทริปใดๆ</p>
                                        <a href="/explore" className="text-sm font-bold text-black mt-2 inline-block hover:underline">ค้นหาทริปน่าสนใจ</a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
