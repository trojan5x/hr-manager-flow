import React, { useState, useEffect } from 'react';

// Add imports at top
import type { CertificationItem, PackData } from '../../types';
import { CertificateHtmlRenderer } from '../CertificateHtmlRenderer';

// 🧪 TEST FLAG: Set to true to use test pricing (₹1, ₹2, ₹3)
const USE_TEST_PRICING = false;

interface BundleSectionProps {
    bundleName: string;
    role?: string;
    subtitle?: string;

    originalPrice: number;
    discountedPrice: number;
    certifiedCount?: number;
    onGetBundle: (selectedTier?: string, packData?: PackData) => void; // Updated signature
    isLoading?: boolean;
    className?: string;
    certifications?: CertificationItem[];
    skills?: string[];
    userName?: string; // Add userName prop for certificate rendering
}

// Fallback certificate data when no real certificates are available
const getFallbackCertificates = (tier: 'essential' | 'professional' | 'executive', role: string = 'Professional'): CertificationItem[] => {
    const baseCerts: CertificationItem[] = [
        {
            skill_id: 1,
            certification_name: `${role} Certification Level 1`,
            certification_name_short: `${role} L1`,
            skill_description: `Core ${role} Skills`,
            type: 'default',
            order_index: 1,
            certificate_preview_url: '/assets/specialised-cert-empty.png'
        },
        {
            skill_id: 2,
            certification_name: `${role} Certification Level 2`,
            certification_name_short: `${role} L2`,
            skill_description: `Advanced ${role} Skills`,
            type: 'default',
            order_index: 2,
            certificate_preview_url: '/assets/specialised-cert-empty.png'
        }
    ];

    if (tier === 'essential') return baseCerts;

    const aiCert: CertificationItem = {
        skill_id: 5,
        certification_name: `AI for ${role} Certification`,
        certification_name_short: `AI ${role}`,
        skill_description: `AI Applications in ${role}`,
        type: 'ai',
        order_index: 5,
        certificate_preview_url: '/assets/specialised-cert-empty.png'
    };

    if (tier === 'professional') return [...baseCerts, aiCert];

    const additionalCerts: CertificationItem[] = [
        {
            skill_id: 3,
            certification_name: `${role} Strategy Certification`,
            certification_name_short: `${role} Strategy`,
            skill_description: `Strategic ${role} Planning`,
            type: 'secondary',
            order_index: 3,
            certificate_preview_url: '/assets/specialised-cert-empty.png'
        },
        {
            skill_id: 4,
            certification_name: `${role} Analytics Certification`,
            certification_name_short: `${role} Analytics`,
            skill_description: `${role} Data Analytics`,
            type: 'secondary',
            order_index: 4,
            certificate_preview_url: '/assets/specialised-cert-empty.png'
        }
    ];

    return [...baseCerts, ...additionalCerts, aiCert];
};

// Certificate filtering utility functions
const getCertificatesByTier = (tier: 'essential' | 'professional' | 'executive', certifications: CertificationItem[], role: string = 'Professional'): CertificationItem[] => {
    // Sort certificates by order_index to maintain consistent display order
    const sortedCerts = certifications && certifications.length > 0 
        ? [...certifications].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) 
        : [];
        
    // Get fallbacks to fill in missing certificates
    const fallbacks = getFallbackCertificates(tier, role);
    
    // Helper to separate certificates by type. We check 'default' or missing type for primary.
    const isPrimary = (cert: CertificationItem) => cert.type === 'default' || cert.type === 'primary' || !cert.type;
    const isSecondary = (cert: CertificationItem) => cert.type === 'secondary';
    const isAi = (cert: CertificationItem) => cert.type === 'ai';
    
    const realPrimary = sortedCerts.filter(isPrimary);
    const realSecondary = sortedCerts.filter(isSecondary);
    const realAi = sortedCerts.filter(isAi);
    
    const fallbackPrimary = fallbacks.filter(isPrimary);
    const fallbackSecondary = fallbacks.filter(isSecondary);
    const fallbackAi = fallbacks.filter(isAi);

    // Pad real certificates with fallback ones if we don't have enough
    const pad = (real: CertificationItem[], fallback: CertificationItem[], count: number) => {
        const result = real.slice(0, count);
        if (result.length < count) {
            result.push(...fallback.slice(0, count - result.length));
        }
        return result;
    };

    switch (tier) {
        case 'essential':
            // 2 primary/default certificates
            return pad(realPrimary, fallbackPrimary, 2);
        
        case 'professional':
            // 2 primary + 1 AI certificate
            return [
                ...pad(realPrimary, fallbackPrimary, 2),
                ...pad(realAi, fallbackAi, 1)
            ];
        
        case 'executive':
            // 2 primary + 2 secondary + 1 AI certificate
            return [
                ...pad(realPrimary, fallbackPrimary, 2),
                ...pad(realSecondary, fallbackSecondary, 2),
                ...pad(realAi, fallbackAi, 1)
            ];
        
        default:
            return [];
    }
};

