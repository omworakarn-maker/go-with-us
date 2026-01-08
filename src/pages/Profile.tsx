import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { TripCard } from '../components/TripCard';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { Trip } from '../types';

// Define Categories Constant (Should match InterestModal or be imported)
const CATEGORIES = [
    { id: 'ธรรมชาติ', emoji: '🌳', label: 'ธรรมชาติ' },
    { id: 'ผจญภัย', emoji: '🧗', label: 'ผจญภัย' },
    { id: 'กีฬา', emoji: '🏃', label: 'กีฬา' },
    { id: 'ปาร์ตี้', emoji: '🎉', label: 'ปาร์ตี้' },
    { id: 'วัฒนธรรม', emoji: '🏯', label: 'วัฒนธรรม' },
    { id: 'ถ่ายรูป', emoji: '📸', label: 'ถ่ายรูป' },
    { id: 'อาหาร', emoji: '🍜', label: 'อาหาร' },
    { id: 'ทะเล', emoji: '🏖️', label: 'ทะเล' },
    { id: 'ภูเขา', emoji: '⛰️', label: 'ภูเขา' },
    { id: 'จิตอาสา', emoji: '🤝', label: 'จิตอาสา' },
];

interface ExtendedUser {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    interests?: string[]; // Add interests field
    createdTrips: Trip[];
    participatedTrips: { trip: Trip }[];
}

const Profile: React.FC = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form States
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [editInterests, setEditInterests] = useState<string[]>([]); // New state for editing interests
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
            setEditInterests(data.interests || []); // Initialize with current interests
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (id: string) => {
        setEditInterests(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
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
                interests: editInterests // Send updated interests
            };
            if (newPassword) updateData.password = newPassword;

            await userAPI.updateProfile(updateData);
            await fetchProfile();
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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Profile Card - Centered */}
                <div className="max-w-xl mx-auto mb-16">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                        {/* Decorative bg */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gray-50 rounded-t-[2rem]"></div>

                        {/* Avatar */}
                        <div className="w-32 h-32 bg-indigo-500 rounded-full border-4 border-white shadow-lg overflow-hidden relative z-10 mb-4 flex items-center justify-center text-5xl font-bold text-white">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>

                        {!isEditing ? (
                            <div className="w-full z-10 animate-in fade-in zoom-in-95 duration-300">
                                <h1 className="text-3xl font-black text-gray-900 mb-1">{profile.name}</h1>
                                <p className="text-gray-500 font-medium mb-4">{profile.email}</p>

                                <div className="flex flex-wrap justify-center gap-2 mb-6 px-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${profile.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {profile.role}
                                    </span>
                                    {/* Display User Interests */}
                                    {profile.interests?.map(interest => (
                                        <span key={interest} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            {CATEGORIES.find(c => c.id === interest)?.emoji} {interest}
                                        </span>
                                    ))}
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
                                        แก้ไขข้อมูล / ความสนใจ
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
                            <form onSubmit={handleUpdateProfile} className="w-full relative z-10 animate-in fade-in zoom-in-95 duration-300 text-left space-y-6">
                                <h2 className="text-xl font-bold text-center mb-6">แก้ไขข้อมูลส่วนตัว</h2>

                                {error && <div className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{error}</div>}

                                <div className="space-y-4">
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

                                    {/* Interests Selection */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 block">สิ่งที่สนใจ</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleInterest(cat.id)}
                                                    className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${editInterests.includes(cat.id)
                                                            ? 'border-black bg-black text-white shadow-md'
                                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="text-lg">{cat.emoji}</span>
                                                    <span>{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-xs text-center text-gray-400 mb-4">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</p>
                                        <div className="space-y-3">
                                            <div>
                                                <input
                                                    type="password"
                                                    placeholder="รหัสผ่านใหม่"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-medium text-sm"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="password"
                                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-medium text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setNewName(profile.name);
                                            setEditInterests(profile.interests || []); // Reset interests
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
                                        {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {success && (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-in slide-in-from-top-2">
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
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl">🚀</span>
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
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl">🎒</span>
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
