import React from 'react';

interface TopBarProps {
    children?: React.ReactNode;
    className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ children, className = '' }) => {
    return (
        <header className={`w-full py-4 px-4 md:px-6 lg:px-8 xl:px-12 bg-transparent ${className}`}>
            <div className="w-full max-w-7xl mx-auto flex items-center justify-center">
                {children}
            </div>
        </header>
    );
};

export default TopBar;
