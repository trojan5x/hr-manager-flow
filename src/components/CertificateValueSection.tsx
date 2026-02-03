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

const CertificateValueSection: React.FC<CertificateValueSectionProps> = ({
    className = '',
    role = 'Professional',
    compact = false,
    showBenefits = true,
    showLogos = true
}) => {
    const benefits = [
        {
            title: "Recognized by Top Tech Companies",
            description: "Validated by experts from Google, Flipkart, Zepto, and LinkedIn.",
            icon: (
                <svg className="w-6 h-6 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: "Salary Hike & Promotions",
            description: `82% of certified ${role}s reported a promotion or salary hike within 6 months.`,
            icon: (
                <svg className="w-6 h-6 text-[#4FC3F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        },
        {
            title: "Add to LinkedIn in 1-Click",
            description: `Instantly add a verifiable badge to your LinkedIn profile to showcase your ${role} expertise.`,
            icon: (
                <svg className="w-6 h-6 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            title: "Valid for Lifetime",
            description: "Your certification never expires. A permanent asset for your CV.",
            icon: (
                <svg className="w-6 h-6 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Unlocking Your Career Potential</h3>
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
                                            <h4 className="text-white font-bold text-sm mb-0.5">{benefit.title}</h4>
                                            <p className="text-gray-400 text-xs leading-tight">{benefit.description}</p>
                                        </div>
                                    ) : (
                                        <div className="min-w-0 sm:w-full">
                                            <h4 className="text-white font-bold text-sm sm:text-lg mb-0.5 sm:mb-2">{benefit.title}</h4>
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

                {/* Social Proof Bar */}
                {showLogos && (
                    <div className="text-center">
                        <p className="text-gray-400 text-sm uppercase tracking-widest mb-3">Recognised by Companies Like</p>
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
                )}

            </div>
        </section>
    );
};

export default CertificateValueSection;
