import React, { useState, useRef, useEffect } from 'react';

interface AwardsSectionProps {
    className?: string;
}

const AwardsSection: React.FC<AwardsSectionProps> = ({ className = '' }) => {

    // Captions matching the slides
    const captions = [
        'LearnTube Founders Recognised at <span class="text-[#83BEFF] font-bold">Premier Google Event</span>',
        'Selected Among <span class="text-[#83BEFF] font-bold">Top 20 AI Startups</span>',
        'Shronit Talking About <span class="text-[#83BEFF] font-bold">Building The Future of Education</span>',
        'LearnTube\'s Story on <span class="text-[#83BEFF] font-bold">TV\'s #1 Startup Show</span>',
        'Founder On-Stage At A <span class="text-[#83BEFF] font-bold">Global Creator Summit</span>',
        'Founder On-Stage At <span class="text-[#83BEFF] font-bold">World\'s #1 Tech Conference</span>',
        '2024 Milestone: <span class="text-[#83BEFF] font-bold">Helping 400K+ People Upskill!</span>',
        'LearnTube Making Headlines On <span class="text-[#83BEFF] font-bold">Top Media Platforms</span>',
        'Awarded The Coveted <span class="text-[#83BEFF] font-bold">40 U 40</span>',
        'Received <span class="text-[#83BEFF] font-bold">Countless Global Awards</span>'
    ];

    // Slide images
    const sliderImages = [
        'https://assets.learntube.ai/files/linkedinpost/Component%20136.webp?updatedAt=1745649696325',
        'https://assets.learntube.ai/files/linkedinpost/Component%20137.webp?updatedAt=1745649696104',
        'https://assets.learntube.ai/files/linkedinpost/Component%20138.webp?updatedAt=1745649696094',
        'https://assets.learntube.ai/files/linkedinpost/Component%20139.webp?updatedAt=1745649892976',
        'https://assets.learntube.ai/files/new%20Linkedin%20data/Property%201=3.png?updatedAt=1746773868985',
        'https://assets.learntube.ai/files/linkedinpost/Component%20140.webp?updatedAt=1745649892320',
        'https://assets.learntube.ai/files/linkedinpost/Component%20141.webp?updatedAt=1745649892361',
        'https://assets.learntube.ai/files/linkedinpost/Component%20142.png?updatedAt=1745649981938',
        'https://assets.learntube.ai/files/linkedinpost/Component%20136-1.webp?updatedAt=1745649892357',
        'https://assets.learntube.ai/files/linkedinpost/Component%20136-2.webp?updatedAt=1745649892286'
    ];

    // Bottom logos
    const featuredLogos = [
        'https://assets.learntube.ai/files/new%20Linkedin%20data/Frame%20427321191.png?updatedAt=1747220801701',
        'https://assets.learntube.ai/files/new%20Linkedin%20data/Frame%20427321192.png?updatedAt=1747220801729',
        'https://assets.learntube.ai/files/new%20Linkedin%20data/Frame%20427321193.png?updatedAt=1747220801582'
    ];

    const [activeIndex, setActiveIndex] = useState(1);

    // Featured slide logic
    const [featuredIndex, setFeaturedIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setFeaturedIndex((current) => (current === featuredLogos.length - 1 ? 0 : current + 1));
        }, 3000);
        return () => clearInterval(interval);
    }, [featuredLogos.length]);

    // Touch/Swipe Logic
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        setStartX(clientX);
    };

    const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const diff = clientX - startX;
        setDragOffset(diff);
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        const threshold = 50; // min px to trigger swipe

        if (dragOffset > threshold) {
            // Swiped Right -> Previous Slide
            setActiveIndex(prev => Math.max(0, prev - 1));
        } else if (dragOffset < -threshold) {
            // Swiped Left -> Next Slide
            setActiveIndex(prev => Math.min(sliderImages.length - 1, prev + 1));
        }

        setDragOffset(0);
    };

    // Auto-advance
    useEffect(() => {
        if (isDragging) return;
        const interval = setInterval(() => {
            setActiveIndex((current) => (current === sliderImages.length - 1 ? 0 : current + 1));
        }, 3000);
        return () => clearInterval(interval);
    }, [sliderImages.length, isDragging]);


    // Calculate 3D Transform for each slide
    const getSlideStyles = (index: number) => {
        // Calculate abstract "position" relative to active index
        // If dragging, we adjust the "current" active point virtually
        const dragInfluence = isDragging ? dragOffset / 300 : 0; // rough conversion pixel to index
        const effectiveActiveIndex = activeIndex - dragInfluence;

        const diff = index - effectiveActiveIndex;

        const absDiff = Math.abs(diff);

        // Visibility Optimization
        if (absDiff > 3) return { display: 'none' };

        // Z-Index: Active is highest, further away is lower
        const zIndex = 10 - Math.round(absDiff);

        // Transform Values (Coverflow-like matching user request)
        // Adjust these to match the "fanned" look from screenshot
        const translateX = diff * 70; // Spacing
        const translateZ = Math.min(0, absDiff * -150); // Depth
        const rotateY = diff > 0 ? -15 : (diff < 0 ? 15 : 0); // Slight rotation
        const scale = Math.max(0.8, 1 - absDiff * 0.15);
        const opacity = Math.max(0.4, 1 - absDiff * 0.3);

        return {
            zIndex,
            // Align to bottom: horizontal center (-50%), vertical 0.
            // transformOrigin: 'bottom center' ensures scaling keeps them grounded.
            transformOrigin: 'bottom center',
            transform: `translate(-50%, 0) perspective(800px) translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
            opacity,
            transition: isDragging ? 'none' : 'transform 0.5s ease-out, opacity 0.5s ease-out'
        };
    };

    return (
        <section className={`w-full max-w-4xl mx-auto py-8 ${className}`}>
            {/* Main Background Container */}
            <div className="relative mt-9 -ml-4 w-[calc(100%+2rem)] bg-[#0D2436] pt-10 md:rounded-xl overflow-hidden"
                style={{ backgroundImage: 'linear-gradient(rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)' }}>

                {/* Header Content */}
                <div className="relative z-10 px-[22px] text-center">
                    <h2 className="text-[28px] sm:text-[32px] font-bold text-white leading-[120%] tracking-tight">
                        Experience our <span className="text-[#83BEFF]">Award</span> <br className="sm:hidden" />
                        <span className="text-[#83BEFF]">Winning</span> Platform
                    </h2>

                    <div className="mt-3.5 flex items-center justify-center gap-2">
                        <p className="font-medium text-[#D5EDFF] leading-[100%]">Recognised by</p>
                        <img
                            src="https://assets.learntube.ai/files/new%20Linkedin%20data/google.png?updatedAt=1746775707473"
                            width="73"
                            height="24"
                            alt="Google"
                            className="w-[73px] h-auto"
                        />
                    </div>
                </div>

                {/* Caption - Updates based on active slide */}
                <div className="px-2 h-14 md:h-16 mt-8 flex items-center justify-center relative z-10 grid place-items-center">
                    {/* Note: using activeIndex directly for caption might flicker during drag if we used effectiveIndex, better to use discrete activeIndex */}
                    <div className="text-xs md:text-sm text-[#D5EDFF] font-medium text-center transition-all duration-300">
                        ✨ <span dangerouslySetInnerHTML={{ __html: captions[activeIndex] || captions[0] }}></span>
                    </div>
                </div>

                {/* Custom Carousel Container */}
                <div
                    ref={containerRef}
                    className="relative w-full h-[320px] sm:h-[400px] cursor-grab active:cursor-grabbing touch-pan-y z-10"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onTouchStart}
                    onMouseMove={onTouchMove}
                    onMouseUp={onTouchEnd}
                    onMouseLeave={onTouchEnd}
                >
                    {sliderImages.map((img, index) => {
                        const style = getSlideStyles(index);
                        if (style.display === 'none') return null;

                        return (
                            <div
                                key={index}
                                // Changed to negative bottom to tuck behind the curve
                                className="absolute left-1/2 -bottom-2 mt-2 w-[280px] sm:w-[336px] bg-black rounded-2xl md:rounded-3xl shadow-[0_-10px_12px_rgba(66,133,244,0.3)] overflow-hidden origin-center will-change-transform"
                                style={style as React.CSSProperties}
                            >
                                {/* Removed fixed aspect ratio wrapper to let image define height */}
                                <img
                                    src={img}
                                    alt={`Award ${index}`}
                                    className="w-full h-auto object-cover pointer-events-none display-block"
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Separator Line (Curved) */}
                <div className="relative z-20 w-full -mt-10 -mb-4 pointer-events-none">
                    <img
                        src="https://assets.learntube.ai/files/new%20Linkedin%20data/Frame%20427321214%20(2).png?updatedAt=1746773625338"
                        className="w-full h-auto object-cover"
                        alt=""
                    />
                </div>

                {/* Footer / Featured By */}
                <div className="relative z-30 px-[22px] pb-10">
                    <h4 className="text-xl text-white text-center mb-3">
                        We have been <span className="font-bold">featured by</span>
                    </h4>

                    <div className="flex justify-center items-center h-12 relative">
                        {featuredLogos.map((logo, index) => (
                            <img
                                key={index}
                                src={logo}
                                alt="Featured"
                                className={`h-8 sm:h-10 w-auto object-contain transition-opacity duration-500 absolute ${index === featuredIndex ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default AwardsSection;
