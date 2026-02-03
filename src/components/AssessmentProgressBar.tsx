import React, { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
    currentPhase: number; // 1-6
    phases: string[];
    skillName?: string; // Dynamic skill name
    scenariosProgress?: {
        ready: number;
        total: number;
        generating: number;
        pending: number;
    };
    currentQuestion?: number; // 0-indexed question within current phase
    totalQuestionsInPhase?: number; // Total questions in current phase
    totalAnswered?: number; // Total questions answered so far across all phases
    totalQuestions?: number; // Total questions across all phases
}

const AssessmentProgressBar: React.FC<ProgressBarProps> = ({
    currentPhase,
    phases,
    skillName,
    scenariosProgress: _scenariosProgress,
    currentQuestion = 0,
    totalQuestionsInPhase = 5,
    totalAnswered = 0,
    totalQuestions = 30
}) => {
    // Calculate progress based on questions answered (more granular than phases)
    const calculateProgress = () => {
        if (totalQuestions === 0) return 0;
        return Math.round((totalAnswered / totalQuestions) * 100);
    };

    const progress = ((currentPhase - 1) / (phases.length - 1)) * 100;
    const [animatedProgress, setAnimatedProgress] = useState(calculateProgress());
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNameExpanded, setIsNameExpanded] = useState(false);
    const [isTextOverflowing, setIsTextOverflowing] = useState(false);
    const skillNameRef = useRef<HTMLHeadingElement>(null);

    // Animate progress when questions answered changes
    useEffect(() => {
        const targetProgress = calculateProgress();

        // Only animate if progress is increasing
        if (targetProgress > animatedProgress) {
            setIsAnimating(true);
            let startProgress = animatedProgress;
            const progressDiff = targetProgress - startProgress;
            const animationDuration = 500; // 0.5 seconds for quicker feedback per question
            const frameRate = 60; // 60fps
            const totalFrames = (animationDuration / 1000) * frameRate;
            const progressPerFrame = progressDiff / totalFrames;

            let currentFrame = 0;

            const animateProgress = () => {
                currentFrame++;
                const newProgress = Math.min(startProgress + (progressPerFrame * currentFrame), targetProgress);
                setAnimatedProgress(Math.round(newProgress));

                if (currentFrame < totalFrames && newProgress < targetProgress) {
                    requestAnimationFrame(animateProgress);
                } else {
                    // Animation complete
                    setIsAnimating(false);
                }
            };

            requestAnimationFrame(animateProgress);
        } else if (targetProgress < animatedProgress) {
            // Handle case where progress might reset (shouldn't happen normally)
            setAnimatedProgress(targetProgress);
        }
    }, [totalAnswered, totalQuestions, currentQuestion, totalQuestionsInPhase]);

    // Countdown timer state (40 minutes = 2400 seconds)
    const [timeLeft, setTimeLeft] = useState(2400);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Detect text overflow for skill name
    useEffect(() => {
        const checkOverflow = () => {
            if (skillNameRef.current && !isNameExpanded) {
                const isOverflowing = skillNameRef.current.scrollWidth > skillNameRef.current.clientWidth;
                setIsTextOverflowing(isOverflowing);
            } else {
                setIsTextOverflowing(false);
            }
        };

        checkOverflow();
        // Recheck on window resize
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [skillName, currentPhase, isNameExpanded]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-gradient-to-r from-[#001C2C] to-[#00385C] border-b border-white/10 px-3 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-5xl mx-auto">
                {/* Progress Container */}
                <div className="relative mb-6">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-6 md:left-8 right-6 md:right-8 h-0.5 bg-white/20 rounded-full transform -translate-y-1/2"></div>

                    {/* Progress Line */}
                    <div
                        className="absolute top-1/2 left-6 md:left-8 h-0.5 bg-gradient-to-r from-[#98D048] to-[#7AB93D] rounded-full transform -translate-y-1/2 transition-all duration-500 ease-out z-10"
                        style={{
                            width: `calc(${progress}% * (100% - 3rem) / 100 + 1.5rem)`
                        }}
                    ></div>

                    {/* Phase Circles */}
                    <div className="flex justify-between items-center">
                        {phases.map((_, index) => {
                            const phaseNumber = index + 1;
                            const isActive = phaseNumber === currentPhase;
                            const isCompleted = phaseNumber < currentPhase;

                            return (
                                <div key={index} className="relative z-20">
                                    <div
                                        className={`
                                            w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300
                                            ${isCompleted
                                                ? 'bg-[#98D048] border-[#98D048] text-white shadow-md'
                                                : isActive
                                                    ? 'bg-[#98D048] border-[#98D048] text-white shadow-lg shadow-[#98D048]/30'
                                                    : 'bg-[#1a3a4d] border-white/30 text-white/60'
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            phaseNumber
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Phase Info and Progress/Timer */}
                <div className="space-y-3 md:space-y-0">
                    {/* Row 1: Phase Info (mobile: full width, desktop: flex with progress) */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                        {/* Phase Info - Left Aligned with expandable long names */}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm text-white/60 mb-1">
                                Phase {currentPhase} of {phases.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <h2
                                    ref={skillNameRef}
                                    className={`text-lg md:text-xl lg:text-2xl font-bold text-white transition-all duration-200 ${isNameExpanded ? '' : 'truncate'}`}
                                >
                                    {skillName || phases[currentPhase - 1]}
                                </h2>
                                {/* Chevron to expand/collapse long names - only show when text is truncated */}
                                {(isTextOverflowing || isNameExpanded) && (
                                    <button
                                        onClick={() => setIsNameExpanded(!isNameExpanded)}
                                        className="flex-shrink-0 p-1 text-white/60 hover:text-white transition-colors"
                                        aria-label={isNameExpanded ? 'Collapse skill name' : 'Expand skill name'}
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${isNameExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress and Timer - Desktop: Right aligned, Mobile: Hidden here (shown below) */}
                        <div className="hidden md:block text-right space-y-2 flex-shrink-0">
                            {/* Progress Percentage */}
                            <div className="flex items-center gap-2 justify-end">
                                <svg className="w-5 h-5 text-[#98D048] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-white/60 text-sm whitespace-nowrap">
                                    Progress <span className={`font-semibold text-[#98D048] transition-all duration-300 ${isAnimating ? 'animate-pulse scale-110' : ''}`}>{animatedProgress}%</span>
                                </span>
                            </div>

                            {/* Countdown Timer */}
                            <div className="flex items-center gap-2 justify-end">
                                <svg className="w-5 h-5 text-[#98D048] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    <span className={`text-base font-mono font-semibold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                    <span className="text-xs text-white/60">left</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Progress and Timer - Mobile only, horizontal layout */}
                    <div className="flex md:hidden items-center justify-between gap-4 pt-2 border-t border-white/10">
                        {/* Progress Percentage */}
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#98D048] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-white/60 text-xs whitespace-nowrap">
                                Progress <span className={`font-semibold text-[#98D048] transition-all duration-300 ${isAnimating ? 'animate-pulse scale-110' : ''}`}>{animatedProgress}%</span>
                            </span>
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#98D048] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <span className={`text-sm font-mono font-semibold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                                <span className="text-xs text-white/60">left</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentProgressBar;
