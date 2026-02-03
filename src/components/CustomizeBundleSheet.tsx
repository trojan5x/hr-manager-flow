import React, { useState, useEffect } from 'react';
import type { CertificationItem } from '../services/api';

interface CustomizeBundleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    certifications: CertificationItem[];
    basePrice: number; // e.g. 5999 for full bundle
    onCheckout: (selectedCerts: CertificationItem[], total: number) => void;
}

const CustomizeBundleSheet: React.FC<CustomizeBundleSheetProps> = ({
    isOpen,
    onClose,
    certifications,
    basePrice,
    onCheckout
}) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Initialize with all selected when opened
    useEffect(() => {
        if (isOpen && certifications.length > 0) {
            setSelectedIds(certifications.map(c => c.skill_id));
        }
    }, [isOpen, certifications]);

    const toggleCert = (id: number) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                // Don't allow deselecting the last one? Or do we? Let's allow it but disable checkout
                return prev.filter(item => item !== id);
            }
            return [...prev, id];
        });
    };

    // Dynamic Pricing Logic mimicking the individual section logic or simplified
    // Logic: 
    // 1 cert: 2499 (20% off)
    // 2 certs: 3499 (30% off)
    // 3 certs: 4499 (40% off)
    // 4+ certs: 5999 (50%+ off - Bundle Price)

    const count = selectedIds.length;
    let currentPrice = 0;
    let originalPrice = 0;
    let discountLabel = '';

    if (count === 0) {
        currentPrice = 0;
        originalPrice = 0;
    } else if (count >= 4) {
        currentPrice = basePrice; // Bundle Price
        originalPrice = count * 2499; // Approx original
        discountLabel = '50% OFF';
    } else if (count === 3) {
        currentPrice = 4499;
        originalPrice = 3 * 2499;
        discountLabel = '40% OFF';
    } else if (count === 2) {
        currentPrice = 3499;
        originalPrice = 2 * 2499;
        discountLabel = '30% OFF';
    } else {
        currentPrice = 2499;
        originalPrice = 2999;
        discountLabel = '20% OFF';
    }

    const selectedCerts = certifications.filter(c => selectedIds.includes(c.skill_id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Side Drawer */}
            <div className={`relative w-full max-w-md h-full bg-[#001C2C] border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#002A44]">
                    <h3 className="text-xl font-bold text-white">Customize Your Bundle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                        Select the certifications you want to claim. Add more to unlock higher discounts.
                    </p>

                    {certifications.map(cert => {
                        const isSelected = selectedIds.includes(cert.skill_id);
                        return (
                            <div
                                key={cert.skill_id}
                                onClick={() => toggleCert(cert.skill_id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${isSelected
                                    ? 'bg-[#7FC241]/10 border-[#7FC241] shadow-[0_0_15px_rgba(127,194,65,0.1)]'
                                    : 'bg-[#0b273d] border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                        ? 'bg-[#7FC241] border-[#7FC241]'
                                        : 'bg-transparent border-gray-500 group-hover:border-gray-300'}`}>
                                        {isSelected && (
                                            <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                            {cert.certification_name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {cert.skill_description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer / Total */}
                <div className="p-6 border-t border-white/10 bg-[#002A44]">
                    <div className="flex justify-between items-end mb-4">
                        <div className="text-gray-400 text-sm">Total Price ({count} items)</div>
                        <div className="text-right">
                            {originalPrice > currentPrice && (
                                <div className="text-gray-500 line-through text-sm">₹{originalPrice.toLocaleString()}</div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-white">₹{currentPrice.toLocaleString()}</div>
                                {discountLabel && (
                                    <div className="bg-[#7FC241] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {discountLabel}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onCheckout(selectedCerts, currentPrice)}
                        disabled={count === 0}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${count > 0
                            ? 'bg-[#7FC241] hover:bg-[#68A335] text-black hover:-translate-y-0.5'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                        <span>Checkout Now</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomizeBundleSheet;
