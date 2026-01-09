import React from 'react';
import './Loader.css';

interface LoaderProps {
    variant?: 'default' | 'dots';
}

const Loader: React.FC<LoaderProps> = ({ variant = 'default' }) => {
    return (
        <div className="flex justify-center items-center py-20 w-full h-full min-h-[200px]">
            <span className={variant === 'dots' ? 'loader-dots' : 'loader'}></span>
        </div>
    );
};

export default Loader;
