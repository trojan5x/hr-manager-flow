import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useImagePreloader } from '../utils/imageCache';

interface CertificateFanProps {
    className?: string;
    certificateImages?: string[]; // URLs of certificate preview images
    certificateNames?: string[]; // Short names for the certificates
    certificateFullNames?: string[]; // Full names for the certificates
    delay?: number; // Delay in ms before showing
}

const CertificateFan: React.FC<CertificateFanProps> = ({ className = '', certificateImages, certificateNames, certificateFullNames, delay = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const [loadedImageUrls, setLoadedImageUrls] = useState<string[]>([]);
    const [isPreloading, setIsPreloading] = useState(true);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { preloadImages, getCachedImage } = useImagePreloader();
    
    // Store functions in refs to avoid dependency issues
    const preloadImagesRef = useRef(preloadImages);
    const getCachedImageRef = useRef(getCachedImage);
    
    // Update refs when functions change
    useEffect(() => {
        preloadImagesRef.current = preloadImages;
        getCachedImageRef.current = getCachedImage;
    }, [preloadImages, getCachedImage]);

    // Memoize the image arrays to prevent infinite re-renders
    const imagesToUse = useMemo(() => {
        return certificateImages && certificateImages.length > 0
            ? certificateImages.filter(Boolean) // Remove any null/undefined URLs
            : ["/assets/cert-demo.png"];
    }, [certificateImages]);

    // Memoize fanImages to prevent recreating the array on every render
    const fanImages = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => 
            imagesToUse[i % imagesToUse.length]
        );
    }, [imagesToUse]);

    // Memoize the image URLs string to prevent unnecessary useEffect re-runs
    const imageUrlsKey = useMemo(() => fanImages.join('|'), [fanImages]);

    // Reset loading states when images change
    useEffect(() => {
        setImagesLoaded(false);
        setIsPreloading(true);
        setLoadedImageUrls([]);
    }, [imageUrlsKey]);

    // Preload images on mount
    useEffect(() => {
        let mounted = true;
        const startTime = Date.now();
        const minimumLoadingTime = 1000; // 1 second minimum loading time

        const loadImages = async () => {
            console.log('🖼️ Starting certificate image preload...', fanImages.length, 'images');
            setIsPreloading(true);

            try {
                // Check if ALL images are already cached
                const cachedImages = fanImages.map(url => getCachedImageRef.current(url));
                const allCached = cachedImages.every(img => img !== null);
                
                if (allCached && cachedImages.length === fanImages.length) {
                    console.log('✅ All certificate images found in cache - instant load!');
                    
                    // Calculate remaining time to show loading for minimum duration
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
                    
                    setTimeout(() => {
                        if (mounted) {
                            const imageUrls = cachedImages.map(img => img!.src);
                            setLoadedImageUrls(imageUrls);
                            setImagesLoaded(true);
                            setIsPreloading(false);
                            
                            // Check aspect ratio from first cached image
                            if (cachedImages[0] && cachedImages[0].naturalWidth > cachedImages[0].naturalHeight) {
                                setIsLandscape(true);
                            }
                        }
                    }, remainingTime);
                    return;
                }

                // Preload images with fallback
                console.log('📥 Preloading certificate images from network...');
                const result = await preloadImagesRef.current(fanImages, "/assets/cert-demo.png");
                
                // Ensure minimum loading time
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
                
                setTimeout(() => {
                    if (mounted) {
                        console.log(`✅ Preloaded ${result.loaded.length} certificate images`);
                        
                        if (result.failed.length > 0) {
                            console.warn('⚠️ Failed to load some certificate images:', result.failed.length);
                        }
                        
                        // Only mark as loaded if we have successfully loaded images
                        if (result.loaded.length > 0) {
                            setLoadedImageUrls(result.loaded.map(img => img.src));
                            setImagesLoaded(true);
                            setIsPreloading(false);

                            // Check aspect ratio from first loaded image
                            if (result.loaded[0] && result.loaded[0].naturalWidth > result.loaded[0].naturalHeight) {
                                setIsLandscape(true);
                            }
                        } else {
                            console.error('❌ No images loaded successfully - using fallback');
                            // Still show something, but with fallback
                            setLoadedImageUrls(["/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png"]);
                            setImagesLoaded(true);
                            setIsPreloading(false);
                        }
                    }
                }, remainingTime);
                
            } catch (error) {
                console.error('❌ Failed to preload certificate images:', error);
                
                // Ensure minimum loading time even for errors
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
                
                setTimeout(() => {
                    if (mounted) {
                        // Fallback to demo images
                        console.log('🔄 Using fallback demo images');
                        setLoadedImageUrls(["/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png", "/assets/cert-demo.png"]);
                        setImagesLoaded(true);
                        setIsPreloading(false);
                    }
                }, remainingTime);
            }
        };

        loadImages();

        return () => {
            mounted = false;
        };
    }, [imageUrlsKey]); // Use the memoized key instead of functions

    // Debug certificate fan status (only when ready)
    useEffect(() => {
        if (imagesLoaded && loadedImageUrls.length > 0) {
            console.log('🎯 Certificate fan ready with', loadedImageUrls.length, 'images');
        }
    }, [imagesLoaded, loadedImageUrls.length]);

    // Get loaded image URL
    const getImageSrc = useCallback((index: number): string => {
        if (loadedImageUrls.length === 0) {
            return "/assets/cert-demo.png"; // Temporary fallback
        }
        return loadedImageUrls[index % loadedImageUrls.length];
    }, [loadedImageUrls]);

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
            {/* Loading state - show while preloading or if images not ready */}
            {(isPreloading || !imagesLoaded || loadedImageUrls.length === 0) && (
                <div className="w-full flex items-center justify-center py-20 px-4">
                    <div className="bg-gradient-to-b from-[#0F2942]/95 to-[#0B1E32]/95 border border-[#38BDF8]/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl max-w-sm w-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#38BDF8] border-t-transparent"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-[#38BDF8]/20"></div>
                            </div>
                            <div className="text-center">
                                <div className="text-white text-base font-semibold mb-1">Loading Certificates</div>
                                <div className="text-gray-300 text-sm">Preparing your certifications...</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Only show certificate fan when images are loaded and URLs are ready */}
            {imagesLoaded && loadedImageUrls.length > 0 && !isPreloading && (
                <>
                    {/* Height spacer - determines container height based on image aspect ratio */}
                    <div className="invisible relative mx-auto z-0" style={{ width: cardWidth }}>
                        <img
                            src={getImageSrc(currentIndex)}
                            alt="Spacer"
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Inner container to hold certificates */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {Array.from({ length: 5 }, (_, index) => {
                            const position = getPosition(index);
                            const config = positionConfig[position];
                            const imageUrl = getImageSrc(index);
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
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            console.warn('⚠️ Certificate image failed to render:', imageUrl);
                                            target.src = "/assets/cert-demo.png";
                                        }}
                                    />
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
