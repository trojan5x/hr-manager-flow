import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Certification, getPricingForQuantity, calculateTotalPrice, ORIGINAL_PRICE_PER_CERT } from '../constants/certifications';
import Button from './Button';
import RazorpayModal from './RazorpayModal';
import CertificatePreviewModal from './CertificatePreviewModal';

interface ClaimCertificationsSectionProps {
    availableCertifications: Certification[];
    className?: string;
}

const ClaimCertificationsSection: React.FC<ClaimCertificationsSectionProps> = ({
    availableCertifications,
    className = ''
}) => {
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedCertForPreview, setSelectedCertForPreview] = useState<Certification | null>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    // All certificates selected by default (user earned them)
    const [selectedCertIds, setSelectedCertIds] = useState<string[]>(
        availableCertifications.map(cert => cert.id)
    );

    // Dynamic pricing calculations based on selection
    const selectedCount = selectedCertIds.length;
    const currentTier = getPricingForQuantity(selectedCount);
    const totalPrice = calculateTotalPrice(selectedCount);
    const originalTotalPrice = selectedCount * ORIGINAL_PRICE_PER_CERT; // Total original price
    // const totalSavings = originalTotalPrice - totalPrice; // Total savings including base discount + progressive
    // const selectedCertifications = availableCertifications.filter(cert => selectedCertIds.includes(cert.id));

    const handleCertSelection = (certId: string) => {
        setSelectedCertIds(prev =>
            prev.includes(certId)
                ? prev.filter(id => id !== certId)
                : [...prev, certId]
        );
    };

    const handleBuyNow = () => {
        if (selectedCount === 0) return;
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = (paymentId: string) => {
        console.log('Payment successful:', paymentId);

        // Get purchased certificate names for navigation
        const purchasedCerts = selectedCertIds
            .map(id => availableCertifications.find(cert => cert.id === id))
            .filter(cert => cert !== undefined)
            .map(cert => cert.name);

        // Close the modal first
        setShowPaymentModal(false);

        // Navigate to payment loading page with order details
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const navigationUrl = `/payment-loading?orderId=${orderId}&certs=${purchasedCerts.join(',')}&paymentId=${paymentId}`;

        console.log('About to navigate to:', navigationUrl);

        // Try React Router navigation first, then fallback to window.location
        try {
            navigate(navigationUrl);
            console.log('Navigation attempted via React Router');
        } catch (error) {
            console.error('React Router navigation failed, using window.location:', error);
            window.location.href = navigationUrl;
        }
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment failed:', error);
        alert(`Payment failed: ${error}`);
    };

    const handleCertificatePreview = (cert: Certification) => {
        setSelectedCertForPreview(cert);
        setShowPreviewModal(true);
    };

    // Generate certificate thumbnail URL
    const getCertificateThumbnailUrl = (certId: string) => {
        return `/certificates/${certId}-thumbnail.png`;
    };

    // Intersection Observer to show sticky bar (once shown, stays shown)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                // Show sticky bar when section comes into view, but don't hide it once shown
                if (entry.isIntersecting && !showStickyBar) {
                    setShowStickyBar(true);
                }
            },
            {
                threshold: 0.1, // Show when 10% of the section is visible
                rootMargin: '0px 0px -50px 0px' // Trigger a bit before reaching the bottom
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [showStickyBar]);

    return (
        <>
            <div id="claim-certificates-section" ref={sectionRef} className={`w-full max-w-6xl mx-auto ${className}`}>
                {/* Section Header */}
                <div className="text-center mb-8 px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        Claim Your Certifications
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Select the certifications you want to purchase. All earned certificates are selected by default.
                    </p>
                </div>

                {/* Certificate Cards Grid - Modern Design */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mb-8 px-4">
                    {availableCertifications.map((cert) => {
                        const isSelected = selectedCertIds.includes(cert.id);
                        return (
                            <div
                                key={cert.id}
                                className={`
                                    relative bg-white/5 backdrop-blur-sm border rounded-xl transition-all duration-300 cursor-pointer group
                                    hover:bg-white/10 hover:border-white/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                                    ${isSelected
                                        ? 'border-[#98D048] bg-[#98D048]/10 shadow-[0_0_20px_rgba(152,208,72,0.2)]'
                                        : 'border-white/20'
                                    }
                                `}
                                onClick={() => handleCertSelection(cert.id)}
                            >
                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#98D048] rounded-full border-3 border-[#001C2C] flex items-center justify-center z-10 shadow-lg">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#001C2C]">
                                            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}

                                {/* Card Content */}
                                <div className="p-4 lg:p-5 flex flex-col h-full">
                                    {/* Certificate Thumbnail */}
                                    <div
                                        className="relative mb-4 rounded-lg overflow-hidden bg-gray-800/30 cursor-pointer hover:scale-105 transition-transform duration-300"
                                        style={{ aspectRatio: '4/3' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCertificatePreview(cert);
                                        }}
                                    >
                                        <img
                                            src={getCertificateThumbnailUrl(cert.id)}
                                            alt={`${cert.name} Certificate Preview`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to a styled placeholder
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />

                                        {/* Fallback Certificate Placeholder */}
                                        <div className="hidden w-full h-full bg-gradient-to-br from-[#FFFEF0] to-[#F5F5DC] flex flex-col items-center justify-center p-3 text-center">
                                            <div className="text-[#0A1628] text-xs font-bold mb-1">CERTIFICATE</div>
                                            <div className="text-[#0A1628] text-[10px] mb-2">OF ACHIEVEMENT</div>
                                            <div className="text-[#666] text-[8px] leading-tight mb-2 px-1">
                                                This certifies completion of
                                            </div>
                                            <div className="text-[#0A1628] text-[10px] font-bold mb-1">NAME</div>
                                            <div className="text-[#666] text-[7px] leading-tight px-1">
                                                {cert.name} certification
                                            </div>
                                        </div>

                                        {/* Preview Overlay */}
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-2">
                                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-800">
                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" />
                                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certificate Info */}
                                    <div className="flex-1 mb-4">
                                        <h3 className="text-white text-lg font-bold mb-2 leading-tight">
                                            {cert.name}
                                        </h3>
                                        <p className="text-[#98D048] text-sm font-medium mb-2">
                                            {cert.testedSkill}
                                        </p>
                                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                                            {cert.description}
                                        </p>
                                    </div>

                                    {/* Frameworks Preview */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {cert.frameworks.slice(0, 2).map((framework, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-[10px] rounded-md border border-[#98D048]/20 truncate"
                                                    title={framework}
                                                >
                                                    {framework.length > 15 ? `${framework.substring(0, 15)}...` : framework}
                                                </span>
                                            ))}
                                        </div>
                                        {cert.frameworks.length > 2 && (
                                            <span className="text-gray-400 text-[10px]">
                                                +{cert.frameworks.length - 2} more frameworks
                                            </span>
                                        )}
                                    </div>

                                    {/* Price and Action */}
                                    <div className="flex items-center justify-between gap-3 mt-auto">
                                        <div className="text-[#98D048] text-xl font-bold">
                                            ₹{currentTier.pricePerCert.toLocaleString('en-IN')}
                                        </div>

                                        <button
                                            className={`
                                                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                                                ${isSelected
                                                    ? 'bg-[#4A5568] text-[#CBD5E0] cursor-default'
                                                    : 'bg-[#98D048] text-[#001C2C] hover:bg-[#98D048]/90 hover:scale-105'
                                                }
                                            `}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCertSelection(cert.id);
                                            }}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                                                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>


            </div>

            {/* Sticky Bottom Purchase Bar - Only show when section is in view and certificates are selected */}
            {selectedCount > 0 && showStickyBar && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/20 p-4 animate-fade-in-up">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                            {/* Left - Selection Summary */}
                            <div className="text-sm">
                                <div className="text-white font-semibold">
                                    {selectedCount} Certificate{selectedCount !== 1 ? 's' : ''} • ₹{currentTier.pricePerCert.toLocaleString('en-IN')} each
                                    <span className="text-[#98D048] ml-1 font-normal">
                                        ({Math.round(((ORIGINAL_PRICE_PER_CERT - currentTier.pricePerCert) / ORIGINAL_PRICE_PER_CERT) * 100)}% off)
                                    </span>
                                </div>
                            </div>

                            {/* Center/Right - Price & CTA */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {/* Total Price */}
                                <div className="text-right">
                                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                                        <div className="text-xl md:text-2xl font-bold text-[#98D048]">
                                            ₹{totalPrice.toLocaleString('en-IN')}
                                        </div>
                                        {/* Always show total original price crossed out */}
                                        <div className="text-gray-400 text-sm line-through">
                                            ₹{originalTotalPrice.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Button */}
                                <Button
                                    variant="primary"
                                    className="w-full text-lg py-3 px-6 rounded-xl shadow-[0_0_30px_rgba(152,208,72,0.4)] hover:shadow-[0_0_40px_rgba(152,208,72,0.6)] transition-all duration-300"
                                    onClick={handleBuyNow}
                                >
                                    Purchase Now
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Payment Modal */}
            <RazorpayModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={totalPrice}
                description={`${selectedCount} Professional Certificate${selectedCount !== 1 ? 's' : ''}`}
            />

            {/* Certificate Preview Modal */}
            <CertificatePreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                certification={selectedCertForPreview}
            />
        </>
    );
};

export default ClaimCertificationsSection;
