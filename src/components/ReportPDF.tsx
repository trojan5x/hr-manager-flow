import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image
} from '@react-pdf/renderer';
import type { PhaseBreakdown } from './ResultsCard';
import type { AnswerSheetItem } from '../types';

// Theme colors
const colors = {
    darkBlue: '#002A44',
    green: '#7FC241',
    red: '#FF6B6B',
    lightBlue: '#4FC3F7',
    gray: '#666666',
    lightGray: '#f8f9fa',
    white: '#ffffff',
    text: '#333333',
    textLight: '#666666',
};

// Define styles - using built-in Helvetica font
const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
        backgroundColor: colors.white,
    },
    // Logo bar
    logoBar: {
        backgroundColor: colors.darkBlue,
        padding: '25px 40px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoTextSmall: {
        color: colors.white,
        fontSize: 10,
        textAlign: 'right',
    },
    // Content container
    content: {
        padding: '30px 40px',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.darkBlue,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 4,
    },
    headerRight: {
        textAlign: 'right',
    },
    headerDate: {
        fontSize: 11,
        color: colors.textLight,
    },
    // Report card
    reportCard: {
        backgroundColor: colors.lightGray,
        borderRadius: 8,
        padding: 25,
        marginBottom: 25,
        borderLeftWidth: 5,
        borderLeftColor: colors.green,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reportCardFail: {
        borderLeftColor: colors.red,
    },
    reportCardContent: {
        flex: 1,
        marginRight: 20,
    },
    congratsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.darkBlue,
        marginBottom: 6,
    },
    descText: {
        fontSize: 11,
        color: colors.textLight,
        lineHeight: 1.5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    statusBadge: {
        backgroundColor: colors.green,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 15,
    },
    statusBadgeFail: {
        backgroundColor: colors.red,
    },
    statusText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    topSkillText: {
        fontSize: 10,
        color: colors.textLight,
        marginLeft: 10,
    },
    // Score circle
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: colors.green,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    scoreCircleFail: {
        borderColor: colors.red,
    },
    scoreText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.green,
    },
    scoreTextFail: {
        color: colors.red,
    },
    // Section
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.darkBlue,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 8,
        marginTop: 20,
        marginBottom: 15,
    },
    summaryText: {
        fontSize: 11,
        color: colors.text,
        lineHeight: 1.6,
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#eee',
    },
    // Breakdown table
    breakdownRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    breakdownHeader: {
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 0,
    },
    breakdownPhase: {
        flex: 2,
        fontSize: 11,
        color: colors.text,
    },
    breakdownScore: {
        flex: 1,
        fontSize: 11,
        color: colors.text,
        textAlign: 'center',
    },
    breakdownProficiency: {
        flex: 1,
        fontSize: 11,
        textAlign: 'right',
    },
    breakdownHeaderText: {
        fontWeight: 'bold',
        color: '#444',
    },
    proficiencyExcellent: { color: colors.green },
    proficiencyGood: { color: colors.lightBlue },
    proficiencyAverage: { color: '#f59e0b' },
    proficiencyNeedsWork: { color: colors.red },
    // Answer sheet
    answerItem: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: colors.lightGray,
        borderRadius: 6,
    },
    questionText: {
        fontSize: 10,
        color: colors.text,
        marginBottom: 6,
        fontWeight: 'bold',
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    answerBox: {
        flex: 1,
        marginRight: 8,
    },
    answerLabel: {
        fontSize: 8,
        color: colors.textLight,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    answerText: {
        fontSize: 9,
        color: colors.text,
    },
    answerCorrect: { color: colors.green },
    answerWrong: { color: colors.red },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: colors.textLight,
        fontSize: 9,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    // Overview Stats
    overviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        gap: 10,
    },
    overviewBox: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
    },
    overviewLabel: {
        fontSize: 9,
        color: colors.textLight,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    overviewValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.darkBlue,
    },
    // Feedback Section
    feedbackContainer: {
        marginTop: 15,
        marginBottom: 20,
    },
    feedbackTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    feedbackItem: {
        marginBottom: 10,
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
    },
    strengthItem: {
        backgroundColor: '#f0fdf4', // light green bg
        borderLeftColor: colors.green,
    },
    weaknessItem: {
        backgroundColor: '#fef2f2', // light red bg
        borderLeftColor: colors.red,
    },
    feedbackCategory: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.darkBlue,
        marginBottom: 3,
    },
    feedbackText: {
        fontSize: 9,
        color: colors.text,
        lineHeight: 1.4,
    },
    feedbackSubtext: {
        fontSize: 8,
        marginTop: 4,
        fontStyle: 'italic',
    },
});

