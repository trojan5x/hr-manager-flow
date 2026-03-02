import React, { useState, useEffect, useRef } from 'react';

interface CertificateData {
    firstName?: string;
    lastName?: string;
    certNameShort?: string;
    certNameFull?: string;
    certId?: string;
    date?: string;
}

interface CertificateFanProps {
    className?: string;
    certificateImages?: string[]; // Deprecated - kept for backward compatibility
    certificateNames?: string[]; // Short names for the certificates
    certificateFullNames?: string[]; // Full names for the certificates
    certificatesData?: CertificateData[]; // New: structured certificate data
    delay?: number; // Delay in ms before showing
    userFirstName?: string; // User's first name
    userLastName?: string; // User's last name
}

const CertificateFan: React.FC<CertificateFanProps> = ({ 
    className = '', 
    certificateImages, 
    certificateNames, 
    certificateFullNames, 
    certificatesData,
    delay = 0,
    userFirstName = 'John',
    userLastName = 'Doe'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Prepare certificate data - use new structured data or fallback to old props
    const certificates: CertificateData[] = React.useMemo(() => {
        if (certificatesData && certificatesData.length > 0) {
            return certificatesData.slice(0, 5); // Limit to 5 certificates
        }

        // Fallback to old props format
        const fallbackCerts: CertificateData[] = [];
        const certCount = Math.min(5, Math.max(
            certificateNames?.length || 0,
            certificateFullNames?.length || 0,
            certificateImages?.length || 0
        )) || 5;

        for (let i = 0; i < certCount; i++) {
            fallbackCerts.push({
                firstName: userFirstName || "YOUR",
                lastName: userLastName || "NAME HERE",
                certNameShort: certificateNames?.[i] || `Certificate ${i + 1}`,
                certNameFull: certificateFullNames?.[i] || `Professional Certificate ${i + 1}`,
                certId: `SPEC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                date: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                })
            });
        }

        return fallbackCerts;
    }, [certificatesData, certificateNames, certificateFullNames, certificateImages, userFirstName, userLastName]);

    // Handle initial delay and readiness
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [delay]);

    // Auto-rotate certificates every 3 seconds (only when ready and not paused)
    useEffect(() => {
        if (!isReady || isAutoPaused) return;

        // Initial expansion
        const initialTimer = setTimeout(() => setIsExpanded(true), 500);

        const interval = setInterval(() => {
            setIsExpanded(false); // Collapse before rotating

            setCurrentIndex((prev) => (prev + 1) % certificates.length);

            // Expand after rotation settles
            setTimeout(() => {
                setIsExpanded(true);
            }, 800);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, [isReady, isAutoPaused, certificates.length]);

    // Touch Handlers for Swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;

        // Clear existing resume timer and pause
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        setIsAutoPaused(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const deltaX = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50; // Threshold for swipe

        if (Math.abs(deltaX) > minSwipeDistance) {
            // Haptic feedback
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                    navigator.vibrate(20);
                } catch (e) {
                    // Ignore errors
                }
            }

            if (deltaX > 0) {
                // Swipe Left -> Next
                setCurrentIndex((prev) => (prev + 1) % certificates.length);
            } else {
                // Swipe Right -> Prev
                setCurrentIndex((prev) => (prev - 1 + certificates.length) % certificates.length);
            }
        }

        // Resume auto-rotation after 4 seconds of inactivity
        pauseTimeoutRef.current = setTimeout(() => {
            setIsAutoPaused(false);
        }, 4000);

        // Reset
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Calculate position in the fan (0 = far left, 2 = center, 4 = far right)
    const getPosition = (certIndex: number) => {
        return (certIndex - currentIndex + certificates.length) % certificates.length;
    };

    // Configuration for each position in the fan
    const positionConfig = [
        { x: -45, y: 4, scale: 0.65, zIndex: 1, opacity: 0.7, blur: 3 },   // Far Left
        { x: -22, y: 2, scale: 0.8, zIndex: 2, opacity: 0.85, blur: 1.5 }, // Left
        { x: 0, y: 0, scale: 1, zIndex: 4, opacity: 1, blur: 0 },          // Center
        { x: 22, y: 2, scale: 0.8, zIndex: 2, opacity: 0.85, blur: 1.5 },  // Right
        { x: 45, y: 4, scale: 0.65, zIndex: 1, opacity: 0.7, blur: 3 },    // Far Right
    ];

    // Certificate HTML Component
    const CertificateHTML: React.FC<{ certificate: CertificateData }> = ({ certificate }) => (
        <div 
            className="relative w-full bg-white shadow-lg overflow-hidden" 
            style={{ 
                aspectRatio: '1300/900',
                containerType: 'inline-size', // Enable container queries
                containerName: 'cert'
            }}
        >
            {/* Background Image */}
            <img 
                src="/assets/specialised-cert-empty.png" 
                alt="Certificate Background" 
                className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Certificate Content - Using container query width (cqw) units */}
            <div className="absolute inset-0">
                {/* Name - Using cqw for container-relative sizing */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.706%',
                        top: '6.978%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '10cqw', // Container query width units
                        color: '#172C3F',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 1.2,
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {certificate.firstName}{'\n'}{certificate.lastName}
                </div>

                {/* Certificate Short Name */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.706%',
                        top: '47.245%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '5cqw', // Container query width units
                        color: '#172C3F',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 1.2,
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {certificate.certNameShort}
                </div>

                {/* Certificate Full Name */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.779%',
                        top: '55.680%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '3cqw', // Container query width units
                        color: '#172c3f',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 'normal',
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line',
                        opacity: 0.8
                    }}
                >
                    {certificate.certNameFull}
                </div>

                {/* Certificate ID and Date */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '46.361%',
                        top: '90.112%',
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: '2cqw', // Container query width units
                        color: '#505050',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 'normal',
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    ID: {certificate.certId} | DATE: {certificate.date}
                </div>
            </div>
        </div>
    );

    return (
        <div
            className={`relative w-full flex items-center justify-center transition-all duration-700 ease-out ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}
            style={{
                maxWidth: 'min(100%, 500px)',
                touchAction: 'pan-y' // Allow vertical scroll, handle horizontal swipe in JS
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Loading state - simplified since we don't need image loading */}
            {!isReady && (
                <div className="w-full flex items-center justify-center py-20 px-4">
                    <div className="bg-gradient-to-b from-[#0F2942]/95 to-[#0B1E32]/95 border border-[#38BDF8]/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl max-w-sm w-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#38BDF8] border-t-transparent"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-[#38BDF8]/20"></div>
                            </div>
                            <div className="text-center">
                                <div className="text-white text-base font-semibold mb-1">Preparing Certificates</div>
                                <div className="text-gray-300 text-sm">Generating your certifications...</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate fan - now always available when ready */}
            {isReady && (
                <>
                    {/* Height spacer - determines container height based on certificate aspect ratio */}
                    <div className="invisible relative mx-auto z-0" style={{ width: '75%' }}>
                        <div style={{ aspectRatio: '1300/900' }} className="w-full"></div>
                    </div>

                    {/* Inner container to hold certificates */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {certificates.map((certificate, index) => {
                            const position = getPosition(index);
                            const config = positionConfig[position];
                            const certName = certificate.certNameShort;
                            const certFullName = certificate.certNameFull;

                            return (
                                <div
                                    key={index}
                                    className="absolute transition-all duration-700 ease-in-out"
                                    style={{
                                        width: '75%',
                                        transform: `translateX(${config.x}%) translateY(${config.y}%) scale(${config.scale})`,
                                        zIndex: config.zIndex,
                                        opacity: config.opacity,
                                        filter: `blur(${config.blur}px)`,
                                    }}
                                >
                                    {/* Certificate Name Pill - Only on Center Card */}
                                    {position === 2 && certName && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in transition-all duration-300">
                                            <div className="rounded-full p-[1px] bg-gradient-to-b from-[#38BDF8] to-transparent shadow-lg shadow-black/50 transition-all duration-1000 ease-in-out">
                                                <div className="bg-[#001C2C]/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap flex items-center transition-all duration-1000 ease-in-out">
                                                    <span>
                                                        {certName}
                                                    </span>
                                                    <span
                                                        className={`transition-all duration-1000 ease-in-out overflow-hidden inline-block ${isExpanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}
                                                    >
                                                        {certFullName && certFullName !== certName ? ` - ${certFullName}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className="w-full"
                                        style={{
                                            boxShadow: position === 2
                                                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                                : '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
                                        }}
                                    >
                                        <CertificateHTML certificate={certificate} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default CertificateFan;
