import type { RoleData } from '../../types';

interface ProblemAgitationSectionProps {
    roleData: RoleData | null;
}

const ProblemAgitationSection = ({ roleData }: ProblemAgitationSectionProps) => {

    const displayRoleName = roleData?.role_name || "Professionals";

    // Default to the static frameworks if none are in the DB or loading
    const rawFrameworks = roleData?.frameworks?.length ? roleData.frameworks : ["CHRPx", "SHRBPx"];

    // Safely format the frameworks into a readable string
    const formattedFrameworks = rawFrameworks.length > 1
        ? `${rawFrameworks.slice(0, -1).join(', ')} and ${rawFrameworks[rawFrameworks.length - 1]}`
        : rawFrameworks[0] || "";


    return (
        <section className="py-10 px-4 md:px-6 relative overflow-hidden bg-[#001018]">
            {/* Abstract background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#EF4444]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#00385C]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-10 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Most Senior <br />{displayRoleName} Are <br /><span className="text-[#EF4444]">Underpaid by 40%</span>
                    </h2>
                    <p className="text-md text-white/70 leading-normal">
                        Your experience is valuable, but it's invisible to the global market. Without international benchmarking, you are paid based on local standards, not your true global worth.
                    </p>
                </div>

                <div className="flex md:grid md:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto pb-8 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0 snap-x snap-mandatory hide-scrollbar">
                    {/* Pain Point 1 */}
                    <div className="glass-card p-8 rounded-xl border-l-[3px] border-l-[#EF4444] hover:bg-white/[0.02] transition-colors group min-w-[280px] md:min-w-0 snap-center">
                        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#EF4444]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">The "Local" Ceiling</h3>
                        <p className="text-white/60 leading-relaxed">
                            You're capped at local salary bands. Meanwhile, certified peers are accessing global pay buckets for the exact same work you do daily.
                        </p>
                    </div>

                    {/* Pain Point 2 */}
                    <div className="glass-card p-8 rounded-xl border-l-[3px] border-l-[#EF4444] hover:bg-white/[0.02] transition-colors group min-w-[280px] md:min-w-0 snap-center">
                        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#EF4444]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Invisible Expertise</h3>
                        <p className="text-white/60 leading-relaxed">
                            You lead organizational growth, but without framework validation ({formattedFrameworks}), recruiters just see "years of experience" instead of "strategic leadership".
                        </p>
                    </div>

                    {/* Pain Point 3 */}
                    <div className="glass-card p-8 rounded-xl border-l-[3px] border-l-[#EF4444] hover:bg-white/[0.02] transition-colors group min-w-[280px] md:min-w-0 snap-center">
                        <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[#EF4444]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">ATS Filtering</h3>
                        <p className="text-white/60 leading-relaxed">
                            Global roles use automated filters. Without specific international framework keywords associated with your name, superior leadership experience gets discarded.
                        </p>
                    </div>
                </div>


                {/* <div className="mt-16 text-center">
                    <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto">
                        The solution isn't more courses. It's <span className="text-[#38BDF8] font-bold">validating your existing experience against Global Management Frameworks through real world scenarios</span>.
                    </p>
                </div> */}
            </div >
        </section >
    );
};

export default ProblemAgitationSection;
