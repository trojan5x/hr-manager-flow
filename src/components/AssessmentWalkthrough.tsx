import React from 'react';

interface AssessmentWalkthroughProps {
    onStart: () => void;
}

const AssessmentWalkthrough: React.FC<AssessmentWalkthroughProps> = ({ onStart }) => {
    const steps = [
        {
            icon: (
                <svg className="w-6 h-6 md:w-8 md:h-8 text-[#98D048]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            title: "Read the Briefing",
            description: "Understand the scenario, your role, and the business challenge."
        },
        {
            icon: (
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            title: "Consult Resources",
            description: "Review key concepts and visual models to apply correct frameworks."
        },
        {
            icon: (
                <svg className="w-6 h-6 md:w-8 md:h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            ),
            title: "Take Action",
            description: "Scroll down to answer questions and solve the challenge."
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-[#001C2C]/80 backdrop-blur-md transition-opacity duration-300" />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#002b45] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#98D048]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            How to <span className="text-[#98D048]">Ace It</span>
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base">
                            Follow these steps to complete your assessment efficiently.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors duration-200"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    {step.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {index + 1}. {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onStart}
                            className="w-full py-4 px-6 bg-[#98D048] hover:bg-[#88c038] text-[#001C2C] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            Start Assessment
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentWalkthrough;
