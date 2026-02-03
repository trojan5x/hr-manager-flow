import React from 'react';
import { type Certification } from '../constants/certifications';

interface CertificationCardProps {
    certification: Certification;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

const CertificationCard: React.FC<CertificationCardProps> = ({
    certification,
    isSelected,
    onToggle
}) => {
    return (
        <div
            className={`
                relative p-6 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                    ? 'border-[#98D048] bg-[#98D048]/10 shadow-[0_0_20px_rgba(152,208,72,0.2)]' 
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }
                backdrop-blur-sm
            `}
        >
            {/* Add/Added Button */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(certification.id);
                    }}
                    className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
                        ${isSelected 
                            ? 'bg-[#98D048] text-[#021019] hover:bg-[#98D048]/90' 
                            : 'bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/50'
                        }
                    `}
                >
                    {isSelected ? (
                        <span className="flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Added
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Add
                        </span>
                    )}
                </button>
            </div>

            {/* Certification Name */}
            <h3 className="text-xl font-bold text-white mb-3 pr-8">
                {certification.name}
            </h3>

            {/* Description */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {certification.description}
            </p>

            {/* Tested Skill */}
            <div className="mb-4">
                <span className="text-[#98D048] text-xs font-medium uppercase tracking-wide">
                    Tested Skill
                </span>
                <p className="text-white text-sm font-medium mt-1">
                    {certification.testedSkill}
                </p>
            </div>

            {/* Global Framework */}
            <div>
                <span className="text-[#98D048] text-xs font-medium uppercase tracking-wide">
                    Global Framework
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                    {certification.frameworks.map((framework, index) => (
                        <span 
                            key={index}
                            className="px-3 py-1 bg-[#406AFF]/20 border border-[#406AFF]/40 rounded-lg text-xs text-white"
                        >
                            {framework}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CertificationCard;
