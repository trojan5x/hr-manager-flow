const HowItWorksSection = () => {
    return (
        <section className="py-10 px-4 md:px-6 relative bg-gradient-to-b from-[#001C2C] to-[#00141F]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Get Benchmarked Against Global Standards & <span className="text-[#98D048]">Unlock Upto 100% Salary Hike!</span>
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#38BDF8] to-transparent"></div>
                        <div className="text-6xl font-black text-white/5 absolute top-4 right-4 group-hover:text-white/10 transition-colors">01</div>

                        <div className="relative z-10">
                            <div className="text-[#38BDF8] mb-6 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <path d="M16 13H8"></path>
                                    <path d="M16 17H8"></path>
                                    <path d="M10 9H8"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">5 Real-World Scenarios</h3>
                            <p className="text-white/60 leading-relaxed">
                                We will be solving 5 real-world scenarios. Each scenario has five questions that you need to answer to prove your expertise.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#98D048] to-transparent"></div>
                        <div className="text-6xl font-black text-white/5 absolute top-4 right-4 group-hover:text-white/10 transition-colors">02</div>

                        <div className="relative z-10">
                            <div className="text-[#98D048] mb-6 drop-shadow-[0_0_10px_rgba(152,208,72,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18"></path>
                                    <path d="M18 17V9"></path>
                                    <path d="M13 17V5"></path>
                                    <path d="M8 17v-3"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Phase-Wise Report</h3>
                            <p className="text-white/60 leading-relaxed">
                                After that, you'll get a phase-wise report for your assessment showing exactly how you performed across each skill.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#FCD34D] to-transparent"></div>
                        <div className="text-6xl font-black text-white/5 absolute top-4 right-4 group-hover:text-white/10 transition-colors">03</div>

                        <div className="relative z-10">
                            <div className="text-[#FCD34D] mb-6 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="7"></circle>
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Certification & Courses</h3>
                            <p className="text-white/60 leading-relaxed">
                                Lastly, you will have an option to get certified and also get personalized courses for each certificate that you pick.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
