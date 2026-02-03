import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string | React.ReactNode;
}

interface FAQSectionProps {
    className?: string;
}

const faqData: FAQItem[] = [
    {
        question: "What types of certificates do you offer?",
        answer: "We offer a wide range of professional certifications including CBAPX, CSCPX, CSP, PMQX, CPHRX, Cybersecurity, PMP-Assessment, Six Sigma (Black Belt & Yellow Belt), FPAA, DTPCX, SPIN Selling, CDAPX, CMAP, CloudArchX, CELX, and many more."
    },
    {
        question: "How do I earn a certificate?",
        answer: "To earn your certificate, you must complete an Assessment methodology and score at least 50% or above."
    },
    {
        question: "How long are the certificates valid?",
        answer: "Most of our certificates are valid for a lifetime and do not require renewal. If renewal is required for a specific Certificate, it will be clearly mentioned before making the payment."
    },
    {
        question: "How can I purchase a certificate?",
        answer: "You can purchase certificates directly on our platform after completing the required assessment. Payment options include major credit/debit cards, UPI, net banking, and international options."
    },
    {
        question: "What is your refund policy?",
        answer: "Refunds are only provided if we are unable to deliver the service you paid for within 48 hours of purchase (excluding public holidays). Once a certificate is issued, it is non-refundable and non-cancellable."
    },
    {
        question: "How will I receive my certificate?",
        answer: "Certificates are issued digitally and can be downloaded instantly once you pass the assessment and complete payment. Printed copies are available on request (additional charges may apply)."
    },
    {
        question: "Can I correct my name on the certificate?",
        answer: "Yes, if your name is misspelled, email us at hello@careerninja.in with valid ID proof. Corrections are free if requested within 7 days of issuance."
    },
    {
        question: "How can my employer verify my certificate?",
        answer: (
            <div>
                <p className="mb-2">Each certificate has a unique ID. Verification can be done anytime through our official link:</p>
                <a
                    href="https://certifications.learntube.ai/verify-certificate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[#98D048] hover:text-[#98D048]/80 transition-colors duration-200 font-medium"
                >
                    <span>👉 https://certifications.learntube.ai/verify-certificate</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        )
    },
    {
        question: "I didn't receive my certificate. What should I do?",
        answer: "Check your inbox and spam/junk folder for an email from no-reply@learntube.ai. If you still don't see it, contact our support team with your Payment details."
    },
    {
        question: "How can I contact support?",
        answer: "For any certificate-related queries, email us at hello@careerninja.in. Our team usually responds within 24–48 business hours."
    }
];

const FAQSection: React.FC<FAQSectionProps> = ({ className = '' }) => {
    const [openItems, setOpenItems] = useState<number[]>([]);

    const toggleItem = (index: number) => {
        setOpenItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className={`w-full max-w-4xl mx-auto ${className}`}>
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12 px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                    Frequently Asked Questions
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-[#98D048] to-[#4285F4] rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
                    Everything you need to know about our certifications and assessment process.
                </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4 px-2 sm:px-4 mb-16">
                {faqData.map((item, index) => {
                    const isOpen = openItems.includes(index);

                    return (
                        <div
                            key={index}
                            className={`
                                group relative overflow-hidden rounded-xl border transition-all duration-300
                                ${isOpen
                                    ? 'bg-[#0B2A3D]/80 border-[#98D048]/50 shadow-[0_0_15px_rgba(152,208,72,0.1)]'
                                    : 'bg-[#0B2A3D]/40 border-white/5 hover:border-white/20 hover:bg-[#0B2A3D]/60'
                                }
                            `}
                        >
                            {/* Question Button */}
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 outline-none"
                            >
                                <h3 className={`font-semibold text-base sm:text-lg transition-colors duration-200 ${isOpen ? 'text-[#98D048]' : 'text-white group-hover:text-gray-100'}`}>
                                    {item.question}
                                </h3>

                                {/* Expand/Collapse Icon */}
                                <div className={`
                                    flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300
                                    ${isOpen
                                        ? 'border-[#98D048] bg-[#98D048]/10 rotate-180'
                                        : 'border-white/10 bg-white/5 group-hover:border-white/30 rotate-0'
                                    }
                                `}>
                                    <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 transition-colors ${isOpen ? 'text-[#98D048]' : 'text-gray-400'}`}>
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>

                            {/* Answer Content */}
                            <div className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                            `}>
                                <div className="px-6 pb-6 pt-0">
                                    <div className="h-px w-full bg-white/5 mb-4"></div>
                                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        {typeof item.answer === 'string' ? (
                                            <p>{item.answer}</p>
                                        ) : (
                                            item.answer
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Contact Support Section */}
            <div className="px-2 sm:px-4">
                <div className="relative overflow-hidden rounded-2xl p-8 sm:p-10 text-center">
                    {/* Background Gradients */}
                    <div className="absolute inset-0 bg-[#0B2A3D] border border-white/10 rounded-2xl"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4285F4]/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#98D048]/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#98D048]/20 to-[#4285F4]/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-lg">
                            <svg className="w-8 h-8 text-[#98D048]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            Still have questions?
                        </h3>
                        <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
                            Can't find the answer you're looking for? Our friendly team is here to help you with any queries.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="mailto:hello@careerninja.in"
                                className="group inline-flex items-center justify-center gap-2 bg-[#98D048] text-[#001C2C] px-8 py-3 rounded-xl font-bold text-base hover:bg-[#87BF3F] transition-all duration-200 hover:shadow-lg hover:shadow-[#98D048]/20 hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Email Support</span>
                            </a>
                            <a
                                href="https://wa.me/91XXXXXXXXXX" // Replace with actual WhatsApp number if available, otherwise maybe keep it secondary or remove
                                onClick={(_e) => {
                                    if (true) return; // Prevent navigation for now as I don't have the number, or just make it a secondary 'Help Center' button
                                }}
                                className="hidden group inline-flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-8 py-3 rounded-xl font-semibold text-base hover:bg-white/10 transition-all duration-200"
                            >
                                <span>Help Center</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQSection;
