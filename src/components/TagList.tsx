import React from 'react';
import { Asterisk } from 'lucide-react';

interface TagListProps {
    tags?: string[];
    className?: string;
    duration?: string;
}

const defaultTags = [
    "Ulrich",
    "Workforce Planning",
    "SHRM",
    "CIPD",
    "Hogan",
    "Korn Ferry"
];

const TagList: React.FC<TagListProps> = ({ tags = defaultTags, className = '' }) => {
    // Quadruple tags for smoother infinite scroll buffer
    const extendedTags = [...tags, ...tags, ...tags, ...tags];
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = React.useState(false);

    React.useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationFrameId: number;

        const scroll = () => {
            if (!isPaused && scrollContainer) {
                // Speed: 0.75px per frame (approx 45px/sec) - requested speed reduction
                scrollContainer.scrollLeft += 0.75;

                // Infinite loop logic:
                // When we have scrolled past the length of one original set (approx 1/4 of total width)
                // We subtract that length to loop back seamlessly.
                // Using scrollWidth / 4 is a safe approximation since chunks are identical.
                const oneSetWidth = scrollContainer.scrollWidth / 4;

                if (scrollContainer.scrollLeft >= oneSetWidth) {
                    scrollContainer.scrollLeft -= oneSetWidth;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPaused, tags]); // Re-run if tags change

    return (
        <div className={`${className} animate-fade-in-up animation-delay-400`}>
            {/* Mobile: Scrolling Animation with Touch Support */}
            <div
                ref={scrollRef}
                className="relative overflow-x-auto no-scrollbar lg:hidden touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div className="flex items-center min-w-max" style={{ gap: '12px', paddingRight: '12px' }}>
                    {extendedTags.map((tag, index) => (
                        <React.Fragment key={`${tag}-${index}`}>
                            <div className="px-[10px] py-[8px] min-w-[60px] h-[30px] flex items-center justify-center rounded-[16px] border border-[#406AFF]/80 bg-[#406AFF]/10 text-white text-sm backdrop-blur-sm whitespace-nowrap flex-shrink-0 select-none">
                                {tag}
                            </div>
                            <Asterisk className="w-4 h-4 text-[#406AFF]/80 flex-shrink-0" />
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Desktop: Static Grid */}
            <div className="hidden lg:flex lg:flex-wrap lg:gap-3 xl:gap-4">
                {tags.map((tag, index) => (
                    <div key={`${tag}-${index}`} className="px-[14px] py-[10px] flex items-center justify-center rounded-[16px] border border-[#406AFF]/40 bg-[#406AFF]/10 text-white text-base backdrop-blur-sm whitespace-nowrap select-none">
                        {tag}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TagList;
