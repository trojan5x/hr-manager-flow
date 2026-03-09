import React, { useState } from 'react';
import type { CertificationItem } from '../types';

interface CertificateThumbnailProps {
  certificate: CertificationItem;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  className?: string;
  tier?: 'essential' | 'professional' | 'executive';
  animationDelay?: number;
}

const CertificateThumbnail: React.FC<CertificateThumbnailProps> = ({
  certificate,
  size = 'small',
  showName = true,
  className = '',
  tier = 'essential',
  animationDelay = 0
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size configurations for mobile-first approach
  const sizeConfig = {
    small: {
      container: 'w-14 h-14 sm:w-16 sm:h-16', // 56px -> 64px
      image: 'w-full h-full',
      text: 'text-[10px] sm:text-xs'
    },
    medium: {
      container: 'w-16 h-16 sm:w-20 sm:h-20', // 64px -> 80px
      image: 'w-full h-full',
      text: 'text-xs sm:text-sm'
    },
    large: {
      container: 'w-20 h-20 sm:w-24 sm:h-24', // 80px -> 96px
      image: 'w-full h-full',
      text: 'text-sm sm:text-base'
    }
  };

  // Progressive styling based on tier
  const getTierStyling = (): {
    container: string;
    glow: string;
    overlay: string;
    text: string;
  } => {
    switch (tier) {
      case 'essential':
        return {
          container: 'border-2 border-white/20 hover:border-[#7FC241]/50',
          glow: '',
          overlay: 'from-[#7FC241]/0 to-[#7FC241]/20',
          text: 'text-gray-300'
        };
      case 'professional':
        return {
          container: 'border-2 border-[#7FC241]/30 hover:border-[#4FC3F7]/60 shadow-[0_0_8px_rgba(127,194,65,0.2)]',
          glow: 'shadow-[0_0_12px_rgba(127,194,65,0.3)] hover:shadow-[0_0_16px_rgba(79,195,247,0.4)]',
          overlay: 'from-[#7FC241]/10 via-[#4FC3F7]/10 to-[#7FC241]/30',
          text: 'text-gray-200'
        };
      case 'executive':
        return {
          container: 'border-2 border-gradient-to-r from-[#FFD700]/50 to-[#9333EA]/50 hover:from-[#FFD700]/70 hover:to-[#9333EA]/70',
          glow: 'shadow-[0_0_16px_rgba(255,215,0,0.4)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]',
          overlay: 'from-[#FFD700]/20 via-[#9333EA]/20 to-[#FFD700]/30',
          text: 'text-gray-100 font-medium'
        };
      default:
        return {
          container: 'border-2 border-white/20 hover:border-[#7FC241]/50',
          glow: '',
          overlay: 'from-[#7FC241]/0 to-[#7FC241]/20',
          text: 'text-gray-300'
        };
    }
  };

  const tierStyling = getTierStyling();
  const config = sizeConfig[size];

  // Handle certificate type badges
  const getTypeBadge = () => {
    if (!certificate.type) return null;
    
    const badgeConfig = {
      default: { text: 'Core', color: 'bg-[#7FC241]/90 text-black' },
      secondary: { text: 'Pro', color: 'bg-[#4FC3F7]/90 text-black' },
      ai: { text: 'AI', color: 'bg-[#9333EA]/90 text-white' }
    };

    const badge = badgeConfig[certificate.type as keyof typeof badgeConfig];
    if (!badge) return null;

    return (
      <div className={`absolute -top-1 -right-1 px-1 py-0.5 rounded text-[8px] font-bold ${badge.color}`}>
        {badge.text}
      </div>
    );
  };

  // Fallback image when certificate image fails to load
  const fallbackImage = (
    <div className={`${config.container} bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-600`}>
      <div className="text-center p-1">
        <div className="w-6 h-6 mx-auto mb-1 bg-gradient-to-br from-[#7FC241] to-[#4FC3F7] rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-[8px] text-gray-300 font-medium leading-tight">
          Cert
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`flex flex-col items-center gap-1.5 ${className}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Thumbnail Container */}
      <div className="relative group cursor-pointer">
        {imageError || !certificate.certificate_preview_url ? (
          fallbackImage
        ) : (
          <div className={`
            ${config.container} 
            ${tierStyling.container} 
            ${tierStyling.glow}
            rounded-lg overflow-hidden 
            transition-all duration-300 
            relative
            animate-fade-in-up
          `}>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse rounded-lg" />
            )}
            
            {/* Certificate Image */}
            <img
              src={certificate.certificate_preview_url}
              alt={`${certificate.certification_name} Certificate`}
              className={`${config.image} object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />

            {/* Gradient Overlay for Premium Tiers */}
            {tier !== 'essential' && (
              <div className={`absolute inset-0 bg-gradient-to-br ${tierStyling.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            )}

            {/* Shimmer Effect for Executive Tier */}
            {tier === 'executive' && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer" />
              </div>
            )}
          </div>
        )}

        {/* Type Badge */}
        {getTypeBadge()}
      </div>

      {/* Certificate Name */}
      {showName && (
        <div className="text-center max-w-[70px] sm:max-w-[80px]">
          <p className={`${config.text} ${tierStyling.text} font-medium leading-tight truncate`}>
            {certificate.certification_name_short || certificate.certification_name}
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificateThumbnail;