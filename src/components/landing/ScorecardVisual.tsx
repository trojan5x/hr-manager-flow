
const ScorecardVisual = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`glass-card p-4 md:p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-[#38BDF8]/30 transition-colors duration-300 ${className}`}>

            {/* Mock chart content */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="text-left">
                        <div className="text-xs text-white/40 uppercase tracking-widest">Sample Assessment</div>
                        <div className="text-white font-bold text-sm md:text-base">HR Manager Scorecard</div>
                    </div>
                    <div className="bg-white/10 text-white/60 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full border border-white/20">
                        SAMPLE REPORT
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    <div>
                        <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                            <span>Strategic HR</span>
                            <span className="text-[#98D048]">89%</span>
                        </div>
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#98D048] w-[89%] shadow-[0_0_10px_rgba(152,208,72,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                            <span>Talent Mgmt</span>
                            <span className="text-[#98D048]">94%</span>
                        </div>
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#98D048] w-[94%] shadow-[0_0_10px_rgba(152,208,72,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                            <span>People Analytics</span>
                            <span className="text-[#FCD34D]">78%</span>
                        </div>
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FCD34D] w-[78%] shadow-[0_0_10px_rgba(252,211,77,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                            <span>Employee Relations</span>
                            <span className="text-[#98D048]">92%</span>
                        </div>
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#98D048] w-[92%] shadow-[0_0_10px_rgba(152,208,72,0.5)]"></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                            <span>HR Tech & Systems</span>
                            <span className="text-[#FCD34D]">81%</span>
                        </div>
                        <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#FCD34D] w-[81%] shadow-[0_0_10px_rgba(252,211,77,0.5)]"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                    <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/5 hover:border-[#38BDF8]/30 transition-colors">
                        <div className="text-[10px] md:text-xs text-gray-400 mb-1">Global Rank</div>
                        <div className="text-xl md:text-2xl font-bold text-white">Top 10%</div>
                    </div>
                    <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/5 hover:border-[#98D048]/30 transition-colors">
                        <div className="text-[10px] md:text-xs text-gray-400 mb-1">Salary Potential</div>
                        <div className="text-xl md:text-2xl font-bold text-[#98D048]">+35%</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScorecardVisual;
