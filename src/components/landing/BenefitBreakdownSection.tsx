import ScorecardVisual from './ScorecardVisual';
import type { RoleData } from '../../types';

interface BenefitBreakdownSectionProps {
    roleData: RoleData | null;
}

const BenefitBreakdownSection = ({ roleData }: BenefitBreakdownSectionProps) => {

    const displayRoleName = roleData?.role_name || "HR";

    // Default to the static frameworks if none are in the DB or loading
    const rawFrameworks = roleData?.frameworks?.length ? roleData.frameworks : ["Strategic HR, Talent Management"];

    // Safely format the frameworks into a readable string
    const formattedFrameworks = rawFrameworks.length > 1
        ? `${rawFrameworks.slice(0, -1).join(', ')}, and ${rawFrameworks[rawFrameworks.length - 1]}`
        : rawFrameworks[0] || "";


    return (
        <section className="py-20 px-4 md:px-6 relative bg-[#00141F]">
            <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Column: Benefits */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                        Transform Your Experience Into <span className="text-[#38BDF8]">Career Leverage</span>
                    </h2>

                    <div className="space-y-8">
                        {/* Benefit 1 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Objectively Prove Your Skills</h3>
                                <p className="text-white/60 leading-relaxed">
                                    Move beyond "I think I'm good" to "I am in the top 12% globally." Replace opinions with verified data during interviews.
                                </p>
                            </div>
                        </div>

                        {/* Benefit 2 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="22" y1="12" x2="18" y2="12"></line>
                                    <line x1="6" y1="12" x2="2" y2="12"></line>
                                    <line x1="12" y1="6" x2="12" y2="2"></line>
                                    <line x1="12" y1="22" x2="12" y2="18"></line>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Beat ATS Filters</h3>
                                <p className="text-white/60 leading-relaxed">
                                    Recruiting systems look for keywords. Your certification verifies {formattedFrameworks} skills, ensuring your resume gets seen.
                                </p>
                            </div>
                        </div>

                        {/* Benefit 3 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="20" x2="12" y2="10"></line>
                                    <line x1="18" y1="20" x2="18" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="16"></line>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Negotiate For More</h3>
                                <p className="text-white/60 leading-relaxed">
                                    Don't just ask for a raise; justify it. Use your Global Rank and specialized {displayRoleName} competence to anchor your salary negotiations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visual */}
                <div className="w-full relative">
                    {/* Sample Scorecard Visual */}
                    {/* Sample Scorecard Visual */}
                    <ScorecardVisual roleData={roleData} />
                </div>
            </div>
        </section>
    );
};

export default BenefitBreakdownSection;
