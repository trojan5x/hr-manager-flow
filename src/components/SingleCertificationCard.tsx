import React from 'react';
import type { CertificationItem } from '../services/api';

interface SingleCertificationCardProps {
    certification: CertificationItem;
    isSelected: boolean;
    onToggle: () => void;
    price: number;
}

const SingleCertificationCard: React.FC<SingleCertificationCardProps> = ({
    certification,
    isSelected,
    onToggle,
    price
}) => {
    return (
        <div
            onClick={onToggle}
            className={`
                relative p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col h-full
                ${isSelected
                    ? 'bg-[#002A44] border-2 border-[#7FC241] shadow-[0_0_20px_rgba(127,194,65,0.2)]'
                    : 'bg-[#001C2C] border border-white/10 hover:border-white/20 hover:bg-[#002236]'}
            `}
        >
            {/* Selection Circle */}
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#7FC241] bg-[#7FC241]' : 'border-gray-500 bg-transparent'
                }`}>
                {isSelected && (
                    <svg className="w-4 h-4 text-[#001C2C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>

            {/* Certificate Image Placeholder/Preview */}
            <div className={`w-full aspect-[4/3] bg-white/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-white/5 ${certification.certificate_preview_url ? '' : 'p-2'}`}>
                {certification.certificate_preview_url ? (
                    <img
                        src={certification.certificate_preview_url}
                        alt={certification.certification_name}
                        className="w-full h-full object-cover sm:object-contain transition-transform duration-500 hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-[#001C2C] flex flex-col items-center justify-center p-4 text-center border border-white/10 group-hover:border-[#7FC241]/30 transition-colors">
                        <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                            Preview Not Available
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white leading-tight">
                        {certification.certification_name_short || certification.certification_name}
                    </h3>
                    {certification.certification_name_short && certification.certification_name !== certification.certification_name_short && (
                        <p className="text-gray-400 text-sm mt-1">
                            {certification.certification_name}
                        </p>
                    )}
                </div>

                {/* Skill Section */}
                <div className="mb-3">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">SKILL</p>
                    <p className="text-white font-medium text-sm">
                        {certification.certification_name.replace('Certified ', '').replace(' Specialist', '').replace(' Professional', '')}
                    </p>
                </div>

                {/* Frameworks or Description */}
                <div className="mb-4 flex-1">
                    {certification.frameworks && certification.frameworks.length > 0 ? (
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">FRAMEWORKS</p>
                            <div className="flex flex-wrap gap-2">
                                {certification.frameworks.slice(0, 4).map((fw, idx) => (
                                    <span key={idx} className="bg-white/10 text-white text-[10px] px-2 py-1 rounded border border-white/5">
                                        {fw}
                                    </span>
                                ))}
                                {certification.frameworks.length > 4 && (
                                    <span className="text-gray-500 text-[10px] px-1 py-1">+ {certification.frameworks.length - 4}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                            {certification.skill_description}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10 w-full my-3"></div>

                {/* Price and Action */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="text-white font-bold text-lg">
                        ₹{price.toLocaleString()}
                    </div>
                    <button
                        className={`
                            px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors
                            ${isSelected
                                ? 'bg-[#7FC241] text-[#001C2C]'
                                : 'text-gray-400 hover:text-white'}
                        `}
                    >
                        {isSelected ? 'ADDED' : 'ADD'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SingleCertificationCard;