interface ReportPDFProps {
    score: number;
    role: string;
    breakdown: PhaseBreakdown[];
    aiSummary?: string;
    answerSheet?: AnswerSheetItem[];
    logos?: {
        learntube: string;
        google: string;
    };
    strengths?: { category: string; description: string; evidence: string }[];
    weaknesses?: { category: string; description: string; recommendation: string }[];
    overview?: {
        totalQuestions: number;
        correctAnswers: number;
        timeTaken: string;
    };
}

const getProficiencyStyle = (score: number) => {
    if (score >= 80) return styles.proficiencyExcellent;
    if (score >= 60) return styles.proficiencyGood;
    if (score >= 40) return styles.proficiencyAverage;
    return styles.proficiencyNeedsWork;
};

const getProficiencyLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
};

const ReportPDF: React.FC<ReportPDFProps> = ({
    score,
    role,
    breakdown,
    aiSummary,
    answerSheet,
    logos,
    strengths,
    weaknesses,
    overview
}) => {
    const isPassed = score >= 50;
    const bestPhase = breakdown.length > 0
        ? breakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current)
        : null;
    const date = new Date().toLocaleDateString();

    // Conditional styles - using object array type
    const reportCardStyle = [styles.reportCard, ...(isPassed ? [] : [styles.reportCardFail])];
    const statusBadgeStyle = [styles.statusBadge, ...(isPassed ? [] : [styles.statusBadgeFail])];
    const scoreCircleStyle = [styles.scoreCircle, ...(isPassed ? [] : [styles.scoreCircleFail])];
    const scoreTextStyle = [styles.scoreText, ...(isPassed ? [] : [styles.scoreTextFail])];

    // Calculate page height based on content
    // A rough estimation to ensure we don't chop content awkwardly if possible,
    // though react-pdf handles multiple pages automatically if wrap={false} is not set on Page (but we use it)
    // For simplicity, we'll let it flow naturally or increase size slightly if needed.
    // Given the dynamic content, removing fixed height calculation might be safer for multi-page,
    // but the requirement "renders as a single, long page" implies we want a custom viewport.
    // Let's estimate conservatively.
    const baseHeight = 900;
    const questionsHeight = (answerSheet?.length || 0) * 85;
    const summaryHeight = Math.min((aiSummary?.length || 0) * 0.35, 300);
    const feedbackHeight = ((strengths?.length || 0) + (weaknesses?.length || 0)) * 100;
    const pageHeight = baseHeight + questionsHeight + summaryHeight + feedbackHeight;

    return (
        <Document>
            <Page size={{ width: 595, height: pageHeight }} style={styles.page} wrap={false}>
                {/* Logo Bar */}
                <View style={styles.logoBar}>
                    {logos?.learntube ? (
                        <Image src={logos.learntube} style={{ height: 40, width: 124 }} />
                    ) : (
                        <Text style={styles.logoText}>LearnTube.ai</Text>
                    )}
                    {logos?.google ? (
                        <Image src={logos.google} style={{ height: 36, width: 124 }} />
                    ) : (
                        <View>
                            <Text style={styles.logoTextSmall}>backed by</Text>
                            <Text style={[styles.logoText, { fontSize: 12 }]}>Google for Startups</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Assessment Report</Text>
                            <Text style={styles.subtitle}>{role} Certification</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.headerDate}>Date: {date}</Text>
                            <Text style={styles.headerDate}>ID: #{Math.floor(Math.random() * 100000).toString().padStart(6, '0')}</Text>
                        </View>
                    </View>

                    {/* Report Card */}
                    <View style={reportCardStyle}>
                        <View style={styles.reportCardContent}>
                            <Text style={styles.congratsText}>
                                {isPassed ? 'Congratulations!' : 'Assessment Complete'}
                            </Text>
                            <Text style={styles.descText}>
                                {isPassed
                                    ? `You have successfully demonstrated the core competencies required for the ${role} certification.`
                                    : `Thank you for completing the assessment. Please review your results below to identify areas for improvement.`
                                }
                            </Text>
                            <View style={styles.statusRow}>
                                <View style={statusBadgeStyle}>
                                    <Text style={styles.statusText}>
                                        {isPassed ? 'Certified' : 'Completed'}
                                    </Text>
                                </View>
                                {bestPhase && (
                                    <Text style={styles.topSkillText}>
                                        Top Skill: {bestPhase.skill || bestPhase.phase} ({bestPhase.score}%)
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={scoreCircleStyle}>
                            <Text style={scoreTextStyle}>
                                {score}%
                            </Text>
                        </View>
                    </View>

                    {/* Overview Stats */}
                    {overview && (
                        <View style={styles.overviewContainer}>
                            <View style={styles.overviewBox}>
                                <Text style={styles.overviewLabel}>Total Questions</Text>
                                <Text style={styles.overviewValue}>{overview.totalQuestions}</Text>
                            </View>
                            <View style={styles.overviewBox}>
                                <Text style={styles.overviewLabel}>Correct Answers</Text>
                                <Text style={[styles.overviewValue, { color: colors.green }]}>{overview.correctAnswers}</Text>
                            </View>
                            <View style={styles.overviewBox}>
                                <Text style={styles.overviewLabel}>Time Taken</Text>
                                <Text style={[styles.overviewValue, { color: colors.lightBlue }]}>{overview.timeTaken}</Text>
                            </View>
                        </View>
                    )}

                    {/* AI Summary */}
                    <Text style={styles.sectionTitle}>Executive Summary</Text>
                    <Text style={styles.summaryText}>
                        {aiSummary || 'No summary available.'}
                    </Text>

                    {/* Performance Feedback */}
                    {((strengths && strengths.length > 0) || (weaknesses && weaknesses.length > 0)) && (
                        <View>
                            <Text style={styles.sectionTitle}>Performance Feedback</Text>

                            {/* Strengths */}
                            {strengths && strengths.length > 0 && (
                                <View style={styles.feedbackContainer}>
                                    <Text style={[styles.feedbackTitle, { color: colors.green }]}>Key Strengths</Text>
                                    {strengths.map((str, idx) => (
                                        <View key={idx} style={[styles.feedbackItem, styles.strengthItem]}>
                                            <Text style={styles.feedbackCategory}>{str.category}</Text>
                                            <Text style={styles.feedbackText}>{str.description}</Text>
                                            <Text style={[styles.feedbackSubtext, { color: colors.green }]}>"{str.evidence}"</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Weaknesses */}
                            {weaknesses && weaknesses.length > 0 && (
                                <View style={styles.feedbackContainer}>
                                    <Text style={[styles.feedbackTitle, { color: colors.red }]}>Areas for Improvement</Text>
                                    {weaknesses.map((weak, idx) => (
                                        <View key={idx} style={[styles.feedbackItem, styles.weaknessItem]}>
                                            <Text style={styles.feedbackCategory}>{weak.category}</Text>
                                            <Text style={styles.feedbackText}>{weak.description}</Text>
                                            <Text style={[styles.feedbackSubtext, { color: colors.red }]}>Rec: {weak.recommendation}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Breakdown */}
                    <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
                    <View style={[styles.breakdownRow, styles.breakdownHeader]}>
                        <Text style={[styles.breakdownPhase, styles.breakdownHeaderText]}>Phase</Text>
                        <Text style={[styles.breakdownScore, styles.breakdownHeaderText]}>Score</Text>
                        <Text style={[styles.breakdownProficiency, styles.breakdownHeaderText]}>Proficiency</Text>
                    </View>
                    {breakdown.map((phase, index) => (
                        <View key={index} style={styles.breakdownRow}>
                            <Text style={styles.breakdownPhase}>{phase.phase}</Text>
                            <Text style={styles.breakdownScore}>{phase.score}%</Text>
                            <Text style={[styles.breakdownProficiency, getProficiencyStyle(phase.score)]}>
                                {getProficiencyLabel(phase.score)}
                            </Text>
                        </View>
                    ))}

                    {/* Answer Sheet */}
                    {answerSheet && answerSheet.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Answer Sheet</Text>
                            {answerSheet.map((item, index) => (
                                <View key={index} style={styles.answerItem} wrap={false}>
                                    <Text style={styles.questionText}>{index + 1}. {item.question}</Text>
                                    <View style={styles.answerRow}>
                                        <View style={styles.answerBox}>
                                            <Text style={styles.answerLabel}>Your Answer</Text>
                                            <Text style={[styles.answerText, item.is_correct ? styles.answerCorrect : styles.answerWrong]}>
                                                {item.users_answer}
                                            </Text>
                                        </View>
                                        <View style={styles.answerBox}>
                                            <Text style={styles.answerLabel}>Correct Answer</Text>
                                            <Text style={[styles.answerText, styles.answerCorrect]}>
                                                {item.correct_answer}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated by LearnTube.ai • Empowering Careers with AI
                </Text>
            </Page>
        </Document>
    );
};

export default ReportPDF;
