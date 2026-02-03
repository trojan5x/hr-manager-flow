import React from 'react';

interface ComparisonRow {
    metric: string;
    without: string;
    with: string;
}

const comparisonData: ComparisonRow[] = [
    {
        metric: "Average Salary Increase",
        without: "3-5% (Standard Annual Increment)",
        with: "25-40% (Skill Premium)"
    },
    {
        metric: "Job Opportunities",
        without: "Limited to Generalist Roles",
        with: "Access to Senior & Specialized Roles"
    },
    {
        metric: "Career Progression",
        without: "Slower, Tenure-based",
        with: "Accelerated, Fast-track Promotions"
    }
];

interface CertificationComparisonTableProps {
    className?: string;
}

const CertificationComparisonTable: React.FC<CertificationComparisonTableProps> = ({ className = '' }) => {
    return (
        <section className={`w-full max-w-4xl mx-auto px-4 ${className}`}>
            <div className="bg-[#021C30]/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">

                {/* Header */}
                <div className="p-6 md:p-8 text-center border-b border-white/10">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Without Certification <span className="text-gray-400 font-normal text-lg mx-2">vs.</span> <span className="text-[#98D048]">With Certification</span>
                    </h3>
                    <p className="text-gray-400">See the tangible impact on your career trajectory</p>
                </div>

                {/* Table Content */}
                <div className="p-4 md:p-6">
                    {/* Desktop Headers (Hidden on Mobile) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 px-4">
                        <div className="col-span-4">Metric</div>
                        <div className="col-span-4 pl-4">Without Certification</div>
                        <div className="col-span-4 text-[#98D048]">With Certification</div>
                    </div>

                    <div className="space-y-3">
                        {comparisonData.map((row, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#0B2A3D]/40 border border-white/5 rounded-xl p-4 md:p-5 hover:bg-[#0B2A3D]/60 transition-colors"
                            >
                                {/* Metric Title */}
                                <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-white/50">
                                        {index === 0 && (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {index === 1 && (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        {index === 2 && (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-white font-semibold text-lg md:text-base">{row.metric}</span>
                                </div>

                                {/* Without Data - Mobile Optimized */}
                                <div className="col-span-1 md:col-span-4 md:pl-4 flex flex-row items-center gap-2">
                                    <span className="md:hidden text-xs text-gray-500 uppercase font-bold min-w-[80px]">Without:</span>
                                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"></div>
                                    <span className="text-gray-400 text-sm md:text-base">{row.without}</span>
                                </div>

                                {/* With Data - Mobile Optimized */}
                                <div className="col-span-1 md:col-span-4 flex flex-row items-center gap-2 bg-[#98D048]/10 md:bg-transparent rounded px-3 py-2 md:p-0 border border-[#98D048]/20 md:border-none">
                                    <span className="md:hidden text-xs text-[#98D048] uppercase font-bold min-w-[80px]">With Cert:</span>
                                    <div className="w-5 h-5 rounded-full bg-[#98D048]/20 flex items-center justify-center flex-shrink-0 text-[#98D048]">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-white font-bold text-sm md:text-base">{row.with}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CertificationComparisonTable;
