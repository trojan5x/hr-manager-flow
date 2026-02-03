import React from 'react';
import type { CertificationItem } from '../services/api';



interface IndividualSectionProps {
    certifications: CertificationItem[];
    onPurchase: (selectedCerts: CertificationItem[], totalPrice: number) => void;
    isLoading?: boolean;
    className?: string;
    selectedIds: number[];
    onToggle: (id: number) => void;
}

const IndividualSection: React.FC<IndividualSectionProps> = ({
    certifications,
    className = '',
    selectedIds,
    onToggle
}) => {
    // Check if ID is selected
    const isSelected = (id: number) => selectedIds.includes(id);



    return (
        <section className={`w-full ${className}`}>
            {/* OR Separator */}
            <div className="flex items-center justify-center gap-6 mb-8 w-full max-w-md mx-auto">
                <div className="flex-1 h-px bg-[#70AEFF33]"></div>
                <span className="text-gray-400 text-lg font-medium tracking-widest">OR</span>
                <div className="flex-1 h-px bg-[#70AEFF33]"></div>
            </div>

            {/* Main Card Container */}
            <div
                className="relative p-6 sm:p-8"
                style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(180deg, #002A44 35%, #011B2C 100%)',
                    boxShadow: '0 0 30px 0 rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Section Title */}
                <div className="text-center mb-8">
                    <p className="text-gray-400 text-lg mb-2">Choose The Individual Certificates</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        You Need For Your Goal
                    </h2>
                </div>

                {/* Certificates - Horizontal scroll on mobile, grid on larger screens */}
                <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0">
                    {certifications.map((cert) => {
                        const selected = isSelected(cert.skill_id);
                        return (
                            <div
                                key={cert.skill_id}
                                className={`relative overflow-hidden transition-all duration-200 flex-shrink-0 w-[175px] sm:w-auto ${selected
                                    ? 'ring-2 ring-[#7FC241] ring-opacity-70'
                                    : 'hover:ring-1 hover:ring-white/20'
                                    }`}
                                style={{
                                    borderRadius: '12px',
                                    background: '#406AFF1A'
                                }}
                            >
                                {/* Certificate Image - with margins and fade */}
                                <div className="relative px-3 pt-3">
                                    <div className="relative overflow-hidden rounded-t-lg h-[107px] sm:h-[140px]">
                                        <img
                                            src="/assets/cert-demo.png"
                                            alt={cert.certification_name}
                                            className="w-full h-auto object-cover object-top"
                                        />
                                        {/* Fade overlay - bottom fades to card background color */}
                                        <div
                                            className="absolute inset-x-0 bottom-0 h-16"
                                            style={{
                                                background: 'linear-gradient(to top, #1a2f4a 0%, transparent 100%)'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="px-3 pb-3 pt-1">
                                    {/* Short Name */}
                                    <h3 className="text-xs sm:text-base font-bold text-white mt-1 mb-1">
                                        {cert.certification_name_short}
                                    </h3>

                                    {/* Full Certification Name - White 70% opacity */}
                                    <p className="text-white/70 text-[10px] sm:text-xs font-medium mb-2 min-h-[2em] line-clamp-2">
                                        {cert.certification_name}
                                    </p>

                                    {/* Description */}
                                    <p className="text-white text-[10px] sm:text-sm font-normal leading-relaxed mb-4 line-clamp-3">
                                        {cert.skill_description}
                                    </p>

                                    {/* Dotted Separator */}
                                    <div className="border-t border-dashed border-white/20 my-3"></div>

                                    {/* Price & Add Button */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#7FC241] text-sm sm:text-xl font-bold">
                                            ₹1,999
                                        </span>
                                        <button
                                            onClick={() => onToggle(cert.skill_id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${selected
                                                ? 'bg-[#7FC241] text-black'
                                                : 'border border-[#7FC241] text-[#7FC241] hover:bg-[#7FC241]/10'
                                                }`}
                                        >
                                            {selected ? '✓ Added' : '+ Add'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>


            </div>
        </section >
    );
};

export default IndividualSection;
