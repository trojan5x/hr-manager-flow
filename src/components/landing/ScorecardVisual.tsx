import type { RoleData } from '../../types';

interface ScorecardVisualProps {
    className?: string;
    roleData?: RoleData | null;
}

const ScorecardVisual = ({ className = "", roleData = null }: ScorecardVisualProps) => {
    // Default stats if none provided
    const defaultStats = [
        { skill: "Strategic HR", percentage: 89 },
        { skill: "Talent Mgmt", percentage: 94 },
        { skill: "People Analytics", percentage: 78 },
        { skill: "Employee Relations", percentage: 92 },
        { skill: "HR Tech & Systems", percentage: 81 }
    ];

    const displayStats = roleData?.scorecard_stats || defaultStats;

    const getColor = (pct: number) => pct >= 85 ? "#98D048" : "#FCD34D";

    return (
        <div className={`glass-card p-4 md:p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:border-[#38BDF8]/30 transition-colors duration-300 ${className}`}>

            {/* Mock chart content */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="text-left">
                        <div className="text-xs text-white/40 uppercase tracking-widest">Sample Assessment</div>
                        <div className="text-white font-bold text-sm md:text-base">Professional Scorecard</div>
                    </div>
                    <div className="bg-white/10 text-white/60 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full border border-white/20">
                        SAMPLE REPORT
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    {displayStats.map((stat, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-white text-xs md:text-sm mb-1">
                                <span>{stat.skill}</span>
                                <span style={{ color: getColor(stat.percentage) }}>{stat.percentage}%</span>
                            </div>
                            <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${stat.percentage}%`,
                                        backgroundColor: getColor(stat.percentage),
                                        boxShadow: `0 0 10px ${getColor(stat.percentage)}80`
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
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
