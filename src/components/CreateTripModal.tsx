import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TRIP_CATEGORIES } from '../constants/categories';
import { useModal } from '../contexts/ModalContext';
import { useNavigate } from 'react-router-dom';

const PROVINCES = [
    'ทุกจังหวัด', 'กรุงเทพฯ', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

export const CreateTripModal: React.FC = () => {
    const { user } = useAuth();
    const { isCreateModalOpen, closeCreateModal } = useModal();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Basic Info, 2: Time & Budget, 3: Details & Image
    const [creating, setCreating] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [newTrip, setNewTrip] = useState({
        title: '',
        destination: PROVINCES[1],
        description: '',
        startDate: '',
        endDate: '',
        category: TRIP_CATEGORIES[0].label,
        budget: 1000,
        maxParticipants: 10,
        imageUrl: '',
    });

    if (!isCreateModalOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)');
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('ขนาดไฟล์ต้องไม่เกิน 5 MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setNewTrip({ ...newTrip, imageUrl: base64String });
            setImagePreview(base64String);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setNewTrip({ ...newTrip, imageUrl: '' });
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม');
            navigate('/login');
            closeCreateModal();
            return;
        }

        try {
            setCreating(true);
            const createData: any = {
                title: newTrip.title,
                destination: newTrip.destination,
                description: newTrip.description,
                startDate: newTrip.startDate,
                ...(newTrip.endDate && { endDate: newTrip.endDate }),
                budget: newTrip.budget,
                maxParticipants: newTrip.maxParticipants,
                category: newTrip.category,
                imageUrl: newTrip.imageUrl,
            };

            await tripsAPI.create(createData);

            setNewTrip({
                title: '', destination: PROVINCES[1], description: '',
                startDate: '', endDate: '', category: TRIP_CATEGORIES[0].label,
                budget: 1000, maxParticipants: 10, imageUrl: ''
            });
            setImagePreview('');
            setStep(1); // Reset step
            closeCreateModal();
            window.location.reload();

        } catch (err: any) {
            console.error('Failed to create trip:', err);
            alert(err.message || 'ไม่สามารถสร้างกิจกรรมได้');
        } finally {
            setCreating(false);
        }
    };

    const nextStep = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const prevStep = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(prev => prev - 1);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeCreateModal}></div>

            {/* Modal Container */}
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">สร้างกิจกรรมใหม่</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Step {step} of 3</p>
                    </div>
                    <button
                        onClick={closeCreateModal}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-black hover:text-white transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Content (Scrollable) */}
                <div className="overflow-y-auto p-8">
                    <form className="space-y-6">

                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">ชื่อกิจกรรม</label>
                                    <input
                                        autoFocus
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                        placeholder="เช่น ไปเที่ยวภูเขากัน!"
                                        value={newTrip.title}
                                        onChange={e => setNewTrip({ ...newTrip, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">หมวดหมู่</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {TRIP_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setNewTrip({ ...newTrip, category: cat.label })}
                                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${newTrip.category === cat.label ? 'border-black bg-black text-white ring-2 ring-black ring-offset-2' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <span className="text-lg">{cat.emoji}</span>
                                                <span className="text-sm font-bold">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">สถานที่</label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none cursor-pointer"
                                        value={newTrip.destination}
                                        onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })}
                                    >
                                        {PROVINCES.filter(p => p !== 'ทุกจังหวัด').map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Time & Budget */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">เริ่มวันที่</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={newTrip.startDate}
                                            onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">ถึงวันที่</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={newTrip.endDate}
                                            onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                            min={newTrip.startDate}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">งบประมาณต่อคน (บาท)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-bold">฿</span>
                                        </div>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            step="100"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-black outline-none"
                                            placeholder="ใส่ 0 หากเข้าฟรี"
                                            value={newTrip.budget}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setNewTrip({ ...newTrip, budget: isNaN(val) ? 0 : Math.max(0, val) });
                                            }}
                                        />
                                        {newTrip.budget === 0 && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <span className="text-black font-black text-sm bg-gray-100 px-2 py-1 rounded">FREE</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">จำนวนคนรับสมัคร (คน)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="15"
                                            className="flex-1 accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            value={newTrip.maxParticipants}
                                            onChange={e => setNewTrip({ ...newTrip, maxParticipants: parseInt(e.target.value) })}
                                        />
                                        <div className="w-16 h-12 flex items-center justify-center bg-black text-white rounded-xl font-bold text-lg">
                                            {newTrip.maxParticipants}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 text-right">สูงสุด 15 คน</p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Details & Image */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">รูปภาพปก (ถ้ามี)</label>
                                    {imagePreview ? (
                                        <div className="relative group rounded-2xl overflow-hidden">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur text-white rounded-full hover:bg-red-500 transition-colors flex items-center justify-center opacity-100 shadow-md"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-black hover:bg-gray-50 transition-all group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-8 h-8 mb-2 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <p className="text-xs text-gray-400 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">รายละเอียดเพิ่มเติม</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                                        placeholder="เล่ารายละเอียดคร่าวๆ ให้เพื่อนๆ อยากไปด้วยกัน..."
                                        value={newTrip.description}
                                        onChange={e => setNewTrip({ ...newTrip, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                                type="button"
                            >
                                ย้อนกลับ
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                disabled={!newTrip.title} // Example validation
                                className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                            >
                                ถัดไป
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={creating}
                                className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                type="button"
                            >
                                {creating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        กำลังสร้าง...
                                    </>
                                ) : (
                                    'เสร็จสิ้น & สร้างกิจกรรม'
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </motion.div>
        </div>
    );
};
