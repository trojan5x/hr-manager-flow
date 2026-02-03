import React from 'react';

interface StickyBottomBarProps {
    children: React.ReactNode;
    className?: string;
}

const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ children, className = '' }) => {
    return (
        <div className={`fixed bottom-0 left-0 w-full bg-[#001C2C]/95 backdrop-blur-lg border-t border-gray-800 p-4 z-50 ${className}`}>
            <div className="max-w-4xl mx-auto">
                {children}
            </div>
        </div>
    );
};

export default StickyBottomBar;
