import React from 'react';

interface CareerProgressionTimelineProps {
    className?: string;
}

const CareerProgressionTimelineV4: React.FC<CareerProgressionTimelineProps> = ({ className = '' }) => {
    return (
        <section className={`w-full max-w-4xl mx-auto ${className}`}>
            {/* 🎯 Career Progression Visualization */}
            <div className="transition-all duration-300 overflow-hidden bg-transparent">
                <div className="p-2 sm:p-4">
                    <h3 className="text-lg font-bold text-white mb-2 text-center flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Career Progression Timeline
                    </h3>
                    <p className="text-gray-400 text-xs text-center mb-8">Your projected growth based on thousands of successful alumni.</p>

                    {/* Compact Graph Timeline */}
                    <div className="relative w-full h-40 sm:h-48 mt-8 mb-8">
                        {/* Graph Background Grid */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-4">
                            <div className="h-px w-full border-b border-dashed border-white/10"></div>
                            <div className="h-px w-full border-b border-dashed border-white/10"></div>
                            <div className="h-px w-full border-b border-dashed border-white/10"></div>
                            <div className="h-px w-full border-b border-dashed border-white/10"></div>
                        </div>

                        {/* SVG Curve */}
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M 10,80 C 40,80 60,20 90,20" fill="none" stroke="url(#careerGrad)" strokeWidth="3" strokeLinecap="round" className="drop-shadow-lg" />
                            <defs>
                                <linearGradient id="careerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="50%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#22c55e" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Data Points */}
                        {/* Point 1: Now */}
                        <div className="absolute left-[10%] top-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                            <div className="text-red-400 text-[10px] mb-1 font-bold bg-[#021C30] px-1.5 py-0.5 rounded whitespace-nowrap border border-red-500/20">Now</div>
                            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                            <div className="mt-1.5 text-center bg-[#021C30] px-2 py-1 rounded border border-white/5">
                                <div className="text-white text-[11px] sm:text-xs font-bold whitespace-nowrap">Team Member</div>
                                <div className="text-gray-400 text-[9px] font-medium">₹6L - ₹12L</div>
                            </div>
                        </div>

                        {/* Point 2: Month 6 */}
                        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                            <div className="text-[#4FC3F7] text-[10px] mb-1 font-bold bg-[#021C30] px-1.5 py-0.5 rounded whitespace-nowrap border border-[#4FC3F7]/20">Month 6</div>
                            <div className="w-3 h-3 rounded-full bg-[#4FC3F7] border-2 border-white shadow-[0_0_8px_rgba(79,195,247,0.8)]"></div>
                            <div className="mt-1.5 text-center bg-[#021C30] px-2 py-1 rounded border border-white/5">
                                <div className="text-white text-[11px] sm:text-xs font-bold whitespace-nowrap">Promotion Ready</div>
                            </div>
                        </div>

                        {/* Point 3: Year 1 */}
                        <div className="absolute left-[90%] top-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                            <div className="mb-1.5 text-center bg-[#021C30] px-2 py-1 rounded border border-white/5">
                                <div className="text-white text-[11px] sm:text-xs font-bold whitespace-nowrap">Dept. Head</div>
                                <div className="text-[#7FC241] text-[9px] font-medium">₹18L - ₹35L</div>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-[#7FC241] border-2 border-white shadow-[0_0_8px_rgba(127,194,65,0.8)]"></div>
                            <div className="text-[#7FC241] text-[10px] mt-1 font-bold bg-[#021C30] px-1.5 py-0.5 rounded whitespace-nowrap border border-[#7FC241]/20">Year 1</div>
                        </div>
                    </div>

                    {/* Success Metrics (Compact) */}
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10 mt-6 bg-transparent p-2">
                        <div className="text-center">
                            <div className="text-[#7FC241] font-bold text-sm sm:text-base">87%</div>
                            <div className="text-gray-400 text-[9px] sm:text-[10px] leading-tight mt-0.5">Promoted<br/>in 1yr</div>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <div className="text-[#4FC3F7] font-bold text-sm sm:text-base">156%</div>
                            <div className="text-gray-400 text-[9px] sm:text-[10px] leading-tight mt-0.5">Average<br/>Hike</div>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <div className="text-purple-400 font-bold text-sm sm:text-base">73%</div>
                            <div className="text-gray-400 text-[9px] sm:text-[10px] leading-tight mt-0.5">Leadership<br/>Roles</div>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <div className="text-amber-400 font-bold text-sm sm:text-base">94%</div>
                            <div className="text-gray-400 text-[9px] sm:text-[10px] leading-tight mt-0.5">Increased<br/>Confidence</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CareerProgressionTimelineV4;
