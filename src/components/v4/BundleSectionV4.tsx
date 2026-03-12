import React, { useState, useEffect } from 'react';

// Add imports at top
import type { CertificationItem, PackData } from '../../types';
import { CertificateHtmlRenderer } from '../CertificateHtmlRenderer';
import { 
    CheckCircle2, 
    Linkedin, 
    BookOpen, 
    FileText, 
    Zap, 
    Award, 
    Brain,
    Play,
    Plus
} from 'lucide-react';

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
const getFallbackCertificates = (tier: 'essential' | 'professional' | 'executive' | 'ai-ready', role: string = 'Professional'): CertificationItem[] => {
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

    const aiCert: CertificationItem = {
        skill_id: 5,
        certification_name: `AI for ${role} Certification`,
        certification_name_short: `AI ${role}`,
        skill_description: `AI Applications in ${role}`,
        type: 'ai',
        order_index: 5,
        certificate_preview_url: '/assets/specialised-cert-empty.png'
    };

    if (tier === 'essential') return baseCerts;
    if (tier === 'ai-ready') return [aiCert];

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
const getCertificatesByTier = (tier: 'essential' | 'professional' | 'executive' | 'ai-ready', certifications: CertificationItem[], role: string = 'Professional'): CertificationItem[] => {
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
            // 2 primary + 2 secondary certificates
            return [
                ...pad(realPrimary, fallbackPrimary, 2),
                ...pad(realSecondary, fallbackSecondary, 2)
            ];
        
        case 'executive':
            // 2 primary + 2 secondary + 1 AI certificate
            return [
                ...pad(realPrimary, fallbackPrimary, 2),
                ...pad(realSecondary, fallbackSecondary, 2),
                ...pad(realAi, fallbackAi, 1)
            ];

        case 'ai-ready':
            // 2 core certificates + 1 AI certificate
            return [
                ...pad(realPrimary, fallbackPrimary, 2),
                ...pad(realAi, fallbackAi, 1)
            ];
        
        default:
            return [];
    }
};

// --- Updated Lucide React Icons ---
const CheckIcon = () => (
    <div className="w-4 h-4 text-green-500">
        <CheckCircle2 size={16} />
    </div>
);

const LinkedInIcon = () => (
    <div className="w-4 h-4 text-blue-600">
        <Linkedin size={16} />
    </div>
);

const CourseIcon = () => (
    <div className="w-4 h-4 text-blue-500">
        <BookOpen size={16} />
    </div>
);

const ResumeIcon = () => (
    <div className="w-4 h-4 text-yellow-500">
        <FileText size={16} />
    </div>
);

const ProPlanIcon = () => (
    <div className="w-4 h-4 text-purple-500">
        <Zap size={16} />
    </div>
);

const TrustedIcon = () => (
    <div className="w-4 h-4 text-green-600">
        <Award size={16} />
    </div>
);

const AIIcon = () => (
    <div className="w-4 h-4 text-red-500">
        <Brain size={16} />
    </div>
);

