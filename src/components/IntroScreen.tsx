import React, { useEffect, useState } from 'react';

export const IntroScreen: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Step 1: Logo & Text Animation (0ms - 1500ms)
        // Step 2: Slide Up Exit (1500ms - 2200ms)
        const timer = setTimeout(() => {
            setIsVisible(false); // Trigger slide-up animation
        }, 1800);

        const removeTimer = setTimeout(() => {
            setShouldRender(false); // Remove from DOM
        }, 2500); // 1800 + 700ms transition

        return () => {
            clearTimeout(timer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 -translate-y-10'}`}>
                {/* Logo / Text */}
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 animate-in fade-in zoom-in duration-1000">
                    GO WITH US.
                </h1>
                <p className="text-gray-400 text-sm md:text-lg font-medium tracking-widest uppercase animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
                    Find your next journey
                </p>

                {/* Loader Line */}
                <div className="w-24 h-1 bg-white/20 mx-auto mt-8 rounded-full overflow-hidden">
                    <div className="h-full bg-white animate-[loading_1.5s_ease-in-out_infinite] w-full origin-left"></div>
                </div>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
