import React, { useState, useEffect, useRef } from 'react';

// Add imports at top
import type { CertificationItem } from '../types';

interface BundleSectionProps {
    bundleName: string;
    role?: string;
    subtitle?: string;

    originalPrice: number;
    discountedPrice: number;
    certifiedCount?: number;
    onGetBundle: () => void;
    isLoading?: boolean;
    className?: string;
    certifications?: CertificationItem[];
    skills?: string[];
    selectedIds?: number[];
    onToggle?: (id: number) => void;
}

// Helper component for animating numbers
const NumberTicker = ({ value, duration = 500, format = (n: number) => n.toLocaleString() }: { value: number, duration?: number, format?: (n: number) => string }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const startValue = useRef(value);
    const startTime = useRef<number | null>(null);

    useEffect(() => {
        startValue.current = displayValue;
        startTime.current = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = timestamp - startTime.current;
            const percentage = Math.min(progress / duration, 1);

            // Easing function (easeOutQuart)
            const ease = 1 - Math.pow(1 - percentage, 4);

            const nextValue = Math.round(startValue.current + (value - startValue.current) * ease);
            setDisplayValue(nextValue);

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value, duration]);

    return <>{format(displayValue)}</>;
};

const BundleSection: React.FC<BundleSectionProps> = ({
    bundleName,
    role,
    subtitle,

    originalPrice,
    discountedPrice,
    onGetBundle,
    isLoading = false,
    className = '',
    certifications = [],
    skills = [],
    selectedIds = [],
    onToggle
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Countdown Timer State
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Min distance for swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Next
            setActiveIndex((current) => (current === displayCerts.length - 1 ? 0 : current + 1));
        }
        if (isRightSwipe) {
            // Prev
            setActiveIndex((current) => (current === 0 ? displayCerts.length - 1 : current - 1));
        }
    };

    const savings = originalPrice - discountedPrice;
    const discountPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

    // Prepare looped certifications for marquee
    const displayCerts = certifications && certifications.length > 0 ? certifications : [{
        skill_id: 0,
        certification_name: "Global Certification",
        certification_name_short: "Global Cert",
        skill_description: "",
        certificate_preview_url: "/assets/cert-demo.png"
    }];




    // Animation state for price change
    const [isPriceAnimating, setIsPriceAnimating] = useState(false);

    useEffect(() => {
        setIsPriceAnimating(true);
        const timer = setTimeout(() => setIsPriceAnimating(false), 300);
        return () => clearTimeout(timer);
    }, [discountedPrice]);

    return (
        <>
            <section id="claim-certificates-section" className={`w-full ${className}`}>

                {/* Section Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-4">
                    Get Your <span className="text-[#7FC241]">Global {role || 'Professional'}</span> Certificates
                </h2>

                {/* Bundle Card */}
                <div
                    className="relative p-4 sm:p-5 overflow-hidden"
                    style={{
                        border: '1px solid transparent',
                        borderRadius: '12px',
                        background: `
                        linear-gradient(180deg, #002A44 35%, #011B2C 100%) padding-box,
                        linear-gradient(180deg, #2674D3 0%, #133C6D 100%) border-box
                    `,
                        boxShadow: '0 0 30px 0 rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {/* Desktop: 2-Column Layout / Mobile: Stacked */}
                    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 mt-0 mb-6 w-full gap-6">

                        {/* Left Side: Images */}
                        <div className="w-full lg:col-span-5 relative flex flex-col items-center justify-start">
                            {/* Certificate Carousel */}
                            <div className="relative w-full flex flex-col items-center">
                                <div
                                    className="grid grid-cols-1 w-full touch-pan-y"
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                >
                                    {displayCerts.map((cert, index) => (
                                        <div
                                            key={`${cert.skill_id}-${index}`}
                                            className={`col-start-1 row-start-1 w-full flex items-center justify-center transition-all duration-500 ease-in-out ${index === activeIndex
                                                ? 'opacity-100 z-10 scale-100'
                                                : 'opacity-0 z-0 scale-95 pointer-events-none'
                                                }`}
                                        >
                                            <div className="relative w-full flex justify-center mt-2">
                                                {/* Preview Label */}
                                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                                                    <span className="bg-black/50 backdrop-blur-md text-white/90 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#D4AF37] shadow-lg whitespace-nowrap">
                                                        {bundleName || `Executive ${role} Bundle`}
                                                    </span>
                                                </div>

                                                <div className="relative w-full overflow-hidden border border-[#D4AF37]">
                                                    <img
                                                        src={cert.certificate_preview_url || "/assets/cert-demo.png"}
                                                        alt={cert.certification_name}
                                                        className="w-full h-auto object-contain drop-shadow-2xl"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "/assets/cert-demo.png";
                                                        }}
                                                    />

                                                    {/* Watermark overlay */}
                                                    {/* Watermark overlay */}


                                                    {/* Name & Gradient Overlay */}
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 pt-12 pb-4 px-4 z-20 flex items-end justify-center text-center pointer-events-none"
                                                        style={{
                                                            background: 'linear-gradient(0deg, rgba(0, 36, 59, 1) 37%, rgba(87, 199, 133, 0) 78%, rgba(237, 221, 83, 0) 100%)'
                                                        }}
                                                    >
                                                        <p className="text-white font-bold text-sm sm:text-base drop-shadow-md leading-tight">
                                                            {cert.certification_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Dots */}
                                {displayCerts.length > 1 && (
                                    <div className="flex items-center gap-2 mt-4 z-10">
                                        {displayCerts.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveIndex(idx)}
                                                className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex
                                                    ? 'w-8 bg-[#7FC241]'
                                                    : 'w-2 bg-white/20 hover:bg-white/40'
                                                    }`}
                                                aria-label={`View certificate ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Info & Actions */}
                        <div className="w-full lg:col-span-7 flex flex-col gap-3">

                            {/* Info Header */}
                            <div className="w-full flex flex-col justify-center text-center lg:text-left px-4 lg:px-0">
                                {/* Subtitle */}
                                {subtitle && (
                                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
                                        {subtitle}
                                    </p>
                                )}

                                {/* Skills / Benefits List */}
                                {skills && skills.length > 0 && (
                                    <ul className="flex flex-col gap-1.5 mt-3 max-w-xl mx-auto lg:mx-0">
                                        {skills.map((skill, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300 text-left">
                                                <svg className="w-4 h-4 text-[#7FC241] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="leading-tight">{skill}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Certifications Included Grid */}
                            {certifications && certifications.length > 0 && (
                                <div className="">
                                    <h4 className="text-sm sm:text-base font-semibold text-white mb-2.5 pl-2 border-l-4 border-[#7FC241]">Your Unlocked Certifications</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {certifications.map((cert) => (
                                            <div
                                                key={cert.skill_id}
                                                onClick={() => onToggle && onToggle(cert.skill_id)}
                                                className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${selectedIds.includes(cert.skill_id)
                                                    ? 'bg-[#021C30]/80 border-[#7FC241]/50 shadow-[0_0_10px_rgba(127,194,65,0.1)]'
                                                    : 'bg-[#021C30]/30 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20'
                                                    }`}
                                            >
                                                {/* Thumbnail - Smaller */}
                                                <div className="w-12 h-9 flex-shrink-0 overflow-hidden rounded bg-gray-800">
                                                    <img
                                                        src={cert.certificate_preview_url || "/assets/cert-demo.png"}
                                                        alt={cert.certification_name}
                                                        className={`w-full h-full object-cover transition-all ${selectedIds.includes(cert.skill_id) ? '' : 'grayscale'}`}
                                                    />
                                                </div>

                                                {/* Text Info */}
                                                <div className="min-w-0 flex-1">
                                                    <h5 className={`text-xs sm:text-sm font-bold truncate ${selectedIds.includes(cert.skill_id) ? 'text-white' : 'text-gray-400'}`} title={cert.certification_name}>
                                                        {cert.certification_name_short}
                                                    </h5>
                                                    <p className="text-[10px] text-gray-300 line-clamp-1">
                                                        {cert.certification_name}
                                                    </p>

                                                    {/* Price Display - Order: Badge → Strikethrough → Actual Price */}
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {/* RECOMMENDED Badge for CDAPx I and II (101, 102) with thumbs up icon */}
                                                        {(cert.skill_id === 101 || cert.skill_id === 102) && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                                                </svg>
                                                                RECOMMENDED
                                                            </span>
                                                        )}

                                                        {/* 50% OFF Badge for CBAPx and PMPx (103, 104) with tag icon */}
                                                        {(cert.skill_id === 103 || cert.skill_id === 104) && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-orange-400 bg-orange-400/10 border border-orange-400/20 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                                </svg>
                                                                50% OFF
                                                            </span>
                                                        )}

                                                        {/* Other badges from API - show chart up icon for "popular" or similar */}
                                                        {cert.badge && cert.skill_id !== 101 && cert.skill_id !== 102 && cert.skill_id !== 103 && cert.skill_id !== 104 && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-purple-400 bg-purple-400/10 border border-purple-400/20 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                                                </svg>
                                                                {cert.badge}
                                                            </span>
                                                        )}

                                                        {/* Original Price (Strikethrough) - Show for CDAPx I, II (101, 102) */}
                                                        {(cert.skill_id === 101 || cert.skill_id === 102) ? (
                                                            <span className="text-[10px] text-gray-500 line-through decoration-red-500/60">
                                                                ₹4,999
                                                            </span>
                                                        ) : (cert.skill_id === 103 || cert.skill_id === 104) ? (
                                                            <span className="text-[10px] text-gray-500 line-through decoration-red-500/60">
                                                                ₹1,999
                                                            </span>
                                                        ) : (cert.skill_id === 105) ? (
                                                            <span className="text-[10px] text-gray-500 line-through decoration-red-500/60">
                                                                ₹1,999
                                                            </span>
                                                        ) : cert.original_price && (
                                                            <span className="text-[10px] text-gray-500 line-through decoration-red-500/60">
                                                                ₹{cert.original_price}
                                                            </span>
                                                        )}

                                                        {/* Current Price */}
                                                        <span className={`text-xs font-bold ${selectedIds.includes(cert.skill_id) ? 'text-white' : 'text-gray-300'}`}>
                                                            ₹{
                                                                cert.skill_id === 101 || cert.skill_id === 102 ? 1999 :
                                                                    cert.skill_id === 103 || cert.skill_id === 104 ? 999 :
                                                                        cert.skill_id === 105 ? 999 :
                                                                            cert.price || 999
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Checkbox */}
                                                < div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.includes(cert.skill_id)
                                                    ? 'bg-[#7FC241] border-[#7FC241]'
                                                    : 'bg-transparent border-gray-600'
                                                    }`}>
                                                    {selectedIds.includes(cert.skill_id) && (
                                                        <svg className="w-3.5 h-3.5 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Free Bonuses Section */}
                            <div className="mt-0 mb-4 p-4 rounded-lg border-2 border-[#7FC241]/30 bg-[#7FC241]/5">
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#7FC241]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                    </svg>
                                    <span>Free Bonuses Included</span>
                                </h4>

                                {/* Unlock Message - Moved above bonus items */}
                                {(() => {
                                    const nonAICertCount = selectedIds.filter(id => id !== 105).length;
                                    const hasAICert = selectedIds.includes(105);
                                    const onlyBasicCerts = selectedIds.filter(id => id !== 105).every(id => id === 101 || id === 102) && nonAICertCount > 0;
                                    const basicCertsWithAI = onlyBasicCerts && hasAICert;

                                    if (basicCertsWithAI) {
                                        return (
                                            <p className="text-xs sm:text-sm text-yellow-400 font-semibold mb-3 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Select 1 more certification to unlock all bonuses
                                            </p>
                                        );
                                    } else if (onlyBasicCerts) {
                                        return (
                                            <p className="text-xs sm:text-sm text-yellow-400 font-semibold mb-3 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Select 2 more certifications to unlock all bonuses
                                            </p>
                                        );
                                    } else if (nonAICertCount < 3) {
                                        return (
                                            <p className="text-xs sm:text-sm text-yellow-400 font-semibold mb-3 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Select {3 - nonAICertCount} more certificate{3 - nonAICertCount > 1 ? 's' : ''} to unlock all bonuses
                                            </p>
                                        );
                                    } else {
                                        return (
                                            <p className="text-xs sm:text-sm text-[#7FC241] font-bold mb-3 flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                All bonuses unlocked! Worth ₹{selectedIds.includes(105) ? '6,596' : '4,597'} FREE
                                            </p>
                                        );
                                    }
                                })()}

                                <div className="grid grid-cols-1 gap-2.5">
                                    {(() => {
                                        // Calculate which bonuses are unlocked
                                        // Count non-AI certificates (assuming AI cert has a specific skill_id - adjust if needed)
                                        const nonAICertCount = selectedIds.filter(id => id !== 105).length; // Adjust 105 to actual AI cert ID
                                        const hasAICert = selectedIds.includes(105); // Adjust 105 to actual AI cert ID

                                        // If user selects only basic certs (101) and/or (102) (excluding AI), only 1 bonus is active
                                        const onlyBasicCerts = selectedIds.filter(id => id !== 105).every(id => id === 101 || id === 102) && nonAICertCount > 0;

                                        // Special case: If basic certs + AI selected, unlock data analytics course + AI course (2 bonuses)
                                        const basicCertsWithAI = onlyBasicCerts && hasAICert;

                                        let activeBonusCount = 0;
                                        if (basicCertsWithAI) {
                                            activeBonusCount = 2; // Data Analytics course + AI course
                                        } else if (onlyBasicCerts) {
                                            activeBonusCount = 1; // Only Data Analytics course
                                        } else if (nonAICertCount >= 3) {
                                            activeBonusCount = 4; // All bonuses
                                        }

                                        const bonuses = [
                                            {
                                                name: `HR Mastery Course`,
                                                description: "Complete curriculum covering advanced strategies & leadership.",
                                                value: 2999,
                                                icon: (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                ),
                                                unlocked: activeBonusCount >= 1
                                            },
                                            {
                                                name: `AI for HR Professionals Course`,
                                                description: "Master ChatGPT, Claude & AI tools to 100x your workflow.",
                                                value: 1999,
                                                icon: (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                ),
                                                // Unlock if: AI cert selected OR (basic certs + AI) OR (3+ non-AI certs)
                                                unlocked: hasAICert || activeBonusCount >= 4,
                                                condition: hasAICert ? undefined : "Select AI Certificate to unlock"
                                            },
                                            {
                                                name: "Resume Enhancer",
                                                description: "1-Click AI enhancement to make your resume ATS-compliant.",
                                                value: 999,
                                                icon: (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                ),
                                                unlocked: activeBonusCount >= 3
                                            },
                                            {
                                                name: "LearnTube Pro (1 Month)",
                                                description: "Unlock 1,000+ premium courses & certifications for 1 month.",
                                                value: 599,
                                                icon: (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                ),
                                                unlocked: activeBonusCount >= 4
                                            }
                                        ];

                                        return bonuses.map((bonus, idx) => {
                                            const isLocked = !bonus.unlocked;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg transition-all ${isLocked
                                                        ? 'bg-[#021C30]/20 border-2 border-dashed border-white/10 opacity-80'
                                                        : 'bg-gradient-to-r from-[#7FC241]/10 to-transparent border border-[#7FC241]/20'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Icon with checkmark badge */}
                                                        <div className="flex-shrink-0 relative">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isLocked
                                                                ? 'bg-gray-700/30 text-gray-400'
                                                                : 'bg-[#7FC241]/20 text-[#7FC241] shadow-[0_0_10px_rgba(127,194,65,0.15)]'
                                                                }`}>
                                                                {isLocked ? (
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : bonus.icon}
                                                            </div>
                                                            {/* Checkmark badge - bottom right corner */}
                                                            {!isLocked && (
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#7FC241] rounded-full flex items-center justify-center border-2 border-[#021C30]">
                                                                    <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <span className={`text-xs sm:text-sm font-semibold ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                                                                    {bonus.name}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${isLocked
                                                                        ? 'bg-gray-700/30 text-gray-400'
                                                                        : 'bg-[#7FC241]/20 text-[#7FC241] line-through decoration-2'
                                                                        }`}>
                                                                        ₹{bonus.value}
                                                                    </span>
                                                                    {!isLocked && (
                                                                        <span className="text-[10px] sm:text-xs font-bold text-green-400">FREE</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isLocked && bonus.condition && (
                                                                <p className="text-[10px] sm:text-xs text-gray-500 mb-1">{bonus.condition}</p>
                                                            )}
                                                            {/* Always visible description */}
                                                            {bonus.description && (
                                                                <p className={`text-[11px] sm:text-xs leading-relaxed ${isLocked ? 'text-gray-400' : 'text-gray-300'}`}>
                                                                    {bonus.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 lg:mt-auto">
                                {/* Price */}
                                <div className={`flex items-baseline gap-2 transition-transform duration-300 ${isPriceAnimating ? 'scale-110' : 'scale-100'}`}>
                                    <span className="text-[#FF7262] line-through text-sm sm:text-base">
                                        ₹<NumberTicker value={originalPrice} />
                                    </span>
                                    <span className="text-[#7FC241] text-2xl sm:text-3xl font-bold">
                                        ₹<NumberTicker value={discountedPrice} />
                                    </span>
                                    <span className="ml-1.5 bg-[#7FC241]/20 text-[#7FC241] text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider self-center">
                                        <NumberTicker value={discountPercent} />% OFF
                                    </span>
                                </div>

                                {/* Get Bundle Button */}
                                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                                    <button
                                        onClick={onGetBundle}
                                        disabled={isLoading}
                                        className={`w-full sm:w-auto bg-[#7FC241] hover:bg-[#68A335] text-black font-bold text-base sm:text-lg px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group animate-pulsate-glow ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>
                                                    {selectedIds.length > 1 ? `Purchase ${selectedIds.length} Certifications` : 'Purchase Single Certificate'}
                                                </span>
                                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                    {/* Free Bonuses Summary */}
                                    <div className="flex items-center gap-1.5 mt-3">
                                        {(() => {
                                            const nonAICertCount = selectedIds.filter(id => id !== 105).length;
                                            const hasAICert = selectedIds.includes(105);
                                            const onlyBasicCerts = selectedIds.filter(id => id !== 105).every(id => id === 101 || id === 102) && nonAICertCount > 0;
                                            const basicCertsWithAI = onlyBasicCerts && hasAICert;

                                            let unlockedBonusCount = 0;
                                            let totalBonusValue = 0;

                                            if (basicCertsWithAI) {
                                                unlockedBonusCount = 2;
                                                totalBonusValue = 2999 + 1999; // Data Analytics Course + AI Course
                                            } else if (onlyBasicCerts) {
                                                unlockedBonusCount = 1;
                                                totalBonusValue = 2999; // Data Analytics Course only
                                            } else if (nonAICertCount >= 3) {
                                                unlockedBonusCount = hasAICert ? 4 : 3;
                                                totalBonusValue = hasAICert ? 6596 : 4597; // All bonuses
                                            }

                                            if (unlockedBonusCount === 0) {
                                                return (
                                                    <span className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
                                                        Select certifications to unlock bonuses
                                                    </span>
                                                );
                                            }

                                            return (
                                                <span className="text-xs sm:text-sm text-[#7FC241] font-bold tracking-wide">
                                                    {unlockedBonusCount} Free Bonus{unlockedBonusCount > 1 ? 'es' : ''} worth ₹{totalBonusValue.toLocaleString()} included with purchase
                                                </span>
                                            );
                                        })()}
                                        <img src="/assets/check-badge.svg" alt="Certified" className="w-4 h-4" />
                                    </div>

                                    {/* Limited Time Offer Timer */}
                                    <div className="mt-3 px-3 py-1.5 border-2 border-dotted border-red-500/50 rounded-lg bg-red-500/10 flex items-center gap-2 animate-pulse">
                                        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Limited Time Offer:</span>
                                        <span className="text-red-300 font-mono font-bold text-sm">
                                            {formatTime(timeLeft)} Min
                                        </span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div >

                {/* Stats / Value Props Section - Outside bundle card */}
                <div className="w-full mt-8 mb-4 max-w-4xl mx-auto">
                    <h4 className="text-lg font-bold text-white text-center mb-6">
                        How Our Certificates Help:
                    </h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {/* Stat 1: LinkedIn & CV */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#7FC241]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#7FC241]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">42% Boost</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    In LinkedIn & CV Value
                                </span>
                            </div>
                        </div>

                        {/* Stat 2: Recruiter Attention */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#4FC3F7]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#4FC3F7]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#4FC3F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">2x More</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    Attention By Recruiters
                                </span>
                            </div>
                        </div>

                        {/* Stat 3: Interview Chance */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#FFD700]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#FFD700]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">53% Higher</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    Chance Of Interviews
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Bottom Bar - Disabled: Using global sticky bar in ResultsPageV3 instead */}
            {/* <div
                className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    background: 'linear-gradient(180deg, #002A44 0%, #011B2C 100%)',
                    borderTop: '1px solid rgba(127, 194, 65, 0.3)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-end  gap-2 sm:gap-3">
                        <div className="flex flex-col items-baseline gap-1">
                            <span className="text-[#FF7262] line-through text-xs sm:text-sm">
                                ₹<NumberTicker value={originalPrice} />
                            </span>
                            <span className="text-[#7FC241] text-lg sm:text-2xl font-bold leading-none ">
                                ₹<NumberTicker value={discountedPrice} />
                            </span>

                        </div>
                        <span className="bg-[#7FC241]/20 text-[#7FC241] text-[9px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <NumberTicker value={discountPercent} />% OFF
                        </span>
                    </div>

                    <button
                        onClick={onGetBundle}
                        disabled={isLoading}
                        className={`bg-[#7FC241] hover:bg-[#68A335] text-black font-bold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group whitespace-nowrap ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="hidden sm:inline">Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>
                                    {selectedIds.length > 1 ? `Get ${selectedIds.length} Certs` : 'Get Certificate'}
                                </span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div> */}
        </>
    );
};

export default BundleSection;
