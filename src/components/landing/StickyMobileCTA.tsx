import Button from '../Button';
import RotatingText from '../RotatingText';
import { Clock, TrendingUp, Globe } from 'lucide-react';
import { getCTAVariant } from '../../utils/localStorage';

interface StickyMobileCTAProps {
    onBeginAssessment: () => void;
    isLoading?: boolean;
}

const StickyMobileCTA = ({ onBeginAssessment, isLoading = false }: StickyMobileCTAProps) => {
    const ctaVariant = getCTAVariant();

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 lg:hidden animate-fade-in-up">
            <div className="bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <Button
                    variant="primary"
                    className={`w-full py-3 px-3 md:px-4 rounded-lg font-bold text-base md:text-lg shadow-[0_0_15px_rgba(152,208,72,0.3)] animate-pulsate-glow ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                    onClick={onBeginAssessment}
                    disabled={isLoading}
                >
                    {isLoading ? 'Starting...' : `${ctaVariant.ctaText} ->`}
                </Button>

                <div className="mt-2 text-center space-y-2">
                    {ctaVariant.useAnimatedSubtext ? (
                        <span className="text-white/60 text-xs font-medium flex items-center justify-center gap-2">
                            <RotatingText
                                messages={[
                                    <span key="1" className="flex items-center gap-2 justify-center">
                                        <Clock className="w-3.5 h-3.5 text-[#98D048]" />
                                        <span>Takes &lt; <span className="text-[#98D048] font-bold">10 mins</span></span>
                                    </span>,
                                    <span key="2" className="flex items-center gap-2 justify-center">
                                        <TrendingUp className="w-3.5 h-3.5 text-[#98D048]" />
                                        <span>Unlocks <span className="text-[#98D048] font-bold">100% higher salaries</span></span>
                                    </span>,
                                    <span key="3" className="flex items-center gap-2 justify-center">
                                        <Globe className="w-3.5 h-3.5 text-[#98D048]" />
                                        <span>Based on <span className="text-[#98D048] font-bold">Global Standards</span></span>
                                    </span>
                                ]}
                                interval={3000}
                                className="inline-block min-w-[200px]"
                            />
                        </span>
                    ) : (
                        <span className="text-white/60 text-xs font-medium flex items-center justify-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#98D048]" />
                            <span>{ctaVariant.staticSubtext}</span>
                        </span>
                    )}

                    {/* <div className="flex flex-row flex-wrap justify-center gap-2 text-[#38BDF8] text-[10px] font-medium">
                        <span className="flex items-center gap-1 bg-[#002B45]/50 px-2 py-1 rounded-full border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <span>Real-world scenarios</span>
                        </span>
                        <span className="flex items-center gap-1 bg-[#002B45]/50 px-2 py-1 rounded-full border border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            <span>Free instant report</span>
                        </span>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default StickyMobileCTA;

