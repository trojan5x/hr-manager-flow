import { useState, useEffect } from 'react';

const UrgencyBanner = () => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 23,
        minutes: 14,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-[#EF4444] text-white text-center py-2 px-4 font-medium text-sm md:text-base sticky top-0 z-50 shadow-lg animate-fade-in-down">
            <span role="img" aria-label="warning">⚠️</span> TIME-SENSITIVE: Assessment expires in{' '}
            <span className="font-bold font-mono">
                {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
        </div>
    );
};

export default UrgencyBanner;
