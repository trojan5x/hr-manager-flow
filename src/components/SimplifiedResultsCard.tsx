import React from 'react';
import CircularProgress from './CircularProgress';
import type { AnswerSheetItem } from '../types';
import { analytics } from '../services/analytics';
import type { PhaseBreakdown } from './ResultsCard';

export interface SimplifiedResultsCardProps {
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
}

const SimplifiedResultsCard: React.FC<SimplifiedResultsCardProps> = ({
    score,
    role = 'Professional',
    className = '',
    breakdown,
    aiSummary,
    answerSheet,
    isGeneratingSummary = false,
    strengths,
    weaknesses,
    timeTakenInSeconds,
}) => {
    const isPassed = score >= 50;

    // Derived stats
    const totalQuestions = 36;
    const correctAnswers = breakdown?.reduce((sum, item) => sum + item.correct, 0) || 0;

    const formatTime = (seconds?: number | string) => {
        if (seconds === undefined || seconds === null) return '--:--';
        const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
        if (isNaN(num)) return '--:--';
        const mins = Math.floor(num / 60);
        const secs = Math.round(num % 60);
        return `${mins}m ${secs}s`;
    };

    // Mock data generation if missing (same as original card)
    const generateMockBreakdown = (baseScore: number): PhaseBreakdown[] => [
        { phase: 'Core Concepts', score: Math.min(100, baseScore + 5), maxScore: 100, questions: 12, correct: Math.round(12 * (Math.min(100, baseScore + 5) / 100)) },
        { phase: 'Practical Application', score: Math.max(0, baseScore - 8), maxScore: 100, questions: 15, correct: Math.round(15 * (Math.max(0, baseScore - 8) / 100)) },
        { phase: 'Advanced Scenarios', score: Math.max(0, baseScore - 3), maxScore: 100, questions: 10, correct: Math.round(10 * (Math.max(0, baseScore - 3) / 100)) },
        { phase: 'Industry Best Practices', score: Math.min(100, baseScore + 2), maxScore: 100, questions: 8, correct: Math.round(8 * (Math.min(100, baseScore + 2) / 100)) }
    ];
    const currentBreakdown = React.useMemo(() => {
        if (!breakdown || breakdown.length === 0) return generateMockBreakdown(score);

        const groups: Record<string, { correct: number; total: number; skill: string }> = {};

        breakdown.forEach(item => {
            const key = item.skill || item.phase;
            if (!groups[key]) {
                groups[key] = { correct: 0, total: 0, skill: key };
            }
            groups[key].correct += item.correct;
            groups[key].total += item.questions;
        });

        return Object.values(groups).map(g => ({
            phase: g.skill,
            score: g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0,
            maxScore: 100,
            questions: g.total,
            correct: g.correct,
            skill: g.skill
        }));
    }, [breakdown, score]);

    const getPerformanceLabel = (pScore: number) => {
        if (pScore >= 80) return { text: 'Excellent', color: 'text-[#7FC241]' };
        if (pScore >= 60) return { text: 'Good', color: 'text-[#4FC3F7]' };
        if (pScore >= 40) return { text: 'Average', color: 'text-yellow-500' };
        return { text: 'Needs Work', color: 'text-red-400' };
    };

    const getAISummary = () => {
        if (aiSummary) return aiSummary;
        if (isPassed) {
            const bestPhase = currentBreakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            return `Congratulations on achieving certification! Your assessment demonstrates strong competency in ${role.toLowerCase()} skills with an overall score of ${score}%. You excelled particularly in ${bestPhase.phase} (${bestPhase.score}%) and showed solid understanding across all key areas. Your certification validates your expertise and readiness for professional challenges in this domain.`;
        } else {
            const bestPhase = currentBreakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            return `While you didn't meet the 50% threshold for certification this time, your assessment reveals important insights. You showed particular strength in ${bestPhase.phase} (${bestPhase.score}%). Focus on improving in areas where you scored below 50% and consider additional study in practical applications before retaking the assessment.`;
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

    return (
        <div className={`w-full mx-auto ${className}`}>
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
                {/* Top Section: Progress + Message */}
                <div className="flex flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-10 mb-8 mt-4">
                    <div className="flex-shrink-0 relative w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px]">
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

                    <div className="text-left flex-1 py-1 sm:py-2">
                        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
                            {isPassed ? "Great Performance!" : "Assessment Complete"}
                        </h2>
                        <p className="text-gray-300 text-xs sm:text-base leading-relaxed max-w-xl">
                            {isPassed
                                ? `You've scored higher than 85% of learners in this domain. This result qualifies you for the official ${role} certifications.`
                                : "Review your detailed breakdown to identifying areas for improvement."
                            }
                        </p>
                        {isPassed && (
                            <div className="mt-3 inline-flex items-center gap-1.5 bg-[#7FC241] text-white px-3 py-1 rounded-full shadow-md">
                                <span className="text-xs font-bold tracking-wide uppercase">Status: Certified</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-8 mt-8">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#051a29] p-3 rounded-xl border border-white/5 text-center">
                            <div className="text-gray-400 text-xs mb-1">Total Questions</div>
                            <div className="text-white font-bold text-lg">{totalQuestions}</div>
                        </div>
                        <div className="bg-[#051a29] p-3 rounded-xl border border-white/5 text-center">
                            <div className="text-gray-400 text-xs mb-1">Correct Answers</div>
                            <div className="text-[#7FC241] font-bold text-lg">{correctAnswers}</div>
                        </div>
                        <div className="bg-[#051a29] p-3 rounded-xl border border-white/5 text-center">
                            <div className="text-gray-400 text-xs mb-1">Time Taken</div>
                            <div className="text-blue-400 font-bold text-lg">{formatTime(timeTakenInSeconds)}</div>
                        </div>
                        <div className="bg-[#051a29] p-3 rounded-xl border border-white/5 text-center">
                            <div className="text-gray-400 text-xs mb-1">Status</div>
                            <div className={`${isPassed ? 'text-[#7FC241]' : 'text-[#FF6B6B]'} font-bold text-lg uppercase`}>
                                {isPassed ? 'Pass' : 'Fail'}
                            </div>
                        </div>
                    </div>

                    {/* AI Summary with Loader */}
                    {(aiSummary || isGeneratingSummary) && (
                        <div className="bg-[#051a29] p-4 rounded-xl border border-white/5">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick Summary
                            </h3>
                            {aiSummary ? (
                                <p className="text-gray-300 text-sm leading-relaxed">{aiSummary}</p>
                            ) : (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-full"></div>
                                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                                    <div className="h-4 bg-white/10 rounded w-4/6"></div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

                    {/* Skill Breakdown */}
                    <div className="space-y-4">
                        <h4 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Skill Breakdown</h4>
                        {currentBreakdown.map((phase, index) => {
                            const perf = getPerformanceLabel(phase.score);
                            return (
                                <div key={index} className="bg-[#051a29] p-3 sm:p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-medium text-sm sm:text-base">{phase.phase}</span>
                                        <span className={`text-sm font-bold ${perf.color}`}>{phase.score}%</span>
                                    </div>
                                    <div className="h-2 bg-[#001829] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${phase.score >= 70 ? 'bg-[#7FC241]' : phase.score >= 50 ? 'bg-[#4FC3F7]' : 'bg-red-400'}`}
                                            style={{ width: `${phase.score}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Strengths & Weaknesses (Compact & Loading State) */}
                    {(strengths?.length || weaknesses?.length || isGeneratingSummary) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {/* Strengths */}
                            <div className="space-y-3">
                                <h4 className="text-[#7FC241] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Your Strengths
                                </h4>
                                {strengths && strengths.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {strengths.map((str, idx) => (
                                            <div key={idx} className="bg-[#051a29] p-3 rounded-lg border border-[#7FC241]/20">
                                                <h5 className="text-white text-sm font-bold mb-1">{str.category}</h5>
                                                <p className="text-gray-400 text-xs leading-snug mb-1">{str.description}</p>
                                                <p className="text-[#7FC241] text-[10px] italic">"{str.evidence}"</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : isGeneratingSummary ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-20 bg-[#051a29] rounded-lg border border-white/5"></div>
                                        <div className="h-20 bg-[#051a29] rounded-lg border border-white/5"></div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-xs italic">No specific strengths identified.</p>
                                )}
                            </div>

                            {/* Weaknesses */}
                            <div className="space-y-3">
                                <h4 className="text-[#FF6B6B] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Areas for Improvement
                                </h4>
                                {weaknesses && weaknesses.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {weaknesses.map((weak, idx) => (
                                            <div key={idx} className="bg-[#051a29] p-3 rounded-lg border border-[#FF6B6B]/20">
                                                <h5 className="text-white text-sm font-bold mb-1">{weak.category}</h5>
                                                <p className="text-gray-400 text-xs leading-snug mb-1">{weak.description}</p>
                                                <div className="text-[#FF6B6B] text-[10px]">
                                                    <span className="uppercase font-bold opacity-70">Rec:</span> {weak.recommendation}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : isGeneratingSummary ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-20 bg-[#051a29] rounded-lg border border-white/5"></div>
                                        <div className="h-20 bg-[#051a29] rounded-lg border border-white/5"></div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-xs italic">No specific weaknesses identified.</p>
                                )}
                            </div>
                        </div>
                    ) : null}

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

                    {/* Download Button */}
                    <div className="text-center pt-2">
                        <button
                            onClick={handleDownloadReport}
                            className="bg-[#2674D3] hover:bg-[#133C6D] text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Full Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimplifiedResultsCard;
