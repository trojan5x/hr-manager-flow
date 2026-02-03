import React, { useState } from 'react';
import CircularProgress from './CircularProgress';
import { analytics } from '../services/analytics';
import type { AnswerSheetItem } from '../types';
// ReportPDF is dynamically imported in handleDownloadReport



export interface PhaseBreakdown {
    phase: string;
    score: number;
    maxScore: number;
    questions: number;
    correct: number;
    skill?: string;
}

interface ResultsCardProps {
    score: number;
    role?: string;
    className?: string;
    onClaimCertificates?: () => void;
    breakdown?: PhaseBreakdown[];
    aiSummary?: string;
    answerSheet?: AnswerSheetItem[];
    isGeneratingSummary?: boolean;
    strengths?: { category: string; description: string; evidence: string }[];
    weaknesses?: { category: string; description: string; recommendation: string }[];
    timeTakenInSeconds?: number | string;
    price?: number;
    originalPrice?: number;
    userName?: string;
    certificationCount?: number;
    hideCTA?: boolean;
    showTabs?: boolean;
    proficiencyBreakdown?: ProficiencyItem[];
}

export interface ProficiencyItem {
    proficiency_name: string;
    score: number;
}

const ResultsCard: React.FC<ResultsCardProps> = ({
    score,
    role = 'Professional',
    className = '',
    onClaimCertificates,
    breakdown,
    aiSummary,
    answerSheet,
    isGeneratingSummary = false,
    strengths,
    weaknesses,
    timeTakenInSeconds,
    userName,
    hideCTA = false,
    showTabs = true,
    proficiencyBreakdown
}) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [summaryProgress, setSummaryProgress] = useState(0);
    const [showSummaryContent, setShowSummaryContent] = useState(!isGeneratingSummary);
    const [isAiAnalysisExpanded, setIsAiAnalysisExpanded] = useState(false);
    const [expandedProficiencies, setExpandedProficiencies] = useState<number[]>([]); // Track expanded items
    const isPassed = score >= 50;

    const toggleProficiency = (idx: number) => {
        setExpandedProficiencies(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const [expandedStrengths, setExpandedStrengths] = useState<number[]>([]);
    const [expandedWeaknesses, setExpandedWeaknesses] = useState<number[]>([]);

    const toggleStrength = (idx: number) => {
        setExpandedStrengths(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const toggleWeakness = (idx: number) => {
        setExpandedWeaknesses(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    // Derived stats
    // Derived stats
    const totalQuestions = breakdown?.reduce((sum, item) => sum + item.questions, 0) || 20;
    const correctAnswers = breakdown?.reduce((sum, item) => sum + item.correct, 0) || 0;

    // Format time
    const formatTime = (seconds?: number | string) => {
        if (seconds === undefined || seconds === null) return '--:--';
        const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
        if (isNaN(num)) return '--:--';

        const mins = Math.floor(num / 60);
        const secs = Math.round(num % 60);
        return `${mins}m ${secs}s`;
    };

    // Handle Progress Animation
    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isGeneratingSummary) {
            setShowSummaryContent(false);
            setSummaryProgress(0);
            // Animate to 95% over 33s (approx 330 steps of 100ms)
            interval = setInterval(() => {
                setSummaryProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + 0.28;
                });
            }, 100);
        } else {
            // If generation stopped (finished or failed)
            if (aiSummary) {
                // Complete the bar
                setSummaryProgress(100);
                setTimeout(() => setShowSummaryContent(true), 600);
            } else {
                setShowSummaryContent(true);
            }
        }

        return () => clearInterval(interval);
    }, [isGeneratingSummary, aiSummary]);

    // Mock data generation function (fallback if no props)
    const generateMockBreakdown = (baseScore: number): PhaseBreakdown[] => [
        { phase: 'Core Concepts', score: Math.min(100, baseScore + 5), maxScore: 100, questions: 12, correct: Math.round(12 * (Math.min(100, baseScore + 5) / 100)) },
        { phase: 'Practical Application', score: Math.max(0, baseScore - 8), maxScore: 100, questions: 15, correct: Math.round(15 * (Math.max(0, baseScore - 8) / 100)) },
        { phase: 'Advanced Scenarios', score: Math.max(0, baseScore - 3), maxScore: 100, questions: 10, correct: Math.round(10 * (Math.max(0, baseScore - 3) / 100)) },
        { phase: 'Industry Best Practices', score: Math.min(100, baseScore + 2), maxScore: 100, questions: 8, correct: Math.round(8 * (Math.min(100, baseScore + 2) / 100)) }
    ];

    const currentBreakdown = breakdown || generateMockBreakdown(score);

    const getPerformanceLabel = (pScore: number) => {
        if (pScore >= 80) return { text: 'Excellent', color: 'text-[#7FC241]' };
        if (pScore >= 60) return { text: 'Good', color: 'text-[#4FC3F7]' };
        if (pScore >= 40) return { text: 'Average', color: 'text-yellow-500' };
        return { text: 'Needs Work', color: 'text-red-400' };
    };

    const getProficiencyLevel = (pScore: number) => {
        if (pScore >= 80) return { label: 'Excellent', color: 'bg-transparent border border-[#7FC241] text-[#7FC241]', barColor: 'bg-[#7FC241]', textColor: 'text-[#7FC241]' };
        if (pScore >= 60) return { label: 'Very Good', color: 'bg-transparent border border-[#4FC3F7] text-[#4FC3F7]', barColor: 'bg-[#4FC3F7]', textColor: 'text-[#4FC3F7]' };
        if (pScore >= 40) return { label: 'Good', color: 'bg-transparent border border-yellow-400 text-yellow-400', barColor: 'bg-yellow-400', textColor: 'text-yellow-400' };
        if (pScore >= 20) return { label: 'Fair', color: 'bg-transparent border border-orange-400 text-orange-400', barColor: 'bg-orange-400', textColor: 'text-orange-400' };
        return { label: 'Poor', color: 'bg-transparent border border-red-500 text-red-500', barColor: 'bg-red-500', textColor: 'text-red-500' };
    };

    const displayQuestions = answerSheet ? answerSheet.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        userAnswer: q.users_answer,
        correctAnswer: q.correct_answer,
        isCorrect: q.is_correct,
        phase: "",
        rationale: q.rationale
    })) : [];

    const getAISummary = () => {
        if (aiSummary) return aiSummary;
        if (isPassed) {

            const bestPhase = currentBreakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            const greeting = userName ? `Congratulations ${userName}` : "Congratulations";
            return `${greeting} on achieving certification! Your assessment demonstrates strong competency in ${role.toLowerCase()} skills with an overall score of ${score}%. You excelled particularly in ${bestPhase.phase} (${bestPhase.score}%) and showed solid understanding across all key areas. Your certification validates your expertise and readiness for professional challenges in this domain.`;
        } else {
            const bestPhase = currentBreakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            const greeting = userName ? `While you didn't meet the 50% threshold for certification this time, ${userName}` : "While you didn't meet the 50% threshold for certification this time";
            return `${greeting}, your assessment reveals important insights. You showed particular strength in ${bestPhase.phase} (${bestPhase.score}%). Focus on improving in areas where you scored below 50% and consider additional study in practical applications before retaking the assessment.`;
        }
    };


    const tabs = ['Overview', 'Breakdown', 'Answer Sheet'];

    const handleClaimCertificates = () => {
        if (onClaimCertificates) {
            onClaimCertificates();
        } else {
            const claimSection = document.getElementById('claim-certificates-section');
            if (claimSection) {
                claimSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleDownloadReport = async () => {
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const ReportPDF = (await import('./ReportPDF')).default;

            const svgToPngDataUrl = async (svgUrl: string, width: number, height: number): Promise<string> => {
                const response = await fetch(svgUrl);
                const svgText = await response.text();

                return new Promise((resolve) => {
                    const img = new window.Image();
                    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(svgBlob);

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                        }
                        URL.revokeObjectURL(url);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve('');
                    };
                    img.src = url;
                });
            };

            const [learntubeDataUrl, googleDataUrl] = await Promise.all([
                svgToPngDataUrl('/assets/learntube-logo.svg', 400, 80),
                svgToPngDataUrl('/assets/backed-by-google.svg', 400, 80)
            ]);

            const logoUrls = {
                learntube: learntubeDataUrl,
                google: googleDataUrl
            };

            const blob = await pdf(
                <ReportPDF
                    score={score}
                    role={role}
                    breakdown={currentBreakdown}
                    aiSummary={getAISummary()}
                    answerSheet={answerSheet}
                    logos={logoUrls.learntube && logoUrls.google ? logoUrls : undefined}
                    strengths={strengths}
                    weaknesses={weaknesses}
                    overview={{
                        totalQuestions,
                        correctAnswers,
                        timeTaken: formatTime(timeTakenInSeconds)
                    }}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Assessment_Report_${role.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            analytics.track('report_downloaded', { role: role, score: score });

        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert("There was an error generating the PDF report. Please try again.");
        }
    };

    const handleDownloadAnswerSheet = () => {
        console.log('Download answer sheet PDF clicked');
    };

    return (
        <div className={`relative w-full mx-auto overflow-visible ${className}`}>
            {/* Main Card */}
            <div
                className="rounded-2xl md:rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
                style={{
                    border: '1px solid transparent',
                    borderRadius: '1.5rem',
                    background: `
                        linear-gradient(180deg, #002A44 35%, #011B2C 100%) padding-box,
                        linear-gradient(180deg, #2674D3 0%, #133C6D 100%) border-box
                    `,
                    boxShadow: '0 0 30px 0 rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Helper for Badge to avoid duplication */}
                {(() => {
                    const statusBadge = isPassed ? (
                        <div className="flex items-center gap-1.5 bg-[#7FC241] text-black px-3 py-1 rounded-full shadow-lg border-2 border-[#002A44] animate-fade-in whitespace-nowrap">
                            <img src="/assets/check-badge.svg" alt="Certified" className="w-4 h-4" />
                            <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">Certified</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-[#FF6B6B] text-white px-3 py-1 rounded-full shadow-lg border-2 border-[#002A44] animate-fade-in whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">Failed</span>
                        </div>
                    );

                    return (
                        <div className="flex flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-10 mb-6 mt-4">
                            {/* Left Column: Circular Progress + Badge (Mobile Only) */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                {/* Circle Container */}
                                <div className="relative w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px]">
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-[#7FC241] opacity-20 blur-2xl rounded-full transform scale-110"></div>
                                    <CircularProgress
                                        percentage={score}
                                        size={160}
                                        strokeWidth={14}
                                        color={isPassed ? "#7FC241" : "#FF6B6B"}
                                        className="relative z-0 w-full h-full"
                                        subtitle={isPassed ? "Excellent" : "Good Try"}
                                    />
                                </div>

                                {/* Status Badge - Mobile Only (Below Circle) */}
                                <div className="mt-4 flex justify-center md:hidden">
                                    {statusBadge}
                                </div>
                            </div>

                            {/* Right: Text Content */}
                            <div className="text-left flex-1 py-1 sm:py-2">
                                <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
                                    {isPassed
                                        ? (userName ? `Great Performance, ${userName}!` : "Great Performance!")
                                        : (userName ? `Assessment Complete, ${userName}` : "Assessment Complete")
                                    }
                                </h2>
                                <p className="text-gray-300 text-xs sm:text-base leading-relaxed max-w-xl">
                                    {isPassed
                                        ? `You are in the top 10% of learners in this domain, placing you among the top-performing future ${role}s.`
                                        : "You've completed the assessment. Review your detailed breakdown below to identify areas for improvement before your next attempt."
                                    }
                                </p>

                                {/* Status Badge - Desktop Only (Below Text) */}
                                <div className="mt-4 hidden md:flex">
                                    {statusBadge}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* CTA Button */}
                {!hideCTA && (
                    <div className="mb-4">


                        {isPassed ? (
                            <>
                                <button
                                    onClick={handleClaimCertificates}
                                    className="w-full bg-[#7FC241] hover:bg-[#68A335] text-black font-extrabold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group mb-3"
                                >
                                    <span>Claim Your Global Certifications!</span>
                                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>


                            </>
                        ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-[#FF6B6B] hover:bg-[#FF5555] text-white font-extrabold text-lg py-4 rounded-xl shadow-lg transition-all duration-200"
                            >
                                Retake Assessment
                            </button>
                        )}

                        {/* Price Indication for Passed State - BELOW CTA */}

                    </div>
                )}

                {/* Download Link */}
                {!hideCTA && (
                    <div className="text-center mb-6">
                        <button
                            onClick={handleDownloadReport}
                            className="text-[#7FC241] hover:text-[#68A335] underline text-sm md:text-base font-medium transition-colors"
                        >
                            Download Report
                        </button>
                    </div>
                )}

                {/* Tabs Interface */}
                <div>
                    {/* Tab Navigation */}
                    {showTabs && (
                        <div className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        if (activeTab !== tab) {
                                            analytics.track('results_tab_viewed', { tab_name: tab });
                                        }
                                    }}
                                    className={`w-[105px] h-[30px] sm:w-auto sm:h-auto px-0 sm:px-6 sm:py-3 flex items-center justify-center text-xs sm:text-sm md:text-base font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                        ? 'bg-[#3B82F6] text-white shadow-md transform translate-y-0.5 z-10'
                                        : 'bg-[#133C6D] text-gray-400 hover:text-gray-200 hover:bg-[#133C6D]/80'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tab Content Container */}
                    <div className={`bg-[#021C30] border border-[#00385C] rounded-b-xl ${showTabs ? 'rounded-tr-xl' : 'rounded-t-xl'} p-6 shadow-inner`}>
                        {activeTab === 'Overview' && (
                            <div className="animate-fade-in p-1">
                                {/* Stats Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#4FC3F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Stats
                                    </h3>
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={isGeneratingSummary}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${isGeneratingSummary ? 'text-gray-500 cursor-not-allowed' : 'text-[#4FC3F7] hover:text-[#29b6f6]'
                                            }`}
                                    >
                                        {isGeneratingSummary ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="hidden sm:inline">Generating Report...</span>
                                                <span className="sm:hidden">Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                <span className="hidden sm:inline">Download Full Report</span>
                                                <span className="sm:hidden">Report</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Performance Stats Grid - Always visible */}
                                    <div className={`${showTabs ? 'grid grid-cols-2 md:grid-cols-4' : 'flex flex-col'} gap-4 pb-4 border-b border-white/10`}>
                                        <div className={`bg-[#0b273d] p-3 rounded-xl border border-white/5 ${showTabs ? 'text-center' : 'flex justify-between items-center'}`}>
                                            <div className={`text-gray-400 text-xs ${showTabs ? 'mb-1' : ''}`}>Total Questions</div>
                                            <div className="text-white font-bold text-lg">{totalQuestions}</div>
                                        </div>
                                        <div className={`bg-[#0b273d] p-3 rounded-xl border border-white/5 ${showTabs ? 'text-center' : 'flex justify-between items-center'}`}>
                                            <div className={`text-gray-400 text-xs ${showTabs ? 'mb-1' : ''}`}>Correct Answers</div>
                                            <div className="text-[#7FC241] font-bold text-lg">{correctAnswers}</div>
                                        </div>
                                        <div className={`bg-[#0b273d] p-3 rounded-xl border border-white/5 ${showTabs ? 'text-center' : 'flex justify-between items-center'}`}>
                                            <div className={`text-gray-400 text-xs ${showTabs ? 'mb-1' : ''}`}>Time Taken</div>
                                            <div className="text-blue-400 font-bold text-lg">{formatTime(timeTakenInSeconds)}</div>
                                        </div>
                                        <div className={`bg-[#0b273d] p-3 rounded-xl border border-white/5 ${showTabs ? 'text-center' : 'flex justify-between items-center'}`}>
                                            <div className={`text-gray-400 text-xs ${showTabs ? 'mb-1' : ''}`}>Status</div>
                                            <div className={`${isPassed ? 'text-[#7FC241]' : 'text-[#FF6B6B]'} font-bold text-lg uppercase`}>
                                                {isPassed ? 'Pass' : 'Fail'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proficiency Breakdown */}
                                    {proficiencyBreakdown && proficiencyBreakdown.length > 0 && (
                                        <div className="py-4 border-b border-white/10">
                                            <h3 className="text-white text-base font-bold mb-3">Proficiency Breakdown</h3>
                                            <div className="flex flex-col gap-3">
                                                {proficiencyBreakdown.map((item, idx) => {
                                                    const isExpanded = expandedProficiencies.includes(idx);
                                                    // Match by index as requested
                                                    const matchedPhase = breakdown && breakdown.length > idx ? breakdown[idx] : undefined;
                                                    const level = getProficiencyLevel(item.score);

                                                    return (
                                                        <div key={idx} className="bg-[#0b273d] rounded-xl border border-white/5 overflow-hidden transition-all duration-200 hover:border-white/10">
                                                            <button
                                                                onClick={() => toggleProficiency(idx)}
                                                                className="w-full p-4 flex flex-col gap-3 hover:bg-[#0c2d47] transition-colors"
                                                            >
                                                                <div className="w-full flex justify-between items-start gap-3">
                                                                    <span className="text-gray-200 text-sm font-semibold text-left flex-1" title={item.proficiency_name}>
                                                                        {item.proficiency_name}
                                                                    </span>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${level.textColor}`}>
                                                                        {level.label}
                                                                    </div>
                                                                </div>

                                                                <div className="w-full flex items-center gap-3">
                                                                    <div className="flex-1 h-1.5 bg-[#021C30] rounded-full overflow-hidden">
                                                                        <div className={`h-full ${level.barColor} transition-all duration-500 ease-out`} style={{ width: `${item.score}%` }}></div>
                                                                    </div>
                                                                    <span className={`text-xs font-bold w-9 text-right ${level.textColor || 'text-white'}`}>{Math.round(item.score)}%</span>
                                                                    <svg className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </button>

                                                            {isExpanded && (
                                                                matchedPhase ? (
                                                                    <div className="px-4 pb-4 animate-fade-in flex flex-col sm:flex-row justify-end gap-2 sm:gap-6 text-xs sm:text-sm border-t border-white/5 pt-3 bg-[#021C30]/30">
                                                                        <div className="text-gray-400 flex justify-between sm:justify-start gap-2">
                                                                            <span>Total Questions:</span>
                                                                            <span className="text-white font-medium">{matchedPhase.questions}</span>
                                                                        </div>
                                                                        <div className="text-gray-400 flex justify-between sm:justify-start gap-2">
                                                                            <span>Correct Answers:</span>
                                                                            <span className="text-[#7FC241] font-medium">{matchedPhase.correct}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="px-4 pb-4 pt-3 text-xs text-gray-500 text-right italic border-t border-white/5 bg-[#021C30]/30">
                                                                        Details currently unavailable
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Summary & Analysis Section - Collapsible */}
                                    <div className="border border-white/5 bg-[#0b273d]/50 rounded-xl overflow-hidden transition-all duration-300 mt-4">
                                        <button
                                            onClick={() => setIsAiAnalysisExpanded(!isAiAnalysisExpanded)}
                                            className="w-full flex items-center justify-between p-4 bg-[#0b273d] hover:bg-[#0c2d47] transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                                <span className="text-white text-lg font-bold">AI Summary & Analysis</span>
                                            </div>
                                            <svg
                                                className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${isAiAnalysisExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {isAiAnalysisExpanded && (
                                            <div className="p-4 border-t border-white/5 space-y-8 animate-fade-in">
                                                {/* AI Summary Text */}
                                                <div>
                                                    {!showSummaryContent ? (
                                                        <div className="py-4 px-4 flex flex-col items-center justify-center space-y-4">
                                                            <div className="w-full max-w-md h-2 bg-[#001829] rounded-full overflow-hidden border border-white/5">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#6366f1] transition-all duration-300 ease-out"
                                                                    style={{ width: `${summaryProgress}%` }}
                                                                />
                                                            </div>
                                                            <div className="text-xs text-gray-400 animate-pulse">
                                                                Generating detailed analysis... {Math.round(summaryProgress)}%
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-300 text-sm leading-relaxed">
                                                            {getAISummary()}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Performance Feedback */}
                                                {(isGeneratingSummary && (!strengths || strengths.length === 0)) ? (
                                                    <div className="pt-4 border-t border-white/10">
                                                        <div className="mb-6 px-1">
                                                            <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
                                                            <div className="h-4 w-64 bg-white/5 rounded animate-pulse"></div>
                                                        </div>
                                                        <div className="flex gap-4 overflow-x-hidden">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] bg-[#0b273d] p-5 rounded-2xl border border-white/5">
                                                                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-4"></div>
                                                                    <div className="space-y-2">
                                                                        <div className="h-3 w-full bg-white/5 rounded animate-pulse"></div>
                                                                        <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse"></div>
                                                                        <div className="h-3 w-4/6 bg-white/5 rounded animate-pulse"></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : ((strengths && strengths.length > 0) || (weaknesses && weaknesses.length > 0)) && (
                                                    <div className="pt-4 border-t border-white/10">
                                                        <div className="mb-6 px-1">
                                                            <h3 className="text-xl font-bold text-white mb-1">Performance Feedback</h3>
                                                            <p className="text-gray-400 text-sm">Detailed insights based on your assessment performance</p>
                                                        </div>

                                                        <div className="space-y-8">
                                                            {/* Key Strengths */}
                                                            {strengths && strengths.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[#7FC241] text-sm font-bold uppercase tracking-wider flex items-center gap-2 px-1">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        Key Strengths
                                                                    </h4>
                                                                    <div className="flex flex-col gap-3 -mx-1 px-1">
                                                                        {strengths.map((str, idx) => {
                                                                            const isExpanded = expandedStrengths.includes(idx);
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="bg-gradient-to-br from-[#0b273d] to-[#133C6D]/40 rounded-xl border border-white/5 transition-all duration-300 overflow-hidden"
                                                                                >
                                                                                    <button
                                                                                        onClick={() => toggleStrength(idx)}
                                                                                        className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                                                                                    >
                                                                                        <div className="font-bold text-white text-base flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                                                            <div className="bg-[#7FC241]/20 p-1 rounded-full flex-shrink-0">
                                                                                                <svg className="w-4 h-4 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                                            </div>
                                                                                            <span className={isExpanded ? 'whitespace-normal' : 'truncate'}>{str.category}</span>
                                                                                        </div>
                                                                                        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                        </svg>
                                                                                    </button>

                                                                                    {isExpanded && (
                                                                                        <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                                                            <p className="text-gray-300 text-sm leading-relaxed mb-3 mt-2">{str.description}</p>
                                                                                            <div className="text-[#7FC241] text-xs font-medium italic border-t border-white/5 pt-3">
                                                                                                "{str.evidence}"
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Areas for Improvement */}
                                                            {weaknesses && weaknesses.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[#FF6B6B] text-sm font-bold uppercase tracking-wider flex items-center gap-2 px-1">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                        Areas for Improvement
                                                                    </h4>
                                                                    <div className="flex flex-col gap-3 -mx-1 px-1">
                                                                        {weaknesses.map((weak, idx) => {
                                                                            const isExpanded = expandedWeaknesses.includes(idx);
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="bg-[#0b273d] rounded-xl border border-white/5 transition-all duration-300 overflow-hidden"
                                                                                >
                                                                                    <button
                                                                                        onClick={() => toggleWeakness(idx)}
                                                                                        className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                                                                                    >
                                                                                        <div className="font-bold text-white text-base flex items-center gap-3 min-w-0 flex-1 mr-2">
                                                                                            <div className="bg-[#FF6B6B]/20 p-1 rounded-full flex-shrink-0">
                                                                                                <svg className="w-4 h-4 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                                            </div>
                                                                                            <span className={isExpanded ? 'whitespace-normal' : 'truncate'}>{weak.category}</span>
                                                                                        </div>
                                                                                        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                        </svg>
                                                                                    </button>

                                                                                    {isExpanded && (
                                                                                        <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                                                            <p className="text-gray-300 text-sm leading-relaxed mb-3 mt-2">{weak.description}</p>
                                                                                            <div className="text-[#FF6B6B] text-xs font-medium border-t border-white/5 pt-3">
                                                                                                Recommendation: {weak.recommendation}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Breakdown' && (
                            <div className="animate-fade-in space-y-8">
                                {/* Phase Scores */}
                                <div className="space-y-3">
                                    <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Phase Performance</h4>
                                    {currentBreakdown.map((phase, index) => {
                                        const perf = getPerformanceLabel(phase.score);
                                        return (
                                            <div key={index} className="bg-[#0b273d] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-3 gap-3">
                                                    <div className="flex-1 min-w-0 max-w-[60%] sm:max-w-none">
                                                        <h4 className="text-white font-semibold text-sm md:text-base break-words">{phase.phase}</h4>
                                                        <span className={`text-xs font-medium ${perf.color}`}>{perf.text}</span>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <span className="text-lg md:text-xl font-bold text-white">{phase.score}%</span>
                                                    </div>
                                                </div>

                                                <div className="h-2 bg-[#001829] rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${phase.score >= 70 ? 'bg-[#7FC241]' :
                                                            phase.score >= 50 ? 'bg-[#4FC3F7]' : 'bg-red-400'
                                                            }`}
                                                        style={{ width: `${phase.score}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-gray-400">
                                                    <span>Questions Correct</span>
                                                    <span className="text-gray-300">{phase.correct} <span className="text-gray-500">/ {phase.questions}</span></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Key Strengths & Areas for Improvement moved to Performance Feedback section */}
                            </div>
                        )}

                        {activeTab === 'Answer Sheet' && (
                            <div className="animate-fade-in flex flex-col h-full">
                                <div className="text-center pb-4 flex-shrink-0">
                                    <button
                                        onClick={handleDownloadAnswerSheet}
                                        className="text-[#3B82F6] hover:text-[#60A5FA] text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Download Full Answer Sheet PDF
                                    </button>
                                </div>
                                <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent flex-1 -mr-2 pr-4 custom-scrollbar" style={{ maxHeight: '600px' }}>
                                    {displayQuestions.map(q => (
                                        <div key={q.id} className="bg-[#0b273d] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            {/* Question Header */}
                                            <div className="flex gap-2.5 mb-2">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${q.isCorrect ? 'bg-[#7FC241]/20 text-[#7FC241]' : 'bg-red-500/20 text-red-400'}`}>
                                                    {q.id}
                                                </div>
                                                <p className="text-white text-sm font-medium leading-snug">{q.question}</p>
                                            </div>

                                            {/* Answers Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 pl-0 sm:pl-8">
                                                {/* User Answer */}
                                                <div className={`p-2.5 rounded-lg border ${q.isCorrect ? 'bg-[#7FC241]/10 border-[#7FC241]/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Your Answer</p>
                                                    <div className="flex items-start gap-1.5">
                                                        {q.isCorrect ? (
                                                            <svg className="w-3.5 h-3.5 text-[#7FC241] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        )}
                                                        <span className={`text-xs sm:text-sm ${q.isCorrect ? 'text-[#7FC241]' : 'text-red-400'}`}>{q.userAnswer}</span>
                                                    </div>
                                                </div>

                                                {/* Correct Answer */}
                                                <div className="p-2.5 rounded-lg bg-[#021C30] border border-white/5">
                                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Correct Answer</p>
                                                    <div className="flex items-start gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-[#7FC241] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span className="text-xs sm:text-sm text-gray-200">{q.correctAnswer}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rationale */}
                                            <div className="pl-0 sm:pl-8">
                                                <div className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-[#3B82F6]/30 pl-3 py-1 ml-1 sm:ml-0">
                                                    <span className="text-[#3B82F6] not-italic font-semibold mr-1">Rationale:</span>
                                                    {q.rationale}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </div >
    );
};

export default ResultsCard;
