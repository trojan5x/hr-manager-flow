import { useState } from 'react';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "Is this another online course?",
            answer: "No. This is a skills validation assessment. While we provide self-paced learning modules based on your gaps, the primary goal is to benchmark your existing experience."
        },
        {
            question: "I don't have 40 hours for this.",
            answer: "You get 45 minutes, but most users complete the assessment in under 20 minutes. If you choose to pursue certification, the learning modules are self-paced (3-8 hours total)."
        },
        {
            question: "Will recruiters recognize this?",
            answer: "Yes. Our certifications are backed by rigorous standards aligned with Global HR Certification (CHRPx, SHRBPx) competencies and industry-recognized strategic HR frameworks, making them highly credible for senior roles."
        },
        {
            question: "What happens if I don't pass?",
            answer: "This is a benchmarking tool, not a pass/fail exam. You receive a percentile score. If you want to improve your score, you can take the targeted micro-courses and re-assess."
        },
        {
            question: "Is this suitable for beginners?",
            answer: "Absolutely. The assessment adapts to your level. If you're a beginner, it identifies your starting point and builds a custom path to proficiency."
        },
        {
            question: "How soon can I get certified?",
            answer: "Most users complete the assessment in under 20 minutes. If you meet the criteria, you can get certified instantly. If you need training, our micro-modules average 3-8 hours."
        },
        {
            question: "Is my payment secure?",
            answer: "Yes, 100%. We use industry-leading encryption and trusted payment processors. Your data is never shared with third parties."
        },
        {
            question: "Do I get lifetime access?",
            answer: "Yes! Once you enroll, you have lifetime access to the learning materials, future updates, and your certification dashboard."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-12 px-4 md:px-6 bg-[#001C2C]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-white/60 text-sm md:text-base">
                        Everything you need to know about the process
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`glass-card rounded-lg overflow-hidden transition-all duration-300 h-fit ${openIndex === index ? 'border-[#98D048] ring-1 ring-[#98D048]/20 bg-[#98D048]/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                            <button
                                className="w-full text-left p-4 md:p-5 flex justify-between items-start focus:outline-none gap-4"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span className={`text-base font-semibold transition-colors duration-200 ${openIndex === index ? 'text-[#98D048]' : 'text-white'}`}>
                                    {faq.question}
                                </span>
                                <span className={`flex-shrink-0 text-[#98D048] transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                    {openIndex === index ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                </span>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-4 md:p-5 pt-0 text-white/70 text-sm leading-relaxed">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Risk Reversal / Trust Badge */}
                <div className="mt-10 flex flex-wrap justify-center items-center gap-6 md:gap-10 text-white/60 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#98D048]" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#98D048]" />
                        <span>Verified Certification</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#98D048]" />
                        <span>Lifetime Access</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
