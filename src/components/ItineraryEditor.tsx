import React, { useState } from 'react';
import { DayPlan, Activity } from '../types';

interface ItineraryEditorProps {
    itinerary: DayPlan[];
    onUpdate: (newItinerary: DayPlan[]) => void;
}

export const ItineraryEditor: React.FC<ItineraryEditorProps> = ({ itinerary, onUpdate }) => {
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [newActivity, setNewActivity] = useState<Activity>({
        time: '',
        name: '',
        location: '',
        description: '',
    });

    // Edit State
    const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; actIndex: number } | null>(null);
    const [editForm, setEditForm] = useState<Activity>({
        time: '',
        name: '',
        location: '',
        description: '',
    });

    const startEditing = (dayIndex: number, actIndex: number, activity: Activity) => {
        setEditingActivity({ dayIndex, actIndex });
        setEditForm({ ...activity });
        setEditingDay(null); // Close add form if open
    };

    const handleSaveEdit = (dayIndex: number, actIndex: number) => {
        if (!editForm.time || !editForm.name || !editForm.location) {
            alert('กรุณากรอกเวลา ชื่อกิจกรรม และสถานที่');
            return;
        }

        const newItinerary = [...itinerary];
        newItinerary[dayIndex].activities[actIndex] = { ...editForm };
        onUpdate(newItinerary);
        setEditingActivity(null);
    };

    const addDay = () => {
        const newDay: DayPlan = {
            day: itinerary.length + 1,
            activities: [],
        };
        onUpdate([...itinerary, newDay]);
    };

    const removeDay = (dayIndex: number) => {
        const newItinerary = itinerary
            .filter((_, i) => i !== dayIndex)
            .map((day, i) => ({ ...day, day: i + 1 }));
        onUpdate(newItinerary);
    };

    const addActivity = (dayIndex: number) => {
        if (!newActivity.time || !newActivity.name || !newActivity.location) {
            alert('กรุณากรอกเวลา ชื่อกิจกรรม และสถานที่');
            return;
        }

        const newItinerary = [...itinerary];
        newItinerary[dayIndex].activities.push({ ...newActivity });
        onUpdate(newItinerary);

        setNewActivity({ time: '', name: '', location: '', description: '' });
        setEditingDay(null);
    };

    const removeActivity = (dayIndex: number, activityIndex: number) => {
        const newItinerary = [...itinerary];
        newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
        onUpdate(newItinerary);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-widest text-gray-400 font-bold">แผนการเดินทาง</h3>
                <button
                    onClick={addDay}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all shadow-sm"
                >
                    + เพิ่มวัน
                </button>
            </div>

            {itinerary.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-3xl">
                    <p className="text-gray-400 text-sm mb-4">ยังไม่มีแผนการเดินทาง</p>
                    <button
                        onClick={addDay}
                        className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all"
                    >
                        สร้างแผนการเดินทาง
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {itinerary.map((day, dayIndex) => (
                        <div key={dayIndex} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900">วันที่ {day.day}</h4>
                                <button
                                    onClick={() => removeDay(dayIndex)}
                                    className="text-gray-400 hover:text-gray-700 text-xs font-medium transition-colors"
                                >
                                    ลบวันนี้
                                </button>
                            </div>

                            {/* Activities List */}
                            <div className="space-y-3 mb-4">
                                {day.activities.map((activity, actIndex) => {
                                    const isEditing = editingActivity?.dayIndex === dayIndex && editingActivity?.actIndex === actIndex;

                                    return (
                                        <div key={actIndex} className={`bg-white p-4 rounded-2xl border ${isEditing ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100'} relative group transition-all`}>
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="time"
                                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                                            value={editForm.time}
                                                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="ชื่อกิจกรรม"
                                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="สถานที่"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                                        value={editForm.location}
                                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                    />
                                                    <textarea
                                                        placeholder="รายละเอียด (ไม่บังคับ)"
                                                        rows={2}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingActivity(null)}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEdit(dayIndex, actIndex)}
                                                            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800"
                                                        >
                                                            บันทึก
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEditing(dayIndex, actIndex, activity)}
                                                            className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 flex items-center justify-center text-xs"
                                                            title="แก้ไข"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => removeActivity(dayIndex, actIndex)}
                                                            className="w-6 h-6 bg-gray-900 text-white rounded-full hover:bg-gray-800 flex items-center justify-center text-xs"
                                                            title="ลบ"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase">{activity.time}</div>
                                                    <div className="text-md font-medium text-gray-900 mt-1">{activity.name}</div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {activity.location}
                                                    </div>
                                                    {activity.description && (
                                                        <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Add Activity Form */}
                            {editingDay === dayIndex ? (
                                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="time"
                                            placeholder="เวลา"
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                            value={newActivity.time}
                                            onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="ชื่อกิจกรรม"
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                            value={newActivity.name}
                                            onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="สถานที่"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                        value={newActivity.location}
                                        onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="รายละเอียด (ไม่บังคับ)"
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                                        value={newActivity.description}
                                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => addActivity(dayIndex)}
                                            className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
                                        >
                                            เพิ่มกิจกรรม
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingDay(null);
                                                setNewActivity({ time: '', name: '', location: '', description: '' });
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setEditingDay(dayIndex)}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-medium hover:border-gray-400 hover:text-gray-600 transition-all"
                                >
                                    + เพิ่มกิจกรรม
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