const PlayIcon = () => (
    <div className="w-6 h-6 text-blue-600">
        <Play size={24} fill="currentColor" />
    </div>
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
        "CORE": { 
            color: "#60A5FA", 
            border: "1px solid rgba(74,144,226,0.6)", 
            background: "rgba(74,144,226,0.2)" 
        },
        "RECOMMENDED": { 
            color: "#60A5FA", 
            border: "1px solid rgba(59,130,246,0.6)", 
            background: "rgba(59,130,246,0.2)" 
        },
        "ALL IN ONE": { 
            color: "#C084FC", 
            border: "1px solid rgba(168,85,247,0.6)", 
            background: "rgba(168,85,247,0.2)" 
        },
        "AI READY": { 
            color: "#F472B6", 
            border: "1px solid rgba(236,72,153,0.6)", 
            background: "rgba(236,72,153,0.2)" 
        },
    };
    return (
        <span 
            className="text-[10px] font-bold tracking-[0.08em] uppercase font-sans whitespace-nowrap px-2 py-1 rounded-md" 
            style={{
                ...(styles[label] || {}),
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
        >
            {label}
        </span>
    );
};

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

const RadioDot = ({ selected, tier }: { selected: boolean, tier?: string }) => {
    const getRadioColor = (tier?: string) => {
        const colors = {
            essential: '#4A90E2',     // Light blue
            professional: '#3B82F6',  // Brighter blue for contrast against dark blue card
            executive: '#A855F7',      // Purple
            'ai-ready': '#EC4899'     // Pink/magenta for AI
        };
        return colors[tier as keyof typeof colors] || '#7FC241';
    };

    const radioColor = getRadioColor(tier);

    return (
        <div style={{
            width: 22, height: 22, borderRadius: "50%",
            border: selected ? `2px solid ${radioColor}` : "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.3s ease",
            background: "transparent"
        }}>
            {selected && <div style={{ width: 12, height: 12, borderRadius: "50%", background: radioColor }} />}
        </div>
    );
};

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

    // Pack descriptions
    const getPackDescription = (packId: string) => {
        switch (packId) {
            case 'essential':
                return 'Start your certification journey with industry-recognized credentials';
            case 'professional':
                return 'Level up with AI skills, bonus tools, and comprehensive training';
            case 'executive':
                return 'Master advanced skills with premium features and exclusive perks';
            case 'ai-ready':
                return 'Core certifications plus specialized AI training for future readiness';
            default:
                return 'Complete certification package with comprehensive training';
        }
    };

    // Get tier-specific gradients
    const getTierGradients = (packId: string, selected: boolean) => {
        const gradients = {
            essential: {
                background: selected 
                    ? `linear-gradient(135deg, rgba(16, 71, 125, 0.95) 0%, rgba(8, 41, 74, 0.95) 100%) padding-box,
                       linear-gradient(135deg, #4A90E2 0%, #2563EB 100%) border-box`
                    : `linear-gradient(135deg, rgba(16, 71, 125, 0.4) 0%, rgba(8, 41, 74, 0.6) 100%) padding-box,
                       linear-gradient(135deg, rgba(74, 144, 226, 0.6) 0%, rgba(37, 99, 235, 0.4) 100%) border-box`,
                shadow: selected 
                    ? '0 0 25px rgba(74, 144, 226, 0.4), 0 8px 25px rgba(0,0,0,0.3)'
                    : '0 4px 15px rgba(74, 144, 226, 0.15)'
            },
            professional: {
                background: selected 
                    ? `linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(15, 35, 87, 0.95) 100%) padding-box,
                       linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%) border-box`
                    : `linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 35, 87, 0.6) 100%) padding-box,
                       linear-gradient(135deg, rgba(30, 58, 138, 0.6) 0%, rgba(30, 64, 175, 0.4) 100%) border-box`,
                shadow: selected 
                    ? '0 0 25px rgba(30, 58, 138, 0.4), 0 8px 25px rgba(0,0,0,0.3)'
                    : '0 4px 15px rgba(30, 58, 138, 0.15)'
            },
            executive: {
                background: selected 
                    ? `linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(59, 7, 100, 0.95) 100%) padding-box,
                       linear-gradient(135deg, #A855F7 0%, #7C3AED 100%) border-box`
                    : `linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(59, 7, 100, 0.6) 100%) padding-box,
                       linear-gradient(135deg, rgba(168, 85, 247, 0.6) 0%, rgba(124, 58, 237, 0.4) 100%) border-box`,
                shadow: selected 
                    ? '0 0 25px rgba(168, 85, 247, 0.4), 0 8px 25px rgba(0,0,0,0.3)'
                    : '0 4px 15px rgba(168, 85, 247, 0.15)'
            },
            'ai-ready': {
                background: selected 
                    ? `linear-gradient(135deg, rgba(190, 24, 93, 0.95) 0%, rgba(136, 19, 55, 0.95) 100%) padding-box,
                       linear-gradient(135deg, #EC4899 0%, #BE185D 100%) border-box`
                    : `linear-gradient(135deg, rgba(190, 24, 93, 0.5) 0%, rgba(136, 19, 55, 0.7) 100%) padding-box,
                       linear-gradient(135deg, rgba(236, 72, 153, 0.7) 0%, rgba(190, 24, 93, 0.5) 100%) border-box`,
                shadow: selected 
                    ? '0 0 25px rgba(236, 72, 153, 0.4), 0 8px 25px rgba(0,0,0,0.3)'
                    : '0 4px 15px rgba(236, 72, 153, 0.15)'
            }
        };

        return gradients[packId as keyof typeof gradients] || gradients.professional;
    };

    const tierStyle = getTierGradients(id, isSelected);

    // Handle card click - first align, then select and expand
    const handleCardClick = () => {
        onSelect(id);
        if (!isExpanded) {
            // First scroll to align card with top of screen (with 16px offset)
            const cardElement = document.querySelector(`[data-pack-id="${id}"]`);
            if (cardElement) {
                const elementRect = cardElement.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const targetScrollPosition = absoluteElementTop - 16; // 16px from top
                
                window.scrollTo({
                    top: targetScrollPosition,
                    behavior: 'smooth'
                });
                
                // Then expand after scroll animation
                setTimeout(() => {
                    onToggle(id);
                }, 300); // Wait for scroll to complete
            } else {
                // Fallback if element not found
                onToggle(id);
            }
        }
    };

    // Handle chevron click - first align, then toggle expansion
    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // If expanding, scroll first then expand
        if (!isExpanded) {
            const cardElement = document.querySelector(`[data-pack-id="${id}"]`);
            if (cardElement) {
                const elementRect = cardElement.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const targetScrollPosition = absoluteElementTop - 16; // 16px from top
                
                window.scrollTo({
                    top: targetScrollPosition,
                    behavior: 'smooth'
                });
                
                // Then expand after scroll animation
                setTimeout(() => {
                    onToggle(id);
                }, 300); // Wait for scroll to complete
            } else {
                // Fallback if element not found
                onToggle(id);
            }
        } else {
            // If collapsing, just toggle immediately
            onToggle(id);
        }
    };

    return (
        <div
            className="relative cursor-pointer transition-all duration-300 ease-in-out"
            onClick={handleCardClick}
            data-pack-id={id}
            style={{
                border: '1px solid transparent',
                borderRadius: '12px',
                background: tierStyle.background,
                boxShadow: tierStyle.shadow,
                padding: '20px',
                overflow: 'hidden',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0px)',
            }}
        >
            {/* Header Row: Radio + Title + Collapse Button */}
            <div className="flex items-center justify-between mb-2 gap-3">
                <div className="flex items-center gap-3">
                    <RadioDot selected={isSelected} tier={id} />
                    <span className="text-lg sm:text-xl font-bold text-white font-sans leading-tight">
                        {title}
                    </span>
                </div>
                <div
                    onClick={handleChevronClick}
                    className="p-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer flex-shrink-0"
                >
                    <ChevronIcon open={isExpanded} />
                </div>
            </div>

            {/* Badge Row - Completely left aligned */}
            <div className="mb-3">
                <Badge label={badge} />
            </div>

            {/* Pack Description with Progressive Indicator */}
            <div className="mb-4">
                {packData.isProgressive && packData.basePackage ? (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Everything from</span>
                        <span className="text-white font-medium">{packData.basePackage} Pack</span>
                        <span className="text-gray-400">+</span>
                    </div>
                ) : (
                    <p className="text-gray-300 text-sm font-medium">
                        {getPackDescription(id)}
                    </p>
                )}
            </div>

            {/* Feature Pills - Show different amounts based on package tier */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(() => {
                    // Show different number of features based on package value
                    let maxFeatures;
                    switch (id) {
                        case 'essential':
                            maxFeatures = 4; // Show all for Essential (base package)
                            break;
                        case 'professional':
                            maxFeatures = features.length; // Show all new additions
                            break;
                        case 'executive':
                            maxFeatures = features.length; // Show all new additions  
                            break;
                        case 'ai-ready':
                            maxFeatures = features.length; // Show all new additions
                            break;
                        default:
                            maxFeatures = 4;
                    }
                    
                    const visibleFeatures = features.slice(0, maxFeatures);
                    const hiddenCount = features.length - maxFeatures;
                    
                    return (
                        <>
                            {visibleFeatures.map((f: any, i: number) => (
                                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    id === 'ai-ready' 
                                        ? 'bg-white/15 border border-white/30 text-white' 
                                        : 'bg-white/10 border border-white/20 text-gray-200'
                                }`}>
                                    {packData.isProgressive ? (
                                        <Plus size={12} className="text-white flex-shrink-0" strokeWidth={2.5} />
                                    ) : null}
                                    <div className="flex-shrink-0 w-4 h-4">
                                        {f.icon}
                                    </div>
                                    <span className="whitespace-nowrap">{f.label}</span>
                                </div>
                            ))}
                            {hiddenCount > 0 && (
                                <div className="flex items-center px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-gray-200">
                                    +{hiddenCount} more
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>

            {/* Divider Line */}
            <div className="border-t border-white/20 my-4"></div>

            {/* Pricing */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-red-400 line-through text-sm font-medium">
                        ₹{original.toLocaleString("en-IN")}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white">
                        ₹{current.toLocaleString("en-IN")}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-300">You save</div>
                    <div className="text-green-400 font-bold text-sm">
                        ₹{(original - current).toLocaleString("en-IN")}
                    </div>
                </div>
            </div>

            {/* Purchase Button */}
            <button
                onClick={(e) => { e.stopPropagation(); handleBuy(); }}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                    isLoading 
                        ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                        : 'bg-[#7FC241] hover:bg-[#8cd34a] text-black shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
            >
                {isLoading ? 'Processing...' : `Get ${title}`}
            </button>

            {/* Expandable Section - Detailed Content */}
            <div 
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                    maxHeight: isExpanded ? "2000px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                }}
            >
                <div className="border-t border-white/20 mt-6 pt-6">
                    {certs?.length > 0 && (
                        <div className="mb-6">
                            <SectionLabel>Certificates you get:</SectionLabel>
                            <div className="space-y-3">
                                {certs.map((c: any, i: number) => <CertRow key={i} {...c} />)}
                            </div>
                        </div>
                    )}
                    {courses?.length > 0 && (
                        <div className="mb-6">
                            <SectionLabel>Courses you get:</SectionLabel>
                            <div className="space-y-3">
                                {courses.map((c: any, i: number) => <CourseRow key={i} {...c} />)}
                            </div>
                        </div>
                    )}
                    {freeItems?.length > 0 && (
                        <div className="mb-4">
                            <FreeBox items={freeItems} />
                        </div>
                    )}
                </div>
            </div>
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
    const [selectedTier, setSelectedTier] = useState<'essential' | 'professional' | 'executive' | 'ai-ready'>('professional'); // Default to recommended

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
    const getTierCertificates = (tier: 'essential' | 'professional' | 'executive' | 'ai-ready'): CertificationItem[] => {
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

    const [expandedTier, setExpandedTier] = useState<string | null>(null);
    
    // Ensure the default selected tier is also 'professional' if not already set by props/logic
    useEffect(() => {
        if (!selectedTier) {
            setSelectedTier('professional');
        }
    }, [selectedTier, setSelectedTier]);

    // Auto-expand when a card is selected - DISABLED for collapsed by default behavior
    // useEffect(() => {
    //     if (selectedTier) {
    //         setExpandedTier(selectedTier);
    //     }
    // }, [selectedTier]);

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
                case 'ai-ready':
                    return { price: 1, original: 2, certificates: 1, bonuses: 1 };
                default:
                    return { price: 2, original: 6, certificates: 3, bonuses: 2 };
            }
        }

        // 💰 PRODUCTION PRICING: Normal pricing
        switch (id) {
            case 'essential':
                return { price: 1999, original: 5999, certificates: 2, bonuses: 1 };
            case 'professional':
                return { price: 4999, original: 18999, certificates: 4, bonuses: 2 };
            case 'executive':
                return { price: 6999, original: 28999, certificates: 5, bonuses: 4 };
            case 'ai-ready':
                return { price: 2999, original: 8999, certificates: 3, bonuses: 1 };
            default:
                return { price: 4999, original: 18999, certificates: 3, bonuses: 2 };
        }
    };

    const packsData = [
        {
            id: "essential",
            title: "Core Certifications",
            badge: "CORE",
            features: [
                { icon: <CheckIcon />, label: "2 Verified Certificates" },
                { icon: <CourseIcon />, label: "1 Personalised Course" },
                { icon: <LinkedInIcon />, label: "LinkedIn Ready" },
                { icon: <TrustedIcon />, label: "Trusted by Recruiters" },
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
            isProgressive: false,
            basePackage: null,
        },
        {
            id: "ai-ready",
            title: "AI Specialist",
            badge: "AI READY",
            features: [
                { icon: <AIIcon />, label: "1 AI Certification" },
                { icon: <CourseIcon />, label: "1 AI Course" },
            ],
            certs: getTierCertificates('ai-ready').map(cert => ({
                title: cert.certification_name,
                subtitle: (cert.type === 'default' || cert.type === 'primary' || !cert.type) ? 'Core Certification' : cert.type === 'ai' ? 'AI Certification' : 'Secondary Certification',
                certItem: cert
            })),
            courses: [
                { title: `AI for ${role || 'Project Managers'}`, subtitle: `Specialized AI training for ${role || 'professionals'}` },
            ],
            freeItems: [],
            original: getTierPricingById('ai-ready').original,
            current: getTierPricingById('ai-ready').price,
            isProgressive: true,
            basePackage: "Core",
        },
        {
            id: "professional",
            title: "Professional Pack",
            badge: "RECOMMENDED",
            features: [
                { icon: <CheckIcon />, label: "2 Secondary Certificates" },
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
            isProgressive: true,
            basePackage: "Core",
        },
        {
            id: "executive",
            title: "Ultimate Pack",
            badge: "ALL IN ONE",
            features: [
                { icon: <CheckIcon />, label: "2 Secondary Certificates" },
                { icon: <AIIcon />, label: "1 AI Certification" },
                { icon: <CourseIcon />, label: "1 AI Course" },
                { icon: <ProPlanIcon />, label: "1 Month LearnTube Pro" },
                { icon: <ResumeIcon />, label: "Free Resume Enhancer" },
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
            isProgressive: true,
            basePackage: "Professional",
        },
    ];

    return (
        <>
            <section id="claim-certificates-section" className={`w-full ${className}`}>

                {/* Section Title - Enhanced with Pack Selection */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Choose Your Pack and Get Your <span className="text-[#7FC241]">Global {role || 'Professional'}</span> Certificates
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
