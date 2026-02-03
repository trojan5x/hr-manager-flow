import React from 'react';

const stories = [
    {
        name: "Shubham Chavan",
        company: "Microsoft",
        image: "/assets/profile-images/image copy.png"
    },
    {
        name: "Riya Sharma",
        company: "Google",
        image: "/assets/profile-images/image.png"
    },
    {
        name: "Arjun Verma",
        company: "Amazon",
        image: "/assets/profile-images/image copy 3.png"
    },
    {
        name: "Meera Patel",
        company: "Netflix",
        image: "/assets/profile-images/image copy 2.png"
    }
];

interface SuccessStoriesSectionProps {
    className?: string;
    role?: string;
}

const SuccessStoriesSection: React.FC<SuccessStoriesSectionProps> = ({ className = '', role = 'Professional' }) => {

    return (
        <section className={`w-full py-4 ${className}`}>
            <div className="text-center mb-4">
                <p className="text-gray-400 text-sm sm:text-lg font-medium mb-1">Your Score Aligns With Professionals Who</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Advanced Into Roles At:
                </h3>
            </div>

            <div className="flex flex-nowrap gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2 md:flex-wrap md:justify-center md:gap-4 md:mx-0 md:px-0 md:overflow-visible">
                {stories.map((story, index) => (
                    <div
                        key={index}
                        className="snap-center flex-shrink-0 w-[200px] md:w-[240px] p-2.5 relative overflow-hidden flex items-center gap-3 group hover:-translate-y-1 transition-transform duration-300"
                        style={{
                            border: '1px solid transparent',
                            borderRadius: '0.75rem',
                            background: `
                                linear-gradient(180deg, #002A44 35%, #011B2C 100%) padding-box,
                                linear-gradient(180deg, #2674D3 0%, #133C6D 100%) border-box
                            `
                        }}
                    >
                        {/* Profile Image */}
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                            <img
                                src={story.image}
                                alt={story.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Divider */}
                        <div className="h-8 w-px bg-white/10 border-r border-dotted border-white/20"></div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <h4 className="text-white font-bold text-sm truncate leading-tight">{story.name}</h4>
                            <div className="mt-0.5">
                                <p className="text-gray-400 text-[10px] sm:text-xs">{role} @</p>
                                <p className="text-white font-bold text-xs sm:text-sm">{story.company}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* +1000 More Card */}
                <div
                    className="snap-center flex-shrink-0 w-[200px] md:w-[240px] p-2.5 relative overflow-hidden flex items-center gap-3 group cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                    style={{
                        border: '1px solid transparent',
                        borderRadius: '0.75rem',
                        background: `
                            linear-gradient(180deg, #002A44 35%, #011B2C 100%) padding-box,
                            linear-gradient(180deg, #2674D3 0%, #133C6D 100%) border-box
                        `
                    }}
                >
                    {/* Avatars Stack */}
                    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#0b273d] bg-gray-600 overflow-hidden z-10">
                            <img src="/assets/profile-images/image.png" className="w-full h-full object-cover opacity-70" alt="" />
                        </div>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#0b273d] bg-gray-500 overflow-hidden z-20">
                            <img src="/assets/profile-images/image copy.png" className="w-full h-full object-cover opacity-70" alt="" />
                        </div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#0b273d] bg-[#7FC241] flex items-center justify-center z-30">
                            <span className="text-white text-[9px] font-bold">+1k</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/10 border-r border-dotted border-white/20"></div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h4 className="text-[#7FC241] font-bold text-sm truncate leading-tight">1,000+ Others</h4>
                        <div className="mt-0.5">
                            <p className="text-white font-bold text-xs sm:text-sm">Have Advanced</p>
                            <p className="text-gray-400 text-[10px] sm:text-xs">Their Careers</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SuccessStoriesSection;
