import React from 'react';
import { type Certification } from '../constants/certifications';
import type { CertificationItem } from '../types';
import { CertificateHtmlRenderer } from './CertificateHtmlRenderer';

interface CertificatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    certification?: Certification | null; // Legacy support
    certificationItem?: CertificationItem | null; // New support
    userName?: string; // For HTML rendering
}

const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
    isOpen,
    onClose,
    certification,
    certificationItem,
    userName
}) => {
    if (!isOpen || (!certification && !certificationItem)) return null;

    // Generate certificate image URL based on certification id
    const getCertificateImageUrl = (certId: string) => {
        return `/certificates/${certId}-certificate.png`;
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClick}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 text-white hover:text-gray-200"
            >
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {/* Certificate Image Container */}
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center animate-fade-in-up">
                {/* Use HTML rendering if we have a CertificationItem */}
                {certificationItem ? (
                    <div className="max-w-4xl w-full" style={{ maxHeight: '95vh' }}>
                        <CertificateHtmlRenderer
                            certificate={certificationItem}
                            userName={userName}
                            className="w-full h-auto rounded-lg shadow-2xl"
                        />
                    </div>
                ) : certification ? (
                    <>
                        <img
                            src={getCertificateImageUrl(certification.id)}
                            alt={`${certification.name} Certificate Preview`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onError={(e) => {
                                // Fallback to a generated certificate if image doesn't exist
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        
                        {/* Fallback Certificate Design */}
                        <div 
                            className="hidden max-w-4xl bg-[#FFFEF0] rounded-lg shadow-2xl"
                            style={{ aspectRatio: '16/11', maxHeight: '95vh' }}
                        >
                            <div className="w-full h-full p-8 md:p-12 flex flex-col items-center justify-center text-center relative">
                                {/* Decorative Border */}
                                <div className="absolute inset-4 border-4 border-double border-[#0A1628]/20 rounded-lg"></div>
                                
                                {/* Certificate Content */}
                                <div className="relative z-10 space-y-4">
                                    <div className="text-[#0A1628] text-xl md:text-2xl font-bold mb-2">
                                        CERTIFICATE OF ACHIEVEMENT
                                    </div>
                                    
                                    <div className="text-[#666] text-sm md:text-base mb-6 max-w-2xl mx-auto leading-relaxed">
                                        This certifies that the recipient has successfully completed 
                                        the required coursework and assessments
                                    </div>
                                    
                                    <div className="text-[#0A1628] text-2xl md:text-3xl font-bold mb-6 border-b-2 border-[#0A1628] pb-2 inline-block">
                                        [RECIPIENT NAME]
                                    </div>
                                    
                                    <div className="text-[#666] text-sm md:text-base mb-6 max-w-2xl mx-auto leading-relaxed">
                                        has demonstrated mastery in <strong className="text-[#0A1628]">{certification.testedSkill}</strong> 
                                        and the skills and competencies outlined in the <strong className="text-[#0A1628]">{certification.name}</strong> certification program
                                    </div>
                                    
                                    <div className="flex justify-between items-end w-full max-w-2xl mx-auto mt-8">
                                        <div className="text-center">
                                            <div className="border-t-2 border-[#0A1628] w-32 mb-1"></div>
                                            <div className="text-[#666] text-xs">Date</div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-[#0A1628]/10 rounded-full flex items-center justify-center mb-2">
                                                <div className="text-[#0A1628] text-xs font-bold">SEAL</div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className="border-t-2 border-[#0A1628] w-32 mb-1"></div>
                                            <div className="text-[#666] text-xs">Authorized Signature</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default CertificatePreviewModal;
