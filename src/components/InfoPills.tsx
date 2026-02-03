import React from 'react';

interface InfoCard {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}

interface InfoCardsProps {
    cards?: InfoCard[];
    className?: string;
}

const defaultCards: InfoCard[] = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 lg:w-7 lg:h-7">
                <path d="M7 14l3-3 3 3 5-5" stroke="#98D048" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8h4v4" stroke="#98D048" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: "Unlock 40%",
        subtitle: "Higher Salaries"
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 lg:w-7 lg:h-7">
                <circle cx="12" cy="12" r="10" stroke="#98D048" strokeWidth="2" />
                <polyline points="12,6 12,12 16,14" stroke="#98D048" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: "Quick 40-min",
        subtitle: "Assessment"
    }
];

const InfoCards: React.FC<InfoCardsProps> = ({ cards = defaultCards, className = '' }) => {
    return (
        <div className={`flex flex-col min-[425px]:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 animate-fade-in-up animation-delay-800 ${className}`}>
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="
                        group relative overflow-hidden
                        flex items-center gap-3 lg:gap-4 
                        bg-[#002840]/60 backdrop-blur-md 
                        border border-[#98D048]/20 hover:border-[#98D048]/50
                        px-3 py-2 lg:px-5 lg:py-3 
                        rounded-xl 
                        transition-all duration-300 ease-out
                        hover:bg-[#003050]/80 hover:shadow-[0_0_20px_rgba(152,208,72,0.1)]
                    "
                >
                    {/* Icon Container */}
                    <div className="
                        w-10 h-10 lg:w-12 lg:h-12 
                        flex-shrink-0 rounded-xl 
                        border border-[#98D048]/30 bg-[#98D048]/10 
                        flex items-center justify-center
                        group-hover:scale-110 transition-transform duration-300
                    ">
                        {card.icon}
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm lg:text-base font-bold tracking-wide truncate leading-tight">
                            {card.title}
                        </span>
                        <span className="text-gray-400 text-xs lg:text-sm truncate font-medium mt-0.5 group-hover:text-gray-300 transition-colors">
                            {card.subtitle}
                        </span>
                    </div>

                    {/* Subtle Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#98D048]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
            ))}
        </div>
    );
};

export default InfoCards;
