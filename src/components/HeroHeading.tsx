import React from 'react';

interface HeroHeadingProps {
    className?: string;
    fallbackRole?: string;
    coreSkill?: string;
    userName?: string;
    subtitle?: React.ReactNode;
}

const HeroHeading: React.FC<HeroHeadingProps> = ({
    className = '',
    fallbackRole = 'HR Leader',
    coreSkill,
    userName,
    subtitle
}) => {
    // Dynamic content based on props
    return (
        <div className="flex flex-col items-center">
            <h1 className={`text-3xl mb-0 md:text-5xl lg:text-5xl xl:text-6xl text-center lg:text-left animate-fade-in-up ${className}`} style={{ lineHeight: '130%' }}>
                {userName ? (
                    <>
                        {userName.split(' ')[0]}, <span className="font-medium bg-gradient-to-br from-white to-[#FFEA9A]/80 bg-clip-text text-transparent">Showcase Your</span>{' '}
                    </>
                ) : (
                    <span className="font-medium bg-gradient-to-br from-white to-[#FFEA9A]/80 bg-clip-text text-transparent">Showcase Your</span>
                )}{' '}
                <span className="text-[#FFEA9A] font-bold text-[1.1em]">{coreSkill || fallbackRole}</span>{' '}
                <span className="font-medium bg-gradient-to-br from-white to-[#FFEA9A]/80 bg-clip-text text-transparent">Mastery</span>
            </h1>

            {subtitle && (
                <p className="text-base md:text-xl text-gray-300 mt-1 mb-3 max-w-3xl text-center lg:text-left animate-fade-in-up animation-delay-200">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default HeroHeading;