// --- New UI Components for Packs ---
const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="8" fill="#7FC241" opacity="0.2" />
        <circle cx="8" cy="8" r="6" fill="#7FC241" />
        <path d="M5 8l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LinkedInIcon = () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="4" fill="#0A66C2" />
        <path d="M3.5 6h2v6.5h-2V6zm1-1.5a1 1 0 110-2 1 1 0 010 2zM7 6h1.9v.9h.03C9.2 6.4 10 5.9 11.2 5.9c2.1 0 2.5 1.4 2.5 3.2v3.4h-2V9.6c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.7v3h-2V6z" fill="white" />
    </svg>
);

const CourseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#4FC3F7" opacity="0.15" />
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="#4FC3F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ResumeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#FACC15" opacity="0.15" />
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ProPlanIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#A855F7" opacity="0.15" />
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PlayIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="#0A66C2" opacity="0.15" />
        <path d="M11 9l9 5-9 5V9z" fill="#0A66C2" />
    </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        width="18" height="18" viewBox="0 0 18 18" fill="none"
        style={{ transition: "transform 0.35s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "block" }}
    >
        <path d="M4 7l5 5 5-5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Badge = ({ label }: { label: string }) => {
    const styles: Record<string, any> = {
        "GOOD START": { color: "#4A90E2", border: "1px solid rgba(74,144,226,0.3)", background: "transparent" },
        "MOST POPULAR": { color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)", background: "transparent" },
        "AI READY": { color: "#7FC241", border: "1px solid rgba(127,194,65,0.3)", background: "transparent" },
    };
    return (
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.08em] uppercase font-sans whitespace-nowrap" style={{
            padding: "4px 8px", borderRadius: 4,
            ...(styles[label] || {})
        }}>{label}</span>
    );
};

const FeaturePill = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(2,28,48,0.6)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
        <div style={{ flexShrink: 0, display: "flex" }}>{icon}</div>
        <span className="text-[12px] sm:text-[13px] font-semibold text-slate-200 font-sans leading-tight">{label}</span>
    </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mt-5 mb-3">
        <div className="w-1.5 h-1.5 bg-[#7FC241] rounded-full"></div>
        <p className="text-sm font-bold text-white tracking-wide uppercase font-sans">
            {children}
        </p>
    </div>
);

const CertRow = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="w-[70px] h-[50px] flex-shrink-0 rounded-md overflow-hidden border border-white/10 shadow-sm">
            <img 
                src="/assets/specialised-cert-empty.png" 
                alt="Certificate Preview"
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
            />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
        </div>
    </div>
);

const CourseRow = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <PlayIcon />
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
        </div>
    </div>
);

const FreeItem = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>{title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{subtitle}</p>
        </div>
    </div>
);

