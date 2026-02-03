import React from 'react';
import { type Certification } from '../constants/certifications';
import IndividualCertificateCard from './IndividualCertificateCard';

interface IndividualCertificationsSectionProps {
    availableCertifications: Certification[];
    className?: string;
}

const IndividualCertificationsSection: React.FC<IndividualCertificationsSectionProps> = ({
    availableCertifications,
    className = ''
}) => {
    return (
        <div className={`w-full ${className}`}>
            {/* Section Header */}
            <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    Or Buy Individual Certifications
                </h3>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    Select specific certifications that match your career goals.
                    Each certification is priced at ₹1,999 individually.
                </p>
            </div>

            {/* Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCertifications.map((certification) => (
                    <IndividualCertificateCard
                        key={certification.id}
                        certification={certification}
                        className="animate-fade-in-up"
                    />
                ))}
            </div>

            {/* Info Notice */}
            <div className="mt-8 p-4 bg-[#406AFF]/10 border border-[#406AFF]/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#406AFF]">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-[#406AFF] font-medium mb-1">Individual Purchase Benefits</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                            <li>• Each certification includes official certificate and digital badge</li>
                            <li>• Lifetime access to certification materials and updates</li>
                            <li>• Priority support from our expert team</li>
                            <li>• Add to cart and buy multiple certifications together</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualCertificationsSection;
