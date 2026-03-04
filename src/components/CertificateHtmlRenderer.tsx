import React from 'react';
import type { CertificationItem } from '../types';

export interface CertificateHtmlRendererProps {
    /** Certificate data from the CertificationItem interface */
    certificate: CertificationItem;
    /** User's full name (first and last name combined) */
    userName?: string;
    /** Whether to render in compact mode for thumbnails */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Custom container style overrides */
    style?: React.CSSProperties;
}

interface CertificateDisplayData {
    firstName?: string;
    lastName?: string;
    certNameShort?: string;
    certNameFull?: string;
    certId?: string;
    date?: string;
}

/**
 * CertificateHtmlRenderer - A reusable component for rendering HTML-based certificates
 * 
 * This component generates dynamic certificate previews using HTML/CSS instead of static images.
 * It's extracted and adapted from the CertificateFan component to work with the CertificationItem
 * data structure used throughout the application.
 * 
 * Features:
 * - Dynamic text overlay with user name and certificate details
 * - Container query width (cqw) units for responsive typography
 * - Precise percentage-based positioning for pixel-perfect alignment
 * - Support for both compact (thumbnail) and full-size rendering
 * - Automatic certificate ID and date generation
 */
export const CertificateHtmlRenderer: React.FC<CertificateHtmlRendererProps> = ({
    certificate,
    userName = 'YOUR NAME HERE',
    compact = false,
    className = '',
    style = {}
}) => {
    // Generate certificate ID using prefix or fallback
    const generateCertificateId = (): string => {
        const prefix = certificate.cert_id_prefix || 'CERT';
        const skillId = certificate.skill_id.toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
        return `${prefix}-${skillId}-${timestamp}`;
    };

    // Generate current date in MM/DD/YYYY format
    const generateCertificateDate = (): string => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    // Parse user name into first and last name
    const parseUserName = (fullName: string): { firstName: string; lastName: string } => {
        if (!fullName || fullName === 'YOUR NAME HERE' || fullName === 'Guest') {
            return { firstName: 'YOUR NAME', lastName: 'HERE' };
        }
        
        const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
        if (nameParts.length === 0) {
            return { firstName: 'YOUR NAME', lastName: 'HERE' };
        }
        if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: '' };
        }
        
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        return { firstName, lastName };
    };

    // Transform CertificationItem to CertificateDisplayData
    const { firstName, lastName } = parseUserName(userName);
    const certificateData: CertificateDisplayData = {
        firstName,
        lastName,
        certNameShort: certificate.certification_name_short || certificate.certification_name || 'Professional Certificate',
        certNameFull: certificate.certification_name || certificate.certification_name_short || 'Professional Certificate',
        certId: generateCertificateId(),
        date: generateCertificateDate()
    };

    // Calculate font sizes based on compact mode
    const fontSizes = compact ? {
        name: '8cqw',
        shortName: '4cqw',
        fullName: '2.5cqw',
        details: '1.5cqw'
    } : {
        name: '10cqw',
        shortName: '5cqw',
        fullName: '3cqw',
        details: '2cqw'
    };

    return (
        <div 
            className={`relative w-full bg-white shadow-lg overflow-hidden ${className}`}
            style={{ 
                aspectRatio: '1300/900',
                containerType: 'inline-size', // Enable container queries
                containerName: 'cert',
                ...style
            }}
        >
            {/* Background Image */}
            <img 
                src="/assets/specialised-cert-empty.png" 
                alt="Certificate Background" 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                    // Fallback to a solid background if the certificate template is missing
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        parent.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                        parent.style.border = '2px solid #0891b2';
                    }
                }}
            />
            
            {/* Certificate Content - Using container query width (cqw) units */}
            <div className="absolute inset-0">
                {/* User Name - Using cqw for container-relative sizing */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.706%',
                        top: '6.978%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: fontSizes.name,
                        color: '#172C3F',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 1.2,
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {certificateData.firstName}{'\n'}{certificateData.lastName}
                </div>

                {/* Certificate Short Name */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.706%',
                        top: '47.245%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: fontSizes.shortName,
                        color: '#172C3F',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 1.2,
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {certificateData.certNameShort}
                </div>

                {/* Certificate Full Name */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '45.779%',
                        top: '55.680%',
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: fontSizes.fullName,
                        color: '#172c3f',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 'normal',
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line',
                        opacity: 0.8
                    }}
                >
                    {certificateData.certNameFull}
                </div>

                {/* Certificate ID and Date */}
                <div 
                    style={{
                        position: 'absolute',
                        left: '46.361%',
                        top: '90.112%',
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: fontSizes.details,
                        color: '#505050',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        lineHeight: 'normal',
                        textAlign: 'left',
                        maxWidth: '51%',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-line'
                    }}
                >
                    ID: {certificateData.certId} | DATE: {certificateData.date}
                </div>
            </div>
        </div>
    );
};

export default CertificateHtmlRenderer;