import React from 'react';

// Company logos based on the file names found in assets
const companies = [
    { name: 'Company 1', src: '/assets/companyLogos/image 2.svg' },
    { name: 'Company 2', src: '/assets/companyLogos/image 3.svg' },
    { name: 'Company 3', src: '/assets/companyLogos/image 4.svg' },
    { name: 'Company 4', src: '/assets/companyLogos/image 5.svg' },
];

interface CertificateValueSectionProps {
    className?: string;
    role?: string;
    compact?: boolean;
    showBenefits?: boolean;
    showLogos?: boolean;
}

const CertificateValueSectionV4: React.FC<CertificateValueSectionProps> = ({
    className = '',
    role = 'Professional',
    compact = false,
    showBenefits = true,
    showLogos = true
}) => {
    const benefits = [
        // 🎯 SHORT-TERM OUTCOMES (0-3 months)
        {
            title: "Stand Out in Your Current Role",
            description: `Apply scenario-based expertise immediately - be the ${role} who knows exactly what to do in complex situations.`,
            timeline: "Within 30 days",
            icon: (
                <svg className="w-6 h-6 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            title: "Get Noticed by Leadership",
            description: `Add verifiable LinkedIn credentials that signal executive-level ${role} expertise to your current management.`,
            timeline: "Within 7 days",
            icon: (
                <svg className="w-6 h-6 text-[#4FC3F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        },
        // 🎯 LONG-TERM OUTCOMES (6+ months)  
        {
            title: "Position for Promotion",
            description: `Executive-level credentials differentiate you from 95% of candidates competing for senior ${role} positions.`,
            timeline: "Within 6 months",
            icon: (
                <svg className="w-6 h-6 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        },
        {
            title: "Command Higher Salary",
            description: `Specialized, job-performance skills justify 25-40% salary increases compared to generic ${role} knowledge.`,
            timeline: "Next salary review",
            icon: (
                <svg className="w-6 h-6 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            )
        }
    ];

    return (
        <section className={`w-full py-0 ${className}`}>
            <div className="flex flex-col gap-8">

                {/* Benefits Grid */}
                {showBenefits && (
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Transform Your Career Timeline</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                        </div>

                        <div className={compact
                            ? "grid grid-cols-1 gap-3 max-w-2xl mx-auto"
                            : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6"
                        }>
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className={compact
                                        ? "flex items-center gap-4 bg-gradient-to-br from-[#0b273d]/80 to-[#133C6D]/30 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                                        : "flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0 bg-gradient-to-br from-[#0b273d]/80 to-[#133C6D]/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 group"
                                    }
                                >
                                    <div className={compact
                                        ? "w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"
                                        : "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 sm:mb-4 group-hover:scale-110 transition-transform duration-300"
                                    }>
                                        {benefit.icon}
                                    </div>
                                    {compact ? (
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="text-white font-bold text-sm">{benefit.title}</h4>
                                                <span className="text-[#7FC241] text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7FC241]/20">
                                                    {benefit.timeline}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs leading-tight">{benefit.description}</p>
                                        </div>
                                    ) : (
                                        <div className="min-w-0 sm:w-full">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-bold text-sm sm:text-lg">{benefit.title}</h4>
                                                <span className="text-[#7FC241] text-xs font-bold px-2 py-0.5 rounded-full bg-[#7FC241]/20">
                                                    {benefit.timeline}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs sm:text-sm leading-tight sm:leading-relaxed">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🎯 ROLE-SPECIFIC SOCIAL PROOF */}
                {showLogos && (
                    <div className="text-center">
                        {/* Traditional Company Logos - Now supporting context */}
                        <div className="pt-2">
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 max-w-xs mx-auto">Recognized by Recruiters from 1120+ top companies like</p>
                            <div className="flex flex-nowrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                                {companies.map((company, index) => (
                                    <img
                                        key={index}
                                        src={company.src}
                                        alt={company.name}
                                        className="h-6 sm:h-8 md:h-10 w-auto object-contain brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-300"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </section>
    );
};

export default CertificateValueSectionV4;
