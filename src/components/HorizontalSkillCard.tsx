import React, { useMemo } from 'react';
import { type Certification } from '../constants/certifications';

type BadgeType = 'profile-match' | 'recommended' | 'for-leaders' | 'popular';

interface HorizontalSkillCardProps {
    certification: Certification;
    isSelected: boolean;
    onToggle: (id: string) => void;
    certificateNameShort?: string;
    badgeType?: BadgeType;
    profileMatchPercent?: number;
    roleName?: string;
}

const HorizontalSkillCard: React.FC<HorizontalSkillCardProps> = ({
    certification,
    isSelected,
    onToggle,
    certificateNameShort,
    roleName,
    badgeType = 'recommended',
    profileMatchPercent = 98
}) => {


    // Generate random certified count (consistent per card)
    const certifiedCount = useMemo(() => {
        const count = Math.floor(Math.random() * 5000 + 5000);
        return count > 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
    }, []);

    // Render badge based on type with new gradient styles
    const renderBadge = () => {
        const badgeBaseClasses = "px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg border";

        switch (badgeType) {
            case 'profile-match':
                return (
                    <div className={`${badgeBaseClasses} bg-gradient-to-r from-[#3B5BDB] to-[#1e3a8a] border-[#60a5fa] text-white`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span>{profileMatchPercent}% Profile Match</span>
                    </div>
                );
            case 'recommended':
                return (
                    <div className={`${badgeBaseClasses} bg-gradient-to-r from-[#2D8A4E] to-[#14532d] border-[#4ade80] text-white`}>
                        Recommended
                    </div>
                );
            case 'for-leaders':
                return (
                    <div className={`${badgeBaseClasses} bg-gradient-to-r from-[#C2410C] to-[#7c2d12] border-[#fdba74] text-white`}>
                        For Leaders
                    </div>
                );
            case 'popular':
                return (
                    <div className={`${badgeBaseClasses} bg-gradient-to-r from-[#FFD700] to-[#ca8a04] border-[#fde047] text-[#713f12]`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        Popular
                    </div>
                );
            default:
                return null;
        }
    };

    // Display name - show full certification name
    const fullName = certification.name;

    return (
        <div
            onClick={() => onToggle(certification.id)}
            className={`w-full rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer group ${isSelected
                ? 'border-[#5aa543] ring-1 ring-[#5aa543]/50'
                : 'border-[#1e3a5f] hover:border-[#38BDF8]/50'
                }`}
            style={{
                backgroundColor: 'rgba(64, 106, 255, 0.15)' // #406AFF at 15% opacity
            }}
        >
            <div
                className="p-4 sm:p-5 pb-4"
                style={{
                    background: 'linear-gradient(180deg, #043055 53%, #00243C 100%)'
                }}
            >
                {/* Top Row - Title + Checkbox */}
                <div className="flex items-start justify-between mb-2">
                    {/* Title - Format: ShortName (Bold) - Full Certificate Name (Semi-Bold) */}
                    <div className="pr-4">
                        <h2 className="text-lg sm:text-xl text-white leading-tight">
                            {certificateNameShort ? (
                                <>
                                    <span className="font-bold text-white">{certificateNameShort}</span>
                                    <span className="text-gray-400 mx-2">-</span>
                                    <span className="font-semibold text-gray-200 text-base sm:text-lg">{fullName}</span>
                                </>
                            ) : (
                                <span className="font-bold text-white">{fullName}</span>
                            )}
                        </h2>

                        {/* Badge moved here - below heading */}
                        <div className="mt-2">
                            {renderBadge()}
                        </div>
                    </div>

                    {/* Checkbox Icon (changed from rounded-full to rounded-md) */}
                    <div className={`
                        w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-300
                        ${isSelected
                            ? 'bg-[#5aa543] text-[#001C2C] scale-110 shadow-[0_0_10px_rgba(90,165,67,0.5)]'
                            : 'border-2 border-gray-500 bg-transparent group-hover:border-white/70'
                        }
                    `}>
                        {isSelected && (
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Framework Pills */}
                <div className="mb-4 mt-3 flex flex-wrap gap-2">
                    {certification.frameworks && certification.frameworks.slice(0, 6).map((framework, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-[#406AFF]/10 border border-[#406AFF]/20 rounded-full text-xs text-[#7eb8f6] font-medium"
                        >
                            {framework}
                        </span>
                    ))}
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#043055] flex items-center justify-center border border-[#1e3a5f]">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#7eb8f6]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <span className="text-[#8899a8] text-xs">
                        <span className="text-white font-medium">{certifiedCount}</span> Senior {roleName || (certification.testedSkill ? certification.testedSkill.split(' ')[0] : 'Professional')}'s Certified
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HorizontalSkillCard;