const FreeBox = ({ items }: { items: any[] }) => (
    <div className="mt-5 p-4 rounded-xl relative overflow-hidden bg-[rgba(2,28,48,0.6)] border border-[#7FC241]/20">
        <div className="flex items-center gap-2 mb-4 relative z-10">
            <svg className="w-5 h-5 text-[#7FC241]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <p className="m-0 text-sm font-bold text-[#7FC241] uppercase tracking-wider font-sans">
                Included for Free
            </p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
            {items.map((item, i) => <FreeItem key={i} {...item} />)}
        </div>
    </div>
);

const PriceRow = ({ original, current, title, onBuy, isLoading }: { original: number, current: number, title: string, onBuy?: () => void, isLoading?: boolean }) => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 14, color: "#f87171", textDecoration: "line-through", fontFamily: "'DM Sans', sans-serif" }}>
                ₹{original.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
                ₹{current.toLocaleString("en-IN")}
            </span>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onBuy?.(); }}
            disabled={isLoading}
            className="w-full sm:w-auto font-sans flex-1 sm:flex-none min-w-[200px]"
            style={{
                background: "#7FC241", color: "#000000",
                border: "none", borderRadius: 8,
                padding: "12px 20px",
                fontSize: 15, fontWeight: 800,
                cursor: isLoading ? "not-allowed" : "pointer", 
                letterSpacing: "0.01em",
                boxShadow: "0 2px 12px rgba(127,194,65,0.2)",
                transition: "background 0.15s ease",
                opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#8cd34a")}
            onMouseLeave={e => !isLoading && (e.currentTarget.style.background = "#7FC241")}
        >
            {isLoading ? "Processing..." : `Purchase ${title}`}
        </button>
    </div>
);

const RadioDot = ({ selected }: { selected: boolean }) => (
    <div style={{
        width: 22, height: 22, borderRadius: "50%",
        border: selected ? "2px solid #7FC241" : "2px solid rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.3s ease",
        background: "transparent"
    }}>
        {selected && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7FC241" }} />}
    </div>
);

function PackCard({ 
    id, title, badge, features, certs, courses, freeItems, original, current, 
    selected, expanded, onSelect, onToggle, onBuy, isLoading, packData 
}: any) {
    const isSelected = selected === id;
    const isExpanded = expanded === id;

    // Create a wrapper for onBuy that passes pack data
    const handleBuy = () => {
        if (onBuy && packData) {
            onBuy(id, packData);
        } else if (onBuy) {
            onBuy();
        }
    };

    return (
        <div
            onClick={() => { onSelect(id); }}
            style={{
                background: isSelected ? "rgba(2,28,48,0.95)" : "transparent",
                border: isSelected
                    ? "1px solid #7FC241"
                    : "1px solid rgba(255,255,255,0.1)", // Lighter border for unselected cards
                borderRadius: 12,
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isSelected
                    ? "0 0 0 1px #7FC241, 0 4px 20px rgba(0,0,0,0.4)"
                    : "none",
                position: "relative",
                overflow: "hidden"
            }}
        >
            
            {/* header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <RadioDot selected={isSelected} />
                    <span className="text-xl sm:text-[22px] font-extrabold text-white font-sans leading-tight whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">{title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge label={badge} />
                    <div
                        onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                        style={{ padding: 4, cursor: "pointer", borderRadius: 6, transition: "background 0.15s", display: "flex", alignItems: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                        <ChevronIcon open={isExpanded} />
                    </div>
                </div>
            </div>

            {/* feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                {features.map((f: any, i: number) => <FeaturePill key={i} icon={f.icon} label={f.label} />)}
            </div>

            {/* expandable section */}
            <div style={{
                overflow: "hidden",
                maxHeight: isExpanded ? "2000px" : "0px",
                opacity: isExpanded ? 1 : 0,
                transition: "max-height 0.45s ease, opacity 0.3s ease",
            }}>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 16, paddingTop: 8 }}>
                    {certs?.length > 0 && (
                        <>
                            <SectionLabel>Certificates you get:</SectionLabel>
                            {certs.map((c: any, i: number) => <CertRow key={i} {...c} />)}
                        </>
                    )}
                    {courses?.length > 0 && (
                        <>
                            <SectionLabel>Courses you get:</SectionLabel>
                            {courses.map((c: any, i: number) => <CourseRow key={i} {...c} />)}
                        </>
                    )}
                    {freeItems?.length > 0 && <FreeBox items={freeItems} />}
                </div>
            </div>

            {/* divider + price always visible */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 20 }} />
            <PriceRow original={original} current={current} title={title} onBuy={handleBuy} isLoading={isLoading && isSelected} />
        </div>
    );
}
// --- End New UI Components ---

