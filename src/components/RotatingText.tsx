import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface RotatingTextProps {
    messages: ReactNode[];
    interval?: number;
    className?: string;
}

const RotatingText = ({ messages, interval = 3000, className = "" }: RotatingTextProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, interval);

        return () => clearInterval(timer);
    }, [messages.length, interval]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div
                key={index}
                className="animate-fade-in-up w-full flex justify-center"
            >
                {messages[index]}
            </div>
        </div>
    );
};

export default RotatingText;
