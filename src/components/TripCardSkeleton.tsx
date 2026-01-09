import React from 'react';

export const TripCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-stretch h-full relative overflow-hidden">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] z-20"></div>

            {/* Image Placeholder */}
            <div className="w-full md:w-48 h-40 md:h-auto min-h-[160px] rounded-2xl bg-gray-100 shrink-0"></div>

            {/* Content Placeholder */}
            <div className="flex-1 flex flex-col pt-4 md:pt-0 gap-3">
                {/* Date */}
                <div className="w-24 h-3 bg-gray-100 rounded-full"></div>

                {/* Title (2 lines) */}
                <div className="space-y-2">
                    <div className="w-3/4 h-8 bg-gray-100 rounded-xl"></div>
                    <div className="w-1/2 h-8 bg-gray-100 rounded-xl"></div>
                </div>

                {/* Location */}
                <div className="w-32 h-4 bg-gray-100 rounded-full"></div>

                {/* Description */}
                <div className="w-full h-12 bg-gray-50 rounded-xl"></div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white"></div>
                        </div>
                        <div className="w-16 h-3 bg-gray-100 rounded-full ml-2"></div>
                    </div>
                    <div className="w-24 h-4 bg-gray-100 rounded-full"></div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
