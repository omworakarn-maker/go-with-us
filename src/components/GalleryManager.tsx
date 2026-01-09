import React, { useState } from 'react';

interface GalleryManagerProps {
    gallery: string[];
    onUpdate: (newGallery: string[]) => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ gallery, onUpdate }) => {
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('ไฟล์ใหญ่เกิน 5MB');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            onUpdate([...gallery, base64]);
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = (index: number) => {
        const newGallery = gallery.filter((_, i) => i !== index);
        onUpdate(newGallery);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-widest text-gray-400 font-bold">รูปภาพเพิ่มเติม</h3>
                <label className="cursor-pointer px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all shadow-sm">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading || gallery.length >= 10}
                    />
                    {uploading ? 'กำลังอัปโหลด...' : '+ เพิ่มรูปภาพ'}
                </label>
            </div>

            {gallery.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                    ยังไม่มีรูปภาพเพิ่มเติม
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((img, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={img}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-32 object-cover rounded-xl border border-gray-100"
                            />
                            <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 w-6 h-6 bg-gray-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-gray-800"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {gallery.length >= 10 && (
                <p className="text-xs text-gray-400 text-center">
                    สามารถเพิ่มได้สูงสุด 10 รูป
                </p>
            )}
        </div>
    );
};
