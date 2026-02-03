import React from 'react';

interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showPercentage?: boolean;
    color?: string;
    subtitle?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    percentage,
    size = 120,
    strokeWidth = 8,
    className = '',
    showPercentage = true,
    color = '#98D048',
    subtitle
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative ${className}`}>
            <svg
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 w-full h-full"
            >
                <defs>
                    <filter id="glow-inner" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="1" k3="1" />
                    </filter>
                    <radialGradient id="center-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="90%" stopColor="#011B2C" stopOpacity="1" />
                        {/* <stop offset="95%" stopColor="#406AFF" stopOpacity="0.6" /> */}
                        <stop offset="100%" stopColor="#406AFF" stopOpacity="0.3" />
                    </radialGradient>
                </defs>

                {/* Center Background Circle with detailed Glow */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius - strokeWidth / 2}
                    fill="url(#center-glow)"
                // Removed thin stroke to avoid "stroke-like" look, replaced with gradient fill
                />

                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 10px ${color}40)`
                    }}
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none z-10"
                        style={{
                            color: color,
                            textShadow: `0 0 20px ${color}60` // Match text glow to status color
                        }}
                    >
                        {percentage}%
                    </span>
                    {subtitle && (
                        <span
                            className="text-xs font-medium mt-1"
                            style={{
                                color: color,
                                opacity: 0.9
                            }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default CircularProgress;
