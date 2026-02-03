import Button from '../Button';
import { getCTAVariant } from '../../utils/localStorage';

interface FinalCTASectionProps {
    onBeginAssessment: () => void;
    isLoading?: boolean;
    role?: string;
}

const FinalCTASection = ({ onBeginAssessment, isLoading = false, role = "Professional" }: FinalCTASectionProps) => {
    const ctaVariant = getCTAVariant();

    return (
        <section className="py-24 px-4 md:px-6 relative bg-gradient-to-t from-[#000811] to-[#001C2C] text-center">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                    Stop Explaining Your Experience. <br />
                    <span className="text-[#98D048]">Start Proving It.</span>
                </h2>

                <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
                    In the next 45 minutes, you can discover your {role} percentile and get proof of competencies recruiters scan for.
                </p>

                <div className="flex flex-col items-center">
                    <Button
                        variant="primary"
                        className={`text-xl py-6 px-12 rounded-lg font-bold shadow-[0_0_40px_rgba(152,208,72,0.3)] animate-pulsate-glow hover:scale-105 transition-transform duration-300 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                        onClick={onBeginAssessment}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : `${ctaVariant.ctaText} ->`}
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default FinalCTASection;
