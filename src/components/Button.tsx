import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
    className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    icon,
    className = '',
    ...props
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[#98D048] text-[#021019] hover:bg-opacity-90 focus:ring-[#98D048]",
        secondary: "bg-[#00385C] text-white hover:bg-[#00385C]/80 focus:ring-[#00385C]",
        outline: "border-2 border-[#98D048] text-[#98D048] hover:bg-[#98D048] hover:text-[#021019] focus:ring-[#98D048]"
    };

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
            {icon && <span className="ml-2">{icon}</span>}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
