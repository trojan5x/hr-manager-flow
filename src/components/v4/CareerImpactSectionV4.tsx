import React, { useState } from 'react';

interface CareerImpactSectionProps {
    className?: string;
}

const CareerImpactSectionV4: React.FC<CareerImpactSectionProps> = ({ className = '' }) => {
    const [openSection, setOpenSection] = useState<string | null>('hired-faster');

    const toggleSection = (id: string) => {
        setOpenSection(openSection === id ? null : id);
    };

    // Data for "Get Hired 47% Faster" Slider
    const hiredFasterSlides = [
        {
            title: "Add To Your Resume",
            subtitle: "Make A Positive Impression Within",
            highlight: "First 3 Seconds",
            image: "https://assets.learntube.ai/files/New%20Analysis%20Page/thirdslider.png?updatedAt=1742995641706"
        },
        {
            title: "Post On LinkedIn",
            subtitle: "Showcase Your Skills To The Right Audience &",
            highlight: "Expand Your Network",
            image: "https://assets.learntube.ai/files/New%20Analysis%20Page/Frame%2022338.png?updatedAt=1742995530222"
        },
        {
            title: "Add To LinkedIn Profile",
            subtitle: "Grab Recruiters' Attention By Showing",
            highlight: "Verified Skills",
            image: "https://assets.learntube.ai/files/New%20Analysis%20Page/Frame%20427320647.png?updatedAt=1742995347985"
        },
        {
            title: "Share At Interviews",
            subtitle: "Strengthen Your Case By Highlighting",
            highlight: "Verifiable Certificates",
            image: "https://assets.learntube.ai/files/New%20Analysis%20Page/fourthslide.png?updatedAt=1742995764447"
        }
    ];



    return (
        <section className={`w-full max-w-4xl mx-auto ${className}`}>
            <div className="flex flex-col gap-4">

                {/* 1. Get Hired 47% Faster */}
                <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'hired-faster' ? 'bg-[#0B2A3D]/80 border-[#98D048]/50 shadow-[0_0_15px_rgba(152,208,72,0.1)]' : 'bg-[#0B2A3D]/40 border-white/5'}`}>
                    <button
                        onClick={() => toggleSection('hired-faster')}
                        className="w-full px-6 py-4 flex items-center justify-between outline-none"
                    >
                        <h4 className="text-base font-bold text-white text-left">
                            Get Hired <span className="text-[#4FC3F7]">47%</span> Faster
                        </h4>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openSection === 'hired-faster' ? 'border-[#98D048] bg-[#98D048]/10 rotate-180' : 'border-white/10 rotate-0'}`}>
                            <svg className={`w-4 h-4 ${openSection === 'hired-faster' ? 'text-[#98D048]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'hired-faster' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 sm:p-6 sm:pt-0 pt-0">
                            <div className="h-px w-full bg-white/5 mb-6"></div>

                            {/* Mobile-Friendly Horizontal Scroll / Desktop Grid */}
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
                                {hiredFasterSlides.map((slide, index) => (
                                    <div
                                        key={index}
                                        className="min-w-[280px] w-[85%] sm:w-auto snap-center flex-shrink-0 bg-[#021C30] border border-white/10 rounded-xl overflow-hidden flex flex-col"
                                    >
                                        {/* Image Area */}
                                        <div className="h-40 sm:h-48 w-full bg-[#0D2436] relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#021C30] to-transparent opacity-60"></div>
                                            <img
                                                src={slide.image}
                                                alt={slide.title}
                                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-4 flex flex-col flex-1 relative z-10">
                                            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#7FC241]/20 flex items-center justify-center flex-shrink-0 text-[#7FC241] text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                {slide.title}
                                            </h4>
                                            <p className="text-gray-400 text-sm leading-relaxed">
                                                {slide.subtitle} <span className="text-white font-semibold block mt-0.5">{slide.highlight}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Be Different From 20 Million Students */}
                <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'be-different' ? 'bg-[#0B2A3D]/80 border-[#98D048]/50 shadow-[0_0_15px_rgba(152,208,72,0.1)]' : 'bg-[#0B2A3D]/40 border-white/5'}`}>
                    <button
                        onClick={() => toggleSection('be-different')}
                        className="w-full px-6 py-4 flex items-center justify-between outline-none"
                    >
                        <h4 className="text-base font-bold text-white text-left">
                            Be Different From <span className="text-[#4FC3F7]">20 Million</span> College Students
                        </h4>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openSection === 'be-different' ? 'border-[#98D048] bg-[#98D048]/10 rotate-180' : 'border-white/10 rotate-0'}`}>
                            <svg className={`w-4 h-4 ${openSection === 'be-different' ? 'text-[#98D048]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'be-different' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0">
                            <div className="h-px w-full bg-white/5 mb-6"></div>
                            <div className="grid gap-4">
                                {[
                                    "Use your certificate to earn college credits",
                                    "Use it as part of applications to foreign universities, master's, and internships",
                                    "Use it in your scholarship or grant application to show advanced skills",
                                    "Share it to showcase your dedication to expanding your skills"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-[#7FC241]/30 transition-colors">
                                        <div className="w-5 h-5 rounded-full bg-[#7FC241]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-3 h-3 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Boost Your Credibility */}
                <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${openSection === 'boost-credibility' ? 'bg-[#0B2A3D]/80 border-[#98D048]/50 shadow-[0_0_15px_rgba(152,208,72,0.1)]' : 'bg-[#0B2A3D]/40 border-white/5'}`}>
                    <button
                        onClick={() => toggleSection('boost-credibility')}
                        className="w-full px-6 py-4 flex items-center justify-between outline-none"
                    >
                        <h4 className="text-base font-bold text-white text-left">
                            Boost Your Credibility By <span className="text-[#4FC3F7]">39%</span>
                        </h4>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openSection === 'boost-credibility' ? 'border-[#98D048] bg-[#98D048]/10 rotate-180' : 'border-white/10 rotate-0'}`}>
                            <svg className={`w-4 h-4 ${openSection === 'boost-credibility' ? 'text-[#98D048]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'boost-credibility' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0">
                            <div className="h-px w-full bg-white/5 mb-6"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Verify Instantly */}
                                <div className="bg-[#021C30] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-[#7FC241]/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h5 className="text-white font-bold text-sm">Anyone can verify instantly</h5>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 bg-white/5 rounded-lg p-3">
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/certificate-image.png?updatedAt=1741417404253" alt="Cert" className="h-12 w-auto object-contain" />
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/Vector_27.svg?updatedAt=1741417664046" alt="->" className="h-3 w-auto opacity-50" />
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/image%20746_2.png?updatedAt=1741417762651" alt="Verified" className="h-12 w-auto object-contain" />
                                    </div>
                                </div>

                                {/* Co-Certified */}
                                <div className="bg-[#021C30] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-[#7FC241]/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h5 className="text-white font-bold text-sm">Co-Certified by Top Brands</h5>
                                    </div>
                                    <div className="flex items-center justify-center gap-4 bg-white/5 rounded-lg p-3 flex-wrap">
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/canvaD%201.png?updatedAt=1741418044154" alt="Canva" className="h-5 w-auto object-contain brightness-0 invert" />
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/logoshootsuite.png?updatedAt=1741418195941" alt="Hootsuite" className="h-5 w-auto object-contain brightness-0 invert" />
                                        <img src="https://assets.learntube.ai/files/new-post-certificate-purchase/logoszoho.png?updatedAt=1741418291553" alt="Zoho" className="h-5 w-auto object-contain brightness-0 invert" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default CareerImpactSectionV4;
