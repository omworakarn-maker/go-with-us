import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { TRIP_CATEGORIES } from '../constants/categories';

interface InterestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (interests: string[]) => void;
}

export const InterestModal: React.FC<InterestModalProps> = ({ isOpen, onClose, onSave }) => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedInterests.length === 0) return;

        try {
            setLoading(true);
            await userAPI.updateProfile({ interests: selectedInterests });
            onSave(selectedInterests);
            onClose();
        } catch (error) {
            console.error('Failed to save interests:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        ✨
                    </div>
                    <h2 className="text-2xl font-black mb-2">สิ่งที่คุณสนใจ?</h2>
                    <p className="text-gray-500">เลือกหมวดหมู่ที่คุณชอบ เพื่อให้เราแนะนำทริปที่ใช่สำหรับคุณ</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    {TRIP_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => toggleInterest(cat.id)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedInterests.includes(cat.id)
                                ? 'border-black bg-black text-white scale-105 shadow-lg'
                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                                }`}
                        >
                            <span className="text-2xl">{cat.emoji}</span>
                            <span className="text-xs font-bold">{cat.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-400 font-bold text-sm hover:text-gray-600"
                    >
                        ข้ามไปก่อน
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedInterests.length === 0 || loading}
                        className="flex-[2] py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'กำลังบันทึก...' : 'เริ่มกันเลย! 🚀'}
                    </button>
                </div>
            </div>
        </div>
    );
};
