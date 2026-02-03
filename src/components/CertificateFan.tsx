import React, { useState, useEffect, useCallback, useRef } from 'react';

interface CertificateFanProps {
    className?: string;
    certificateImages?: string[]; // URLs of certificate preview images
    certificateNames?: string[]; // Short names for the certificates
    certificateFullNames?: string[]; // Full names for the certificates
    delay?: number; // Delay in ms before showing
}

const CertificateFan: React.FC<CertificateFanProps> = ({ className = '', certificateImages, certificateNames, certificateFullNames, delay = 0 }) => {
    // ... (existing state and logic remains same)
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAutoPaused, setIsAutoPaused] = useState(false); // Pause auto-rotation on interaction
    const loadedCountRef = useRef(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use dynamic certificate images if provided, otherwise fallback to demo images
    const imagesToUse = certificateImages && certificateImages.length > 0
        ? certificateImages
        : ["/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png"];

    // Get unique images to preload
    const uniqueImages = [...new Set(imagesToUse.slice(0, 5))];
    const totalImagesToLoad = uniqueImages.length;

    // Handle image load
    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth > img.naturalHeight) {
            setIsLandscape(true);
        }

        loadedCountRef.current += 1;
        if (loadedCountRef.current >= totalImagesToLoad) {
            setImagesLoaded(true);
        }
    }, [totalImagesToLoad]);

    // Handle initial delay and readiness
    useEffect(() => {
        if (imagesLoaded) {
            const timer = setTimeout(() => {
                setIsReady(true);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [imagesLoaded, delay]);

    // Auto-rotate certificates every 3 seconds (only when ready and not paused)
    useEffect(() => {
        if (!isReady || isAutoPaused) return;

        // Initial expansion
        const initialTimer = setTimeout(() => setIsExpanded(true), 500);

        const interval = setInterval(() => {
            setIsExpanded(false); // Collapse before rotating

            // Wait a bit before rotating to allow collapse animation (optional, but snappy is okay here)
            // Actually, let's rotate immediately but keep it collapsed, then expand.
            setCurrentIndex((prev) => (prev + 1) % 5);

            // Expand after rotation settles
            setTimeout(() => {
                setIsExpanded(true);
            }, 800);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, [isReady, isAutoPaused]);

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
            // Haptic feedback - Try a stronger pattern for better support
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                    navigator.vibrate(20);
                } catch (e) {
                    // Ignore errors
                }
            }

            if (deltaX > 0) {
                // Swipe Left -> Next
                setCurrentIndex((prev) => (prev + 1) % 5);
            } else {
                // Swipe Right -> Prev
                setCurrentIndex((prev) => (prev - 1 + 5) % 5);
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
        return (certIndex - currentIndex + 5) % 5;
    };

    // Configuration for each position in the fan
    const positionConfig = [
        { x: -45, y: 4, scale: 0.65, zIndex: 1, opacity: 0.7, blur: 3 },   // Far Left
        { x: -22, y: 2, scale: 0.8, zIndex: 2, opacity: 0.85, blur: 1.5 },   // Left
        { x: 0, y: 0, scale: 1, zIndex: 4, opacity: 1, blur: 0 },          // Center
        { x: 22, y: 2, scale: 0.8, zIndex: 2, opacity: 0.85, blur: 1.5 },    // Right
        { x: 45, y: 4, scale: 0.65, zIndex: 1, opacity: 0.7, blur: 3 },    // Far Right
    ];

    const cardWidth = isLandscape ? '75%' : '55%';

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
            {/* Height spacer - determines container height based on image aspect ratio */}
            <div className="invisible relative mx-auto z-0" style={{ width: cardWidth }}>
                <img
                    src={imagesToUse[currentIndex] || imagesToUse[0]}
                    alt="Spacer"
                    className="w-full h-auto"
                />
            </div>

            {/* Inner container to hold certificates */}
            <div className="absolute inset-0 flex items-center justify-center">
                {Array.from({ length: 5 }, (_, index) => {
                    const position = getPosition(index);
                    const config = positionConfig[position];
                    const imageUrl = imagesToUse[index % imagesToUse.length];
                    const certName = certificateNames ? certificateNames[index % certificateNames.length] : undefined;
                    const certFullName = certificateFullNames ? certificateFullNames[index % certificateFullNames.length] : undefined;


                    return (
                        <div
                            key={index}
                            className="absolute transition-all duration-700 ease-in-out"
                            style={{
                                width: cardWidth,
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

                            <img
                                src={imageUrl}
                                alt={`Certificate ${index + 1}`}
                                className="w-full h-auto object-contain"
                                style={{
                                    boxShadow: position === 2
                                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                        : '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
                                }}
                                onLoad={handleImageLoad}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/assets/cert-demo.png";
                                    handleImageLoad(e); // Count error as loaded too
                                }}
                            />
                        </div>
                    );
                })}
            </div>


        </div>
    );
};

export default CertificateFan;
