import React, { useState } from 'react';

interface StrengthWeaknessProps {
    strengths?: { category: string; description: string; evidence: string }[];
    weaknesses?: { category: string; description: string; recommendation: string }[];
    isLoading?: boolean;
    className?: string;
}

const StrengthsWeaknessesSection: React.FC<StrengthWeaknessProps> = ({
    strengths,
    weaknesses,
    isLoading = false,
    className = ''
}) => {
    const [expandedStrengths, setExpandedStrengths] = useState<number[]>([]);
    const [expandedWeaknesses, setExpandedWeaknesses] = useState<number[]>([]);

    const toggleStrength = (idx: number) => {
        setExpandedStrengths(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const toggleWeakness = (idx: number) => {
        setExpandedWeaknesses(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    // If no data and not loading, don't render
    if (!isLoading && (!strengths?.length && !weaknesses?.length)) {
        return null;
    }

    return (
        <section className={`w-full max-w-5xl mx-auto px-4 ${className}`}>
            {/* Main Container matching the ResultsCard style */}
            <div className={`bg-[#021C30] border border-[#00385C] rounded-xl p-6 shadow-inner`}>

                {isLoading ? (
                    // Loading State
                    <div className="pt-4 border-t border-white/10">
                        <div className="mb-6 px-1">
                            <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-64 bg-white/5 rounded animate-pulse"></div>
                        </div>
                        <div className="flex gap-4 overflow-x-hidden">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] bg-[#0b273d] p-5 rounded-2xl border border-white/5">
                                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-white/5 rounded animate-pulse"></div>
                                        <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse"></div>
                                        <div className="h-3 w-4/6 bg-white/5 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="pt-4">
                        <div className="mb-6 px-1">
                            <h3 className="text-xl font-bold text-white mb-1">Performance Feedback</h3>
                            <p className="text-gray-400 text-sm">Detailed insights based on your assessment performance</p>
                        </div>

                        <div className="space-y-8">
                            {/* Key Strengths */}
                            {strengths && strengths.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[#7FC241] text-sm font-bold uppercase tracking-wider flex items-center gap-2 px-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Key Strengths
                                    </h4>
                                    <div className="flex flex-col gap-3 -mx-1 px-1">
                                        {strengths.map((str, idx) => {
                                            const isExpanded = expandedStrengths.includes(idx);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-gradient-to-br from-[#0b273d] to-[#133C6D]/40 rounded-xl border border-white/5 transition-all duration-300 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => toggleStrength(idx)}
                                                        className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                                                    >
                                                        <div className="font-bold text-white text-base flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                            <div className="bg-[#7FC241]/20 p-1 rounded-full flex-shrink-0">
                                                                <svg className="w-4 h-4 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                            <span className={isExpanded ? 'whitespace-normal' : 'truncate'}>{str.category}</span>
                                                        </div>
                                                        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                            <p className="text-gray-300 text-sm leading-relaxed mb-3 mt-2">{str.description}</p>
                                                            <div className="text-[#7FC241] text-xs font-medium italic border-t border-white/5 pt-3">
                                                                "{str.evidence}"
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Areas for Improvement */}
                            {weaknesses && weaknesses.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[#FF6B6B] text-sm font-bold uppercase tracking-wider flex items-center gap-2 px-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Areas for Improvement
                                    </h4>
                                    <div className="flex flex-col gap-3 -mx-1 px-1">
                                        {weaknesses.map((weak, idx) => {
                                            const isExpanded = expandedWeaknesses.includes(idx);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-[#0b273d] rounded-xl border border-white/5 transition-all duration-300 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => toggleWeakness(idx)}
                                                        className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                                                    >
                                                        <div className="font-bold text-white text-base flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                            <div className="bg-[#FF6B6B]/20 p-1 rounded-full flex-shrink-0">
                                                                <svg className="w-4 h-4 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                            </div>
                                                            <span className={isExpanded ? 'whitespace-normal' : 'truncate'}>{weak.category}</span>
                                                        </div>
                                                        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                            <p className="text-gray-300 text-sm leading-relaxed mb-3 mt-2">{weak.description}</p>
                                                            <div className="text-[#FF6B6B] text-xs font-medium border-t border-white/5 pt-3">
                                                                Recommendation: {weak.recommendation}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default StrengthsWeaknessesSection;
