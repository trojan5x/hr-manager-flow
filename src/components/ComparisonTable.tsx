import React from 'react';

interface ComparisonTableProps {
    className?: string;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ className = '' }) => {
    const comparisonData = [
        {
            feature: "Average Salary Increase",
            without: "0% - 5%",
            with: "25% - 40%",
            icon: (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            feature: "Job Opportunities",
            without: "Limited to entry-level",
            with: "Access to premium roles",
            icon: (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            feature: "Career Progression",
            without: "Slow / Stagnant",
            with: "Accelerated Growth",
            icon: (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        }
    ];

    return (
        <section className={`w-full max-w-5xl mx-auto px-2 sm:px-4 ${className}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
                Why <span className="text-[#98D048]">Certified</span> Professionals Win
            </h3>

            <div className="bg-[#021C30]/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden flex flex-col">

                {/* Visual Scroll Hint for Mobile - Distinct Banner */}
                <div className="md:hidden w-full bg-[#98D048]/10 border-b border-white/5 py-2 text-center">
                    <span className="text-xs text-[#98D048] font-semibold flex items-center justify-center gap-2 animate-pulse">
                        <span>←</span> Swipe to compare <span>→</span>
                    </span>
                </div>

                {/* Scrollable Table Area */}
                <div className="relative overflow-x-auto custom-scrollbar">
                    <div className="min-w-[600px] md:min-w-0">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 md:p-6 border-b border-white/10 bg-[#0B2A3D]/50 relative">
                            <div className="col-span-4 text-gray-400 font-semibold uppercase text-xs md:text-sm tracking-wider flex items-center">
                                Metric
                            </div>
                            <div className="col-span-4 text-gray-400 font-semibold uppercase text-xs md:text-sm tracking-wider text-center flex items-center justify-center">
                                Without Certification
                            </div>
                            <div className="col-span-4 text-[#98D048] font-bold uppercase text-xs md:text-sm tracking-wider text-center flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#98D048] animate-pulse hidden sm:block"></div>
                                With Certification
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-white/5">
                            {comparisonData.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 p-4 md:p-6 hover:bg-white/5 transition-colors group">
                                    {/* Metric */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#98D048]/10 transition-colors flex-shrink-0">
                                            {React.cloneElement(item.icon, { className: 'w-5 h-5 text-gray-400 group-hover:text-[#98D048] transition-colors' })}
                                        </div>
                                        <span className="text-sm md:text-lg font-medium text-white">{item.feature}</span>
                                    </div>

                                    {/* Without Certification */}
                                    <div className="col-span-4 flex items-center justify-center text-center">
                                        <span className="text-gray-400 font-medium text-sm md:text-base">{item.without}</span>
                                    </div>

                                    {/* With Certification */}
                                    <div className="col-span-4 flex items-center justify-center text-center relative">
                                        {/* Mobile Glow Background (Subtle) */}
                                        <div className="absolute inset-0 bg-[#98D048]/5 rounded-lg -z-10 md:hidden"></div>

                                        <span className="text-white font-bold text-sm md:text-lg lg:text-xl flex items-center gap-2">
                                            {item.with}
                                            {index === 0 && <span className="text-[#98D048] text-xs">🚀</span>}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visual Footer/CTA hint - Fixed (Not Scrollable) */}
                <div className="p-4 bg-[#98D048]/5 border-t border-[#98D048]/10 text-center relative z-20">
                    <p className="text-[#98D048] text-sm font-medium">
                        Don't get left behind. Secure your future today.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ComparisonTable;
