
import { useState, useEffect } from 'react';
import Button from '../Button';
import CertificateFan from '../CertificateFan';
import ScorecardVisual from './ScorecardVisual';
import RotatingText from '../RotatingText';
import { getUserName, getCTAVariant } from '../../utils/localStorage';
import { getCertificatesByRole } from '../../services/api';
import type { RoleData } from '../../types';

// Import certificate images as fallbacks - Use public paths for proper serving
const fallbackCertificateImages = [
    "/assets/certificateImages/CHRPx.png",
    "/assets/certificateImages/SHRBPx.png", 
    "/assets/certificateImages/PMHRx.png",
    "/assets/certificateImages/PASx.png",
    "/assets/certificateImages/ai-in-hr.png"
];
import { Clock, TrendingUp, Globe } from 'lucide-react';

interface HeroSectionProps {
    onBeginAssessment: () => void;
    isLoading?: boolean;
    ctaRef?: React.Ref<HTMLButtonElement>;
    roleData: RoleData | null;
}

const HeroSection = ({ onBeginAssessment, isLoading = false, ctaRef, roleData }: HeroSectionProps) => {
    const [userName, setUserName] = useState<string | undefined>(undefined);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [, setCertificatesLoading] = useState(true);
    const ctaVariant = getCTAVariant();

    useEffect(() => {
        // Get user's first name from localStorage
        const fullName = getUserName();
        if (fullName) {
            // Extract first name only
            const firstName = fullName.split(' ')[0];
            setUserName(firstName);
        }
    }, []);

    // Fetch certificates when roleData is available
    useEffect(() => {
        const fetchCertificates = async () => {
            if (!roleData?.id) {
                console.log('No roleData.id, using fallback certificates');
                setCertificatesLoading(false);
                return;
            }

            try {
                setCertificatesLoading(true);
                const response = await getCertificatesByRole(roleData.id);
                if (response.result === 'success' && response.data) {
                    console.log('✅ Fetched role certificates:', response.data.length, 'certificates');
                    setCertificates(response.data);
                } else {
                    console.log('No certificates in response, using fallback');
                }
            } catch (error) {
                console.error('Failed to fetch role certificates:', error);
            } finally {
                setCertificatesLoading(false);
            }
        };

        fetchCertificates();
    }, [roleData?.id]);

    // Fallback certificate data (kept as backup)
    // Already defined above as fallbackCertificateImages

    const fallbackCertificateNames = [
        "CHRPx",
        "SHRBPx",
        "PMHRx",
        "PASx",
        "AI in HR"
    ];

    // Use database certificates if available, otherwise use fallback
    const certificateImages = certificates.length > 0 
        ? certificates.map((cert, index) => {
            // Use database URL if available, otherwise fallback to static image
            return cert.preview_image || fallbackCertificateImages[index % fallbackCertificateImages.length];
        })
        : fallbackCertificateImages;

    console.log('📋 Using certificate images:', certificates.length > 0 ? 'Database URLs' : 'Fallback images');

    const certificateNames = certificates.length > 0
        ? certificates.map(cert => cert.short_name || cert.name)
        : fallbackCertificateNames;

    const certificateFullNames = certificates.length > 0
        ? certificates.map(cert => cert.certificate_name || cert.name)
        : fallbackCertificateNames;

    const displayRoleName = roleData?.core_skill || "Your Profession";

    // Default to the static frameworks if none are in the DB or loading
    const rawFrameworks = roleData?.frameworks?.length ? roleData.frameworks : ["CHRPx", "SHRBPx", "PMHRx"];

    // Safely format the frameworks into a readable string (e.g. "CHRPx, SHRBPx, and PMHRx")
    const formattedFrameworks = rawFrameworks.length > 1
        ? `${rawFrameworks.slice(0, -1).join(', ')}, and ${rawFrameworks[rawFrameworks.length - 1]}`
        : rawFrameworks[0] || "";

    return (
        <section className="relative w-full px-4 md:px-6 lg:px-8 pt-2 pb-12 lg:pt-4 lg:pb-20 max-w-7xl mx-auto flex flex-col items-center">
            {/* Main Content */}
            <div className="flex flex-col items-center lg:items-center text-center w-full max-w-4xl z-10">

                <h1 className="text-3xl min-[375px]:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-none mb-3">
                    {userName && <>{userName}, </>}Turn Your {displayRoleName} Experience Into <span className="text-[#98D048]">Global Recognition</span>
                </h1>

                <p className="text-sm md:text-lg text-white/80 mb-3 max-w-xl leading-normal">
                    Get assessed against Global Frameworks like <span className="text-[#98D048] font-bold">{formattedFrameworks}</span> and unlock top opportunities.
                </p>

                <div className="w-full flex justify-center mt-3 mb-8">
                    <CertificateFan
                        className="transform scale-90 origin-center"
                        delay={500}
                        certificateImages={certificateImages}
                        certificateNames={certificateNames}
                        certificateFullNames={certificateFullNames}
                    />
                </div>

                {/* Company Logos - Static 4 */}
                <div className="flex flex-col items-center gap-3 mb-10">
                    <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Recognized by top companies</span>
                    <div className="flex gap-3 min-[360px]:gap-6 md:gap-10 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <img src="/assets/companyLogos/image 2.svg" alt="Company Logo" className="h-5 min-[360px]:h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 3.svg" alt="Company Logo" className="h-5 min-[360px]:h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 4.svg" alt="Company Logo" className="h-5 min-[360px]:h-6 md:h-8 object-contain" />
                        <img src="/assets/companyLogos/image 5.svg" alt="Company Logo" className="h-5 min-[360px]:h-6 md:h-8 object-contain" />
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <Button
                        ref={ctaRef}
                        variant="primary"
                        className={`w-full text-base md:text-lg py-4 px-4 md:px-8 rounded-lg font-bold shadow-[0_0_20px_rgba(152,208,72,0.4)] animate-pulsate-glow hover:scale-105 transition-transform duration-300 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                        onClick={onBeginAssessment}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : `${ctaVariant.ctaText} ->`}
                    </Button>

                    <div className="mt-4 text-center animate-fade-in-up   ">
                        {ctaVariant.useAnimatedSubtext ? (
                            <span className="text-white/60 text-xs min-[360px]:text-sm font-medium flex items-center justify-center gap-2">
                                <RotatingText
                                    messages={[
                                        <span key="1" className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#98D048]" />
                                            <span>Takes less than <span className="text-[#98D048] font-bold">10 mins</span></span>
                                        </span>,
                                        <span key="2" className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-[#98D048]" />
                                            <span>Unlocks <span className="text-[#98D048] font-bold">100% higher salaries</span></span>
                                        </span>,
                                        <span key="3" className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-[#98D048]" />
                                            <span>Based on <span className="text-[#98D048] font-bold">Global Standards</span></span>
                                        </span>
                                    ]}
                                    interval={3000}
                                    className="inline-block min-w-[240px]"
                                />
                            </span>
                        ) : (
                            <span className="text-white/60 text-xs min-[360px]:text-sm font-medium flex items-center justify-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#98D048]" />
                                <span>{ctaVariant.staticSubtext}</span>
                            </span>
                        )}

                        <div className="flex flex-row flex-wrap mt-5 justify-center gap-2 md:gap-3 text-[#38BDF8] text-xs font-medium">
                            <span className="flex items-center gap-1.5 bg-[#002B45]/50 px-3 py-1.5 rounded-full border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                <span>Real-world scenarios</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-[#002B45]/50 px-3 py-1.5 rounded-full border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                    <line x1="18" y1="20" x2="18" y2="10"></line>
                                    <line x1="12" y1="20" x2="12" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="14"></line>
                                </svg>
                                <span>Free instant report</span>
                            </span>
                        </div>

                        {/* Sample Report Preview */}
                        <div className="max-w-md mx-auto mt-10">
                            <p className="text-white/50 text-xs text-center mb-1 uppercase tracking-wider font-medium">Preview Your Results</p>
                            <ScorecardVisual className="transform scale-95 md:scale-100" roleData={roleData} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


export default HeroSection;
