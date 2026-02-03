import React from 'react';

interface SocialProofSectionProps {
    className?: string;
}

const SocialProofSection: React.FC<SocialProofSectionProps> = ({ className = '' }) => {
    return (
        <section className={`w-full max-w-4xl mx-auto ${className}`}>
            <div className="">
                <h2 className="text-2xl font-medium text-center text-white">
                    Join 11 Lakh+ <span className="text-[#98D048] font-bold">Successful Professionals</span>
                </h2>

                {/* Google Reviews Card */}
                <div
                    className="mt-6 bg-[#052030]/80 border border-white/10 rounded-lg py-3 px-[18px] flex gap-3 items-center backdrop-blur-sm"
                >
                    <img
                        src="https://assets.learntube.ai/files/new%20Linkedin%20data/flat-color-icons_google.png?updatedAt=1746712486058"
                        width="32"
                        height="32"
                        alt="Google"
                        className="flex-shrink-0"
                    />
                    <div className="text-white flex-1">
                        <div className="flex items-center gap-2 leading-[100%] flex-wrap">
                            <p className="text-xs">
                                <span className="text-sm font-bold">4.6</span> <span className="underline underline-offset-1 text-gray-300">500+ reviews</span>
                            </p>
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div key={i}>
                                        <img
                                            src="https://assets.learntube.ai/files/new%20Linkedin%20data/Star%202.png?updatedAt=1746712968842"
                                            width="14"
                                            height="14"
                                            alt="Star"
                                        />
                                    </div>
                                ))}
                                <div className="-ml-0.5">
                                    <img
                                        src="https://assets.learntube.ai/files/new%20Linkedin%20data/Component%2024.png?updatedAt=1746712968970"
                                        width="18"
                                        height="18"
                                        alt="Half Star"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-1.5 text-[10px] sm:text-xs font-medium text-gray-400 leading-[100%]">
                            ‘Phenomenal’ Google Reviews
                        </div>
                    </div>
                </div>

                {/* Social Stats Grid */}
                <div className="flex items-center gap-2 mt-4">
                    {/* Instagram */}
                    <div
                        className="flex-1 p-3 rounded-lg text-center border border-white/10"
                        style={{ backgroundImage: 'linear-gradient(180deg, #2E5CA4 0%, #244779 50%, #22426D 100%)' }}
                    >
                        <img
                            src="https://assets.learntube.ai/files/New%20Analysis%20Page/iconoirinstagram.png?updatedAt=1741594398733"
                            className="h-6 w-auto mx-auto"
                            width="24"
                            height="24"
                            alt="Instagram"
                        />
                        <div className="mt-3">
                            <div>
                                <span className="text-lg sm:text-xl font-semibold text-white">137K+</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-gray-200">Instagram</p>
                            <p className="mt-0.5 text-xs text-white/50">Followers</p>
                        </div>
                    </div>

                    {/* LinkedIn */}
                    <div
                        className="flex-1 p-3 rounded-lg text-center border border-white/10"
                        style={{ backgroundImage: 'linear-gradient(180deg, #2E5CA4 0%, #244779 50%, #22426D 100%)' }}
                    >
                        <img
                            src="https://assets.learntube.ai/files/New%20Analysis%20Page/lalinkedinin.svg?updatedAt=1741594540696"
                            className="h-6 w-auto mx-auto"
                            width="24"
                            height="24"
                            alt="LinkedIn"
                        />
                        <div className="mt-3">
                            <div>
                                <span className="text-lg sm:text-xl font-semibold text-white">29K+</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-gray-200">LinkedIn</p>
                            <p className="mt-0.5 text-xs text-white/50">Followers</p>
                        </div>
                    </div>

                    {/* YouTube */}
                    <div
                        className="flex-1 p-3 rounded-lg text-center border border-white/10"
                        style={{ backgroundImage: 'linear-gradient(180deg, #2E5CA4 0%, #244779 50%, #22426D 100%)' }}
                    >
                        <img
                            src="https://assets.learntube.ai/files/New%20Analysis%20Page/antdesignyoutubeoutlined.png?updatedAt=1742415091834"
                            className="h-6 w-auto mx-auto"
                            width="24"
                            height="24"
                            alt="YouTube"
                        />
                        <div className="mt-3">
                            <div>
                                <span className="text-lg sm:text-xl font-semibold text-white">12K+</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-gray-200">YouTube</p>
                            <p className="mt-0.5 text-xs text-white/50">Subscribers</p>
                        </div>
                    </div>
                </div>

                {/* Verified By */}
                <div className="mt-6 p-3 flex gap-3 items-center justify-center bg-white/5 rounded-lg border border-white/5">
                    <img
                        src="https://assets.learntube.ai/files/New%20Analysis%20Page/gurantee.svg?updatedAt=1741348750192"
                        alt="Verified"
                        className="w-5 h-5"
                    />
                    <p className="text-xs text-white/50 uppercase tracking-widest font-medium">Verified By</p>
                    <img
                        src="https://assets.learntube.ai/files/New%20Analysis%20Page/meta.png?updatedAt=1741597546128"
                        height="24"
                        width="55"
                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                        alt="Meta"
                    />
                    <div className="text-sm font-medium text-white/30">&</div>
                    <img
                        src="https://assets.learntube.ai/files/New%20Analysis%20Page/google_play-logo_brandlogos.net_dj8yw%201.png?updatedAt=1741597638494"
                        height="24"
                        width="82"
                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                        alt="Google Play"
                    />
                </div>

                {/* Email Support */}
                <a
                    href="mailto:hello@careerninja.in"
                    className="flex items-center gap-2 justify-center text-xs text-gray-400 hover:text-white transition-colors underline py-4 mt-2"
                >
                    <img
                        src="https://assets.learntube.ai/files/New%20Analysis%20Page/icroundemail.svg?updatedAt=1741597772315"
                        alt="Email"
                        className="w-4 h-4 opacity-70"
                    />
                    hello@careerninja.in
                </a>
            </div>
        </section>
    );
};

export default SocialProofSection;
