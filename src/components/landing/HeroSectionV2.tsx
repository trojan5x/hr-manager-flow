
import { useState, useEffect } from 'react';
import Button from '../Button';
import CertificateFan from '../CertificateFan';
import ScorecardVisual from './ScorecardVisual';
import { getCertificatesByRole } from '../../services/api';

// Import certificate images as fallbacks
import pmpxBasic from '../../assets/certificateImages/pmpx-basic.png';
import pmpxAdvanced from '../../assets/certificateImages/pmpx-advanced.png';
import pscrumx from '../../assets/certificateImages/pscrumx.png';
import prince2x from '../../assets/certificateImages/prince2x.png';
import aiInPm from '../../assets/certificateImages/ai-in-pm.png';

import type { RoleData } from '../../types';

interface HeroSectionProps {
    onBeginAssessment: () => void;
    isLoading?: boolean;
    roleData?: RoleData | null;
}

const HeroSectionV2 = ({ onBeginAssessment, isLoading = false, roleData = null }: HeroSectionProps) => {
    const [certificates, setCertificates] = useState<any[]>([]);
    const [, setCertificatesLoading] = useState(true);

    // Fetch certificates when roleData is available
    useEffect(() => {
        const fetchCertificates = async () => {
            if (!roleData?.id) {
                setCertificatesLoading(false);
                return;
            }

            try {
                setCertificatesLoading(true);
                const response = await getCertificatesByRole(roleData.id);
                if (response.result === 'success' && response.data) {
                    setCertificates(response.data);
                    console.log('Fetched role certificates for V2:', response.data);
                }
            } catch (error) {
                console.error('Failed to fetch role certificates for V2:', error);
            } finally {
                setCertificatesLoading(false);
            }
        };

        fetchCertificates();
    }, [roleData?.id]);

    // Fallback certificate data
    const fallbackCertificateImages = [
        pmpxBasic,
        pmpxAdvanced,
        pscrumx,
        prince2x,
        aiInPm
    ];

    const fallbackCertificateNames = [
        "CHRPx",
        "SHRBPx",
        "PMHRx",
        "PASx",
        "AI in HR"
    ];

    // Use database certificates if available, otherwise use fallback
    const certificateImages = certificates.length > 0 
        ? certificates.map(cert => cert.preview_image || fallbackCertificateImages[0])
        : fallbackCertificateImages;

    const certificateNames = certificates.length > 0
        ? certificates.map(cert => cert.short_name || cert.name)
        : fallbackCertificateNames;

    const certificateFullNames = certificates.length > 0
        ? certificates.map(cert => cert.certificate_name || cert.name)
        : fallbackCertificateNames;

    return (
        <section className="relative w-full px-6 md:px-8 lg:px-12 pt-6 pb-12 lg:pt-10 lg:pb-20 max-w-7xl mx-auto flex flex-col items-center">
            {/* Main Content */}
            <div className="flex flex-col items-center lg:items-center text-center max-w-5xl z-10 mx-20">

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                    Prove You Are in the <span className="text-[#98D048]">Top 10% in {roleData?.core_skill || "Your Profession"}</span> & Unlock Your <span className="text-[#38BDF8]">True Market Value</span>
                </h1>

                <p className="text-lg md:text-xl text-white/80 mb-3 max-w-2xl leading-relaxed">
                    Don't let ATS filters delete your career. Validate your seniority against <span className="text-white font-bold">Global Professional standards</span> in 3 steps.
                </p>

                {/* Visuals Area - Certificates + Scorecard */}
                <div className="w-full flex flex-col md:flex-row justify-center items-center gap-8 mt-6 mb-10 overflow-hidden max-w-full">
                    <div className="transform scale-90 md:scale-100 origin-center w-full max-w-[500px]">
                        <CertificateFan
                            delay={500}
                            certificateImages={certificateImages}
                            certificateNames={certificateNames}
                            certificateFullNames={certificateFullNames}
                            userFirstName="YOUR"
                            userLastName="NAME HERE"
                        />
                    </div>

                    {/* Arrow or connector on large screens? Optional but keeps it clean to just spaced */}

                    <div className="relative w-full max-w-md">
                        <ScorecardVisual className="transform scale-90 md:scale-100 origin-center bg-[#00141F]/80 backdrop-blur-sm" roleData={roleData} />
                    </div>
                </div>

                <div className="flex flex-row flex-nowrap justify-center gap-3 md:gap-6 mb-8 text-[#38BDF8] text-sm font-medium tracking-wide w-full">
                    <span className="flex items-center gap-2 bg-[#002B45] px-3 md:px-4 py-2 rounded-full border border-white/10 shadow-sm hover:border-[#38BDF8]/30 transition-colors duration-300 whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>3-Minute Skills Audit</span>
                    </span>
                    <span className="flex items-center gap-2 bg-[#002B45] px-3 md:px-4 py-2 rounded-full border border-white/10 shadow-sm hover:border-[#38BDF8]/30 transition-colors duration-300 whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span>Instant Pre-Assessment</span>
                    </span>
                </div>

                {/* Company Logos - Static 4 */}
                <div className="flex flex-col items-center gap-3 mb-10">
                    <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Recognized by top companies</span>
                    <div className="flex gap-6 md:gap-10 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <img src="/assets/companyLogos/image 2.svg" alt="Company Logo" className="h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 3.svg" alt="Company Logo" className="h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 4.svg" alt="Company Logo" className="h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 5.svg" alt="Company Logo" className="h-6 md:h-8 object-contain" />
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto relative group">
                    {/* Social Proof Badge near CTA */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="text-white/70 text-xs md:text-sm font-medium bg-[#002B45]/80 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                            ⭐ 1,200+ Senior Professionals Verified
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        className={`w-full text-sm min-[375px]:text-base md:text-lg py-4 px-4 min-[375px]:px-6 md:px-8 rounded-lg font-bold shadow-[0_0_20px_rgba(152,208,72,0.4)] animate-pulsate-glow hover:scale-105 transition-transform duration-300 whitespace-nowrap ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                        onClick={onBeginAssessment}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Check My Salary Eligibility →'}
                    </Button>

                    <div className="mt-4 text-center animate-fade-in-up">
                        <span className="text-white/60 text-sm font-medium flex items-center justify-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#98D048] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#98D048]"></span>
                            </span>
                            Unlock upto 100% higher salaries
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};


export default HeroSectionV2;