const BundleSectionV4: React.FC<BundleSectionProps> = ({
    bundleName,
    role,
    subtitle,

    originalPrice: _originalPrice,
    discountedPrice: _discountedPrice,
    onGetBundle,
    isLoading = false,
    className = '',
    certifications = [],
    skills = [],
    userName
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    // 🎯 V4 CRO: Simplified tier selection instead of individual certificates
    const [selectedTier, setSelectedTier] = useState<'essential' | 'professional' | 'executive'>('professional'); // Default to recommended

    // Min distance for swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Next
            setActiveIndex((current) => (current === displayCerts.length - 1 ? 0 : current + 1));
        }
        if (isRightSwipe) {
            // Prev
            setActiveIndex((current) => (current === 0 ? displayCerts.length - 1 : current - 1));
        }
    };

    // Prepare looped certifications for marquee
    const displayCerts = certifications && certifications.length > 0 ? certifications : [{
        skill_id: 0,
        certification_name: "Global Certification",
        certification_name_short: "Global Cert",
        skill_description: "",
        certificate_preview_url: "/assets/specialised-cert-empty.png"
    }];

    // Get certificates for each tier based on type filtering
    const getTierCertificates = (tier: 'essential' | 'professional' | 'executive'): CertificationItem[] => {
        try {
            console.log('Getting certificates for tier:', tier);
            console.log('Available certifications:', certifications);
            
            // Use real certificate data if available
            if (certifications && certifications.length > 0) {
                const filtered = getCertificatesByTier(tier, certifications, role || 'Professional');
                console.log('Filtered certificates:', filtered);
                
                // If filtering returns empty, use fallback
                if (filtered.length > 0) {
                    // Ensure all certificates have required fields
                    const processed = filtered.map(cert => ({
                        ...cert,
                        certification_name: cert.certification_name || `${role || 'Professional'} Certification`,
                        certification_name_short: cert.certification_name_short || cert.certification_name || `${role || 'Pro'} Cert`,
                        certificate_preview_url: cert.certificate_preview_url || '/assets/specialised-cert-empty.png',
                        type: cert.type || 'default',
                        skill_description: cert.skill_description || `Professional ${role || 'Skills'} Certification`
                    }));
                    console.log('Processed certificates:', processed);
                    return processed;
                }
                const fallbacks = getFallbackCertificates(tier, role || 'Professional');
                console.log('Using fallback certificates:', fallbacks);
                return fallbacks;
            }
            // Use fallback data if no real certificates
            const fallbacks = getFallbackCertificates(tier, role || 'Professional');
            console.log('Using fallback certificates (no real data):', fallbacks);
            return fallbacks;
        } catch (error) {
            console.warn('Error getting tier certificates:', error);
            // Return fallback data on any error
            const fallbacks = getFallbackCertificates(tier, role || 'Professional');
            console.log('Using fallback certificates (error):', fallbacks);
            return fallbacks;
        }
    };

    const [expandedTier, setExpandedTier] = useState<string | null>('professional');
    
    // Ensure the default selected tier is also 'professional' if not already set by props/logic
    useEffect(() => {
        if (!selectedTier) {
            setSelectedTier('professional');
        }
    }, [selectedTier, setSelectedTier]);

    // Auto-expand when a card is selected
    useEffect(() => {
        if (selectedTier) {
            setExpandedTier(selectedTier);
        }
    }, [selectedTier]);

    const handleToggle = (id: string) => setExpandedTier(prev => prev === id ? null : id);

    const getTierPricingById = (id: string) => {
        // 🧪 TEST PRICING: Use when testing
        if (USE_TEST_PRICING) {
            switch (id) {
                case 'essential':
                    return { price: 1, original: 3, certificates: 2, bonuses: 1 };
                case 'professional':
                    return { price: 2, original: 6, certificates: 3, bonuses: 2 };
                case 'executive':
                    return { price: 3, original: 9, certificates: 5, bonuses: 4 };
                default:
                    return { price: 2, original: 6, certificates: 3, bonuses: 2 };
            }
        }

        // 💰 PRODUCTION PRICING: Normal pricing
        switch (id) {
            case 'essential':
                return { price: 2999, original: 8999, certificates: 2, bonuses: 1 };
            case 'professional':
                return { price: 4999, original: 18999, certificates: 3, bonuses: 2 };
            case 'executive':
                return { price: 6999, original: 28999, certificates: 5, bonuses: 4 };
            default:
                return { price: 4999, original: 18999, certificates: 3, bonuses: 2 };
        }
    };

    const packsData = [
        {
            id: "essential",
            title: "Core Certifications",
            badge: "GOOD START",
            features: [
                { icon: <CheckIcon />, label: "Verified Certificates" },
                { icon: <LinkedInIcon />, label: "LinkedIn Ready" },
                { icon: <CheckIcon />, label: "Trusted by Recruiters" },
            ],
            certs: getTierCertificates('essential').map(cert => ({
                title: cert.certification_name,
                subtitle: (cert.type === 'default' || cert.type === 'primary' || !cert.type) ? 'Primary Certification' : cert.type === 'ai' ? 'AI Certification' : 'Secondary Certification',
                certItem: cert
            })),
            courses: [
                { title: "Project Management Course", subtitle: `Fully Personalised ${role || 'Professional'} Course` },
            ],
            freeItems: [],
            original: getTierPricingById('essential').original,
            current: getTierPricingById('essential').price,
        },
        {
            id: "professional",
            title: "Professional Pack",
            badge: "MOST POPULAR",
            features: [
                { icon: <CheckIcon />, label: "Verified Certificates" },
                { icon: <LinkedInIcon />, label: "LinkedIn Ready" },
                { icon: <CheckIcon />, label: "Trusted by Recruiters" },
                { icon: <CourseIcon />, label: "Personalised Course" },
                { icon: <ResumeIcon />, label: "Free Resume Enhancer" },
            ],
            certs: getTierCertificates('professional').map(cert => ({
                title: cert.certification_name,
                subtitle: (cert.type === 'default' || cert.type === 'primary' || !cert.type) ? 'Primary Certification' : cert.type === 'ai' ? 'AI Certification' : 'Secondary Certification',
                certItem: cert
            })),
            courses: [
                { title: "Project Management Course", subtitle: `Fully Personalised ${role || 'Professional'} Course` },
            ],
            freeItems: [
                { icon: <ResumeIcon />, title: "Resume Enhancer Tool", subtitle: "Build a job-ready resume in minutes. Included with professional pack for FREE" },
            ],
            original: getTierPricingById('professional').original,
            current: getTierPricingById('professional').price,
        },
        {
            id: "executive",
            title: "Ultimate Pack",
            badge: "AI READY",
            features: [
                { icon: <CheckIcon />, label: "Verified Certificate" },
                { icon: <LinkedInIcon />, label: "LinkedIn Ready" },
                { icon: <CheckIcon />, label: "Trusted by Recruiters" },
                { icon: <CourseIcon />, label: "Personalised Course" },
                { icon: <ResumeIcon />, label: "Free Resume Enhancer" },
                { icon: <ProPlanIcon />, label: "1 Month LearnTube Pro" },
                { icon: <CourseIcon />, label: "AI for Project Managers Course" },
            ],
            certs: getTierCertificates('executive').map(cert => ({
                title: cert.certification_name,
                subtitle: (cert.type === 'default' || cert.type === 'primary' || !cert.type) ? 'Primary Certification' : cert.type === 'ai' ? 'AI Certification' : 'Secondary Certification',
                certItem: cert
            })),
            courses: [
                { title: "Project Management Course", subtitle: `Fully Personalised ${role || 'Professional'} Course` },
                { title: `AI for ${role || 'Project Managers'}`, subtitle: `Fully Personalised ${role || 'Professional'} AI Course` },
            ],
            freeItems: [
                { icon: <ProPlanIcon />, title: "1 Month LearnTube.ai Pro Plan", subtitle: "Access to unlimited free courses and certifications on learntube.ai" },
                { icon: <ResumeIcon />, title: "Resume Enhancer Tool", subtitle: "Build a job-ready resume in minutes. Included with professional pack for FREE" },
            ],
            original: getTierPricingById('executive').original,
            current: getTierPricingById('executive').price,
        },
    ];

    return (
        <>
            <section id="claim-certificates-section" className={`w-full ${className}`}>

                {/* Section Title - Enhanced with Personalized Course */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Get Your <span className="text-[#7FC241]">Global {role || 'Professional'}</span> Certificates
                    </h2>
                </div>

                {/* Bundle Card */}
                <div
                    className="relative p-4 sm:p-5 overflow-hidden"
                    style={{
                        border: '1px solid transparent',
                        borderRadius: '12px',
                        background: `
                        linear-gradient(180deg, #002A44 35%, #011B2C 100%) padding-box,
                        linear-gradient(180deg, #2674D3 0%, #133C6D 100%) border-box
                    `,
                        boxShadow: '0 0 30px 0 rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {/* Desktop: 2-Column Layout / Mobile: Stacked */}
                    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 mt-0 mb-6 w-full gap-6">

                        {/* Left Side: Images */}
                        <div className="w-full lg:col-span-5 relative flex flex-col items-center justify-start">
                            {/* Certificate Carousel */}
                            <div className="relative w-full flex flex-col items-center">
                                <div
                                    className="grid grid-cols-1 w-full touch-pan-y"
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                >
                                    {displayCerts.map((cert, index) => (
                                        <div
                                            key={`${cert.skill_id}-${index}`}
                                            className={`col-start-1 row-start-1 w-full flex items-center justify-center transition-all duration-500 ease-in-out ${index === activeIndex
                                                ? 'opacity-100 z-10 scale-100'
                                                : 'opacity-0 z-0 scale-95 pointer-events-none'
                                                }`}
                                        >
                                            <div className="relative w-full flex justify-center mt-2">
                                                {/* Preview Label */}
                                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                                                    <span className="bg-black/50 backdrop-blur-md text-white/90 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#D4AF37] shadow-lg whitespace-nowrap">
                                                        {bundleName || `Executive ${role} Bundle`}
                                                    </span>
                                                </div>

                                                <div className="relative w-full overflow-hidden border border-[#D4AF37]">
                                                    <CertificateHtmlRenderer
                                                        certificate={cert}
                                                        userName={userName}
                                                        className="w-full h-auto drop-shadow-2xl"
                                                    />

                                                    {/* Watermark overlay */}
                                                    {/* Watermark overlay */}


                                                    {/* Name & Gradient Overlay */}
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 pt-12 pb-4 px-4 z-20 flex items-end justify-center text-center pointer-events-none"
                                                        style={{
                                                            background: 'linear-gradient(0deg, rgba(0, 36, 59, 1) 37%, rgba(87, 199, 133, 0) 78%, rgba(237, 221, 83, 0) 100%)'
                                                        }}
                                                    >
                                                        <p className="text-white font-bold text-sm sm:text-base drop-shadow-md leading-tight">
                                                            {cert.certification_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Dots */}
                                {displayCerts.length > 1 && (
                                    <div className="flex items-center gap-2 mt-4 z-10">
                                        {displayCerts.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveIndex(idx)}
                                                className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex
                                                    ? 'w-8 bg-[#7FC241]'
                                                    : 'w-2 bg-white/20 hover:bg-white/40'
                                                    }`}
                                                aria-label={`View certificate ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Info & Actions */}
                        <div className="w-full lg:col-span-7 flex flex-col gap-3">

                            {/* Info Header */}
                            <div className="w-full flex flex-col justify-center text-center lg:text-left px-4 lg:px-0">
                                {/* Subtitle */}
                                {subtitle && (
                                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
                                        {subtitle}
                                    </p>
                                )}

                                {/* Skills / Benefits List */}
                                {skills && skills.length > 0 && (
                                    <ul className="flex flex-col gap-1.5 mt-3 max-w-xl mx-auto lg:mx-0">
                                        {skills.map((skill, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300 text-left">
                                                <svg className="w-4 h-4 text-[#7FC241] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="leading-tight">{skill}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* NEW PACK SELECTION UI */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {packsData.map(pack => (
                                    <PackCard
                                        key={pack.id}
                                        {...pack}
                                        selected={selectedTier}
                                        expanded={expandedTier}
                                        onSelect={(id: any) => setSelectedTier(id)}
                                        onToggle={handleToggle}
                                        onBuy={onGetBundle}
                                        isLoading={isLoading}
                                        packData={pack}
                                    />
                                ))}
                            </div>


                        </div>
                    </div>
                </div >

                {/* Stats / Value Props Section - Outside bundle card */}
                <div className="w-full mt-8 mb-4 max-w-4xl mx-auto">
                    <h4 className="text-lg font-bold text-white text-center mb-6">
                        How Our Certificates Help:
                    </h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {/* Stat 1: LinkedIn & CV */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#7FC241]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#7FC241]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">42% Boost</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    In LinkedIn & CV Value
                                </span>
                            </div>
                        </div>

                        {/* Stat 2: Recruiter Attention */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#4FC3F7]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#4FC3F7]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#4FC3F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">2x More</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    Attention By Recruiters
                                </span>
                            </div>
                        </div>

                        {/* Stat 3: Interview Chance */}
                        <div className="relative group p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 bg-[#021C30]/50 border border-white/10 hover:border-[#FFD700]/50 hover:bg-[#021C30]/80">
                            <div className="p-3 bg-white/5 rounded-full group-hover:bg-[#FFD700]/20 transition-colors">
                                <svg className="w-6 h-6 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-center">
                                <span className="text-base sm:text-xl font-bold text-white mb-0.5">53% Higher</span>
                                <span className="text-[10px] sm:text-sm text-gray-400 font-medium leading-tight">
                                    Chance Of Interviews
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Bottom Bar - Disabled: Using global sticky bar in ResultsPageV3 instead */}
            {/* <div
                className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    background: 'linear-gradient(180deg, #002A44 0%, #011B2C 100%)',
                    borderTop: '1px solid rgba(127, 194, 65, 0.3)',
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-end  gap-2 sm:gap-3">
                        <div className="flex flex-col items-baseline gap-1">
                            <span className="text-[#FF7262] line-through text-xs sm:text-sm">
                                ₹<NumberTicker value={originalPrice} />
                            </span>
                            <span className="text-[#7FC241] text-lg sm:text-2xl font-bold leading-none ">
                                ₹<NumberTicker value={discountedPrice} />
                            </span>

                        </div>
                        <span className="bg-[#7FC241]/20 text-[#7FC241] text-[9px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <NumberTicker value={discountPercent} />% OFF
                        </span>
                    </div>

                    <button
                        onClick={onGetBundle}
                        disabled={isLoading}
                        className={`bg-[#7FC241] hover:bg-[#68A335] text-black font-bold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group whitespace-nowrap ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="hidden sm:inline">Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>
                                    {selectedIds.length > 1 ? `Get ${selectedIds.length} Certs` : 'Get Certificate'}
                                </span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div> */}
        </>
    );
};

export default BundleSectionV4;
