import React, { useMemo } from 'react';
import { type Certification } from '../constants/certifications';
import { useCart } from '../contexts/CartContext';
import Button from './Button';

interface IndividualCertificateCardProps {
    certification: Certification;
    className?: string;
}

const IndividualCertificateCard: React.FC<IndividualCertificateCardProps> = ({
    certification,
    className = ''
}) => {
    const { addToCart, removeFromCart, isInCart } = useCart();

    // Available profile images
    const profileImages = [
        '/assets/profile-images/image.png',
        '/assets/profile-images/image copy.png', 
        '/assets/profile-images/image copy 2.png',
        '/assets/profile-images/image copy 3.png'
    ];

    // Generate random selection of 3 images that stays consistent during component lifecycle
    const randomProfileImages = useMemo(() => {
        const shuffled = [...profileImages].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }, []);
    const inCart = isInCart(certification.id);

    const handleToggle = () => {
        if (inCart) {
            removeFromCart(certification.id);
        } else {
            addToCart(certification);
        }
    };

    return (
        <div className={`bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-300 ${className}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{certification.name}</h3>
                    <p className="text-[#98D048] text-sm font-medium mb-2">{certification.testedSkill}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">₹{certification.price.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-400">Individual Price</div>
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">{certification.description}</p>

            {/* Frameworks */}
            <div className="mb-6">
                <div className="text-xs font-medium text-gray-400 mb-2">Key Frameworks:</div>
                <div className="flex flex-wrap gap-1">
                    {certification.frameworks.slice(0, 2).map((framework, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20"
                        >
                            {framework}
                        </span>
                    ))}
                    {certification.frameworks.length > 2 && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md">
                            +{certification.frameworks.length - 2} more
                        </span>
                    )}
                </div>
            </div>

            {/* Add to Cart Button */}
            <Button
                variant={inCart ? "secondary" : "primary"}
                className="w-full"
                onClick={handleToggle}
            >
                {inCart ? (
                    <div className="flex items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="currentColor"/>
                        </svg>
                        Added to Cart
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-5M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8m-9 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Add to Cart
                    </div>
                )}
            </Button>

            {/* Professional Certified Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <div className="flex -space-x-1">
                    {randomProfileImages.map((imageSrc, index) => (
                        <img 
                            key={index}
                            src={imageSrc} 
                            alt={`Professional ${index + 1}`} 
                            className="w-4 h-4 rounded-full border border-[#001C2C] shadow-sm object-cover" 
                        />
                    ))}
                </div>
                <span>450+ professionals certified</span>
            </div>
        </div>
    );
};

export default IndividualCertificateCard;
