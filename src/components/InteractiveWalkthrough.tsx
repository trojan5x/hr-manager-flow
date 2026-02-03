/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface Step {
    targetId?: string; // If undefined, show centered modal
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveWalkthroughProps {
    steps: Step[];
    onComplete: () => void;
    onSkip: () => void;
    isVisible: boolean;
}

const InteractiveWalkthrough: React.FC<InteractiveWalkthroughProps> = ({
    steps,
    onComplete,
    onSkip,
    isVisible
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentStep = steps[currentStepIndex];

    // Helper to get rect
    const updateRect = () => {
        if (!currentStep.targetId) {
            setTargetRect(null);
            return;
        }

        const element = document.getElementById(currentStep.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        } else {
            setTargetRect(null);
        }
    };

    useEffect(() => {
        if (isVisible) {
            // Scroll element into view if needed
            if (currentStep.targetId) {
                const element = document.getElementById(currentStep.targetId);
                if (element) {
                    // Use nearest to avoid jumping too much for large elements
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            updateRect();
            window.addEventListener('scroll', updateRect);
            window.addEventListener('resize', updateRect);
        }

        return () => {
            window.removeEventListener('scroll', updateRect);
            window.removeEventListener('resize', updateRect);
        };
    }, [isVisible, currentStepIndex]);

    // Calculate tooltip position with robust clamping
    const getTooltipPosition = () => {
        if (!targetRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '320px'
            };
        }

        const tooltipHeight = 250; // Approximate max height

        // Try placing below first
        let top = targetRect.bottom + 20;

        // If bottom placement goes off-screen, try above
        if (top + tooltipHeight > window.innerHeight) {
            const topPosition = targetRect.top - tooltipHeight - 20;
            if (topPosition >= 80) {
                // Fits above with buffer
                top = topPosition;
            } else {
                // Doesn't fit above or below perfectly - clamp to bottom of viewport
                top = Math.max(80, window.innerHeight - tooltipHeight - 20);
            }
        }

        // Final Hard Clamp to ensure it never goes off-screen
        top = Math.max(80, Math.min(window.innerHeight - tooltipHeight - 20, top));

        // Calculate Left (Center it, but clamp to screen)
        let left = targetRect.left + (targetRect.width / 2) - 160; // Center (160 is half of 320px width)
        left = Math.max(20, Math.min(window.innerWidth - 340, left));

        return {
            top: top,
            left: left,
            transform: 'none',
            width: '320px'
        };
    };

    // Handle step transitions
    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStepIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStepIndex(prev => prev - 1);
                setIsTransitioning(false);
            }, 300);
        }
    };

    if (!isVisible) return null;

    const tooltipStyle = getTooltipPosition();

    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Background Overlay */}
            <div
                className="absolute inset-0 bg-[#001C2C]/80 transition-all duration-500 ease-in-out"
                style={{
                    clipPath: targetRect
                        ? `polygon(
                            0% 0%, 
                            0% 100%, 
                            ${targetRect.left}px 100%, 
                            ${targetRect.left}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.bottom}px, 
                            ${targetRect.left}px ${targetRect.bottom}px, 
                            ${targetRect.left}px 100%, 
                            100% 100%, 
                            100% 0%
                        )`
                        : 'none'
                }}
            />

            {/* Spotlight Border */}
            {targetRect && (
                <div
                    className="absolute border-2 border-[#98D048] rounded-lg shadow-[0_0_20px_rgba(152,208,72,0.3)] transition-all duration-500 ease-in-out pointer-events-none"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                className={`absolute transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                style={{
                    ...tooltipStyle,
                    maxWidth: '90vw'
                }}
            >
                <div className="bg-[#002b45] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#98D048]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    {/* Step Counter */}
                    <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">
                        Step {currentStepIndex + 1} of {steps.length}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2">
                        {currentStep.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">
                        {currentStep.content}
                    </p>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onSkip}
                            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            Skip
                        </button>

                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 rounded-lg bg-[#98D048] hover:bg-[#88c038] text-[#001C2C] text-sm font-bold transition-colors shadow-lg"
                            >
                                {currentStepIndex === steps.length - 1 ? "Start" : "Next"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default InteractiveWalkthrough;
