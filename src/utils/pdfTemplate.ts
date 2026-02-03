import type { PhaseBreakdown } from '../components/ResultsCard';
import type { AnswerSheetItem } from '../types';

interface ReportTemplateProps {
    score: number;
    role: string;
    breakdown: PhaseBreakdown[];
    aiSummary?: string;
    answerSheet?: AnswerSheetItem[];
    date?: string;
    logos?: {
        learntube: string;
        google: string;
    };
}

export const generateReportHtml = ({
    score,
    role,
    breakdown,
    aiSummary,
    answerSheet,
    date = new Date().toLocaleDateString(),
    logos
}: ReportTemplateProps): string => {
    const isPassed = score >= 50;
    const statusColor = isPassed ? '#7FC241' : '#FF6B6B';
    const statusText = isPassed ? 'Certified' : 'Completed';

    // CSS styles defined inline for maximum compatibility with PDF generators
    // Using table layout instead of flexbox for better html2canvas compatibility
    const styles = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            color: #333; 
            line-height: 1.6; 
            width: 700px; 
            margin: 0 auto; 
            padding: 40px 50px; 
            background: white;
        }
        table { border-collapse: collapse; }
        .logo-bar { 
            width: calc(100% + 100px);
            margin-left: -50px;
            margin-right: -50px;
            margin-bottom: 30px; 
            padding: 25px 50px;
            background: #002A44;
        }
        .logo-bar td { vertical-align: middle; }
        .logo-bar td:first-child { text-align: left; }
        .logo-bar td:last-child { text-align: right; }
        .logo-container svg { height: 32px; width: auto; }
        .header { 
            width: 100%; 
            margin-bottom: 30px; 
        }
        .header td { vertical-align: top; }
        .header td:last-child { text-align: right; }
        .report-card { 
            background: #f8f9fa; 
            border-radius: 12px; 
            padding: 30px; 
            margin-bottom: 40px; 
            border-left: 6px solid ${statusColor}; 
        }
        .score-table { width: 100%; }
        .score-table td { vertical-align: middle; }
        .score-table td:last-child { text-align: right; width: 120px; }
        .score-circle { 
            width: 100px; 
            height: 100px; 
            border-radius: 50%; 
            border: 8px solid ${statusColor}; 
            background: white;
            display: table-cell;
            text-align: center;
            vertical-align: middle;
            font-weight: bold; 
            font-size: 24px; 
            color: ${statusColor}; 
        }
        .status-badge { 
            background: ${statusColor}; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 20px; 
            font-weight: bold; 
            font-size: 14px; 
            text-transform: uppercase; 
            display: inline-block;
            vertical-align: middle;
            line-height: 1;
            text-align: center;
        }
        .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 10px; 
            margin-top: 40px; 
            margin-bottom: 20px; 
            color: #002A44; 
        }
        .summary-text { 
            font-size: 15px; 
            text-align: justify; 
            color: #444; 
            background: #fff; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #eee; 
        }
        .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .breakdown-table th { text-align: left; padding: 12px; background: #f1f5f9; color: #444; font-size: 14px; }
        .breakdown-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: middle; }
        .progress-bar-bg { width: 80px; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 10px; }
        .progress-bar-fill { height: 100%; border-radius: 4px; display: block; }
        .footer { margin-top: 60px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
    `;

    // Calculate best phase
    const bestPhase = breakdown.length > 0
        ? breakdown.reduce((prev, current) => (prev.score > current.score) ? prev : current)
        : null;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Assessment Report - ${role}</title>
    <style>${styles}</style>
</head>
<body>
    ${logos ? `
    <table class="logo-bar">
        <tr>
            <td><div class="logo-container">${logos.learntube}</div></td>
            <td><div class="logo-container">${logos.google}</div></td>
        </tr>
    </table>
    ` : ''}
    <table class="header">
        <tr>
            <td>
                <h1 style="margin: 0; color: #002A44; font-size: 24px;">Assessment Report</h1>
                <p style="margin: 5px 0 0; color: #666;">${role} Certification</p>
            </td>
            <td style="text-align: right; font-size: 14px; color: #666;">
                <p style="margin: 0;">Date: ${date}</p>
                <p style="margin: 5px 0 0;">ID: #${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}</p>
            </td>
        </tr>
    </table>

    <!-- Report Card -->
    <div class="report-card">
        <table class="score-table">
            <tr>
                <td>
                    <h2 style="margin: 0 0 5px 0; color: #002A44;">${isPassed ? 'Congratulations!' : 'Assessment Complete'}</h2>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        ${isPassed 
                            ? `You have successfully demonstrated the core competencies required for the ${role} certification.` 
                            : `Thank you for completing the assessment. Please review your results below to identify areas for improvement.`
                        }
                    </p>
                    <div style="margin-top: 15px;">
                        <span class="status-badge">${statusText}</span>
                        ${bestPhase ? `<span style="margin-left: 10px; font-size: 12px; color: #666;">Top Skill: <strong>${bestPhase.phase}</strong> (${bestPhase.score}%)</span>` : ''}
                    </div>
                </td>
                <td>
                    <div class="score-circle">${score}%</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- AI Summary -->
    <h3 class="section-title">Executive Summary</h3>
    <div class="summary-text">
        ${aiSummary || 'No summary available.'}
    </div>

    <!-- Breakdown -->
    <h3 class="section-title">Performance Breakdown</h3>
    <table class="breakdown-table">
        <thead>
            <tr>
                <th width="40%">Phase</th>
                <th width="20%">Score</th>
                <th width="40%">Proficiency</th>
            </tr>
        </thead>
        <tbody>
            ${breakdown.map(phase => `
                <tr>
                    <td><strong>${phase.phase}</strong></td>
                    <td>
                         <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-weight: bold; width: 35px;">${phase.score}%</span>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${phase.score}%; background: ${phase.score >= 50 ? statusColor : '#FF6B6B'};"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span style="color: ${phase.score >= 80 ? '#7FC241' : phase.score >= 50 ? '#4FC3F7' : '#FF6B6B'}; font-weight: bold; font-size: 13px;">
                            ${phase.score >= 80 ? 'Excellent' : phase.score >= 60 ? 'Good' : phase.score >= 40 ? 'Average' : 'Needs Work'}
                        </span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- Answer Sheet -->
    ${answerSheet && answerSheet.length > 0 ? `
    <h3 class="section-title">Answer Sheet</h3>
    <table class="breakdown-table">
        <thead>
            <tr>
                <th width="40%">Question</th>
                <th width="30%">Your Answer</th>
                <th width="30%">Correct Answer</th>
            </tr>
        </thead>
        <tbody>
            ${answerSheet.map(item => `
                <tr>
                    <td>${item.question}</td>
                    <td style="color: ${item.is_correct ? '#7FC241' : '#FF6B6B'}">${item.users_answer}</td>
                    <td>${item.correct_answer}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <p>Generated by LearnTube.ai | Empowering Careers with AI</p>
    </div>
</body>
</html>
    `;
};
