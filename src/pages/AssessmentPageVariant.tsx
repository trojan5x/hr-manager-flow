import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import lottie from 'lottie-web';
import AssessmentProgressBar from '../components/AssessmentProgressBar';
import TopBar from '../components/TopBar';
import { fetchBundleScenarios, updateProgressWithRetry } from '../services/api';
import {
    getStoredBundleId,
    getStoredSessionId,
    storeAnswersBackup,
    getStoredAnswersBackup,
    clearAnswersBackup,
    storeProgressBackup,
    getStoredProgressBackup,
    clearProgressBackup,
    clearAssessmentData
} from '../utils/localStorage';
import { analytics } from '../services/analytics';
import type { Scenario, ScenariosResponse, UserAnswer, ProgressUpdateRequest } from '../types';

const AssessmentPageVariant = () => {
    const [searchParams] = useSearchParams();
    const assessmentId = searchParams.get('id');


    // Assessment state
    const [currentPhase, setCurrentPhase] = useState(1);
    const [isBriefingExpanded, setIsBriefingExpanded] = useState(true);
    const [expandedSections, setExpandedSections] = useState<{ scenario: boolean, challenge: boolean, task: boolean }>({
        scenario: false,
        challenge: false,
        task: false
    }); // For mobile truncation
    const [activeTab, setActiveTab] = useState<'scenario' | 'reference'>('scenario');
    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);


    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [completedScenarios, setCompletedScenarios] = useState(0);
    const [showPhaseCompletion, setShowPhaseCompletion] = useState(false);
    const [showNextPhaseButton, setShowNextPhaseButton] = useState(false);
    const [showAssessmentComplete, setShowAssessmentComplete] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [autoProgressTime, setAutoProgressTime] = useState(0); // 0-100 progress percentage

    // Completion state
    const [isCompleted, setIsCompleted] = useState(false); // Changed to mutable state

    // API-related state
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [scenariosProgress, setScenariosProgress] = useState({ ready: 0, total: 5, generating: 0, pending: 5 });
    const [isLoadingScenario, setIsLoadingScenario] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [bundleId, setBundleId] = useState<string | null>(null);

    // Progress saving state
    const [answersSaved, setAnswersSaved] = useState(0);
    const [cumulativeTime, setCumulativeTime] = useState(0); // Total time in seconds from previous sessions

    // Initial loading state
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
    const initialLoadStartTime = useRef(Date.now()); // To track loading duration
    const phaseStartTime = useRef(Date.now()); // Track start time of current phase

    // Cosmos animation refs
    const animationContainer = useRef<HTMLDivElement>(null);
    const animationInstance = useRef<any>(null);

    // Initialize bundle ID and restore backup data from localStorage
    useEffect(() => {
        const storedBundleId = getStoredBundleId();
        if (storedBundleId) {
            setBundleId(storedBundleId);
            analytics.track('assessment_loading_started', { bundle_id: storedBundleId });

            // Restore answers backup
            const backupAnswers = getStoredAnswersBackup(storedBundleId);
            if (backupAnswers.length > 0) {
                setUserAnswers(backupAnswers);
                console.log(`Restored ${backupAnswers.length} answers from backup`);
            }

            // Restore progress backup
            const backupProgress = getStoredProgressBackup(storedBundleId);
            if (backupProgress) {
                setCurrentPhase(backupProgress.currentScenario);
                setCompletedScenarios(backupProgress.completedScenarios);
                setAnswersSaved(backupProgress.answersSaved);
                setCumulativeTime(backupProgress.cumulativeTime);
                console.log('Restored progress from backup:', backupProgress);
            }
        } else {
            setApiError('No assessment bundle found. Please restart the assessment.');
        }
    }, []);

    // Poll for scenario data - only re-run when bundleId changes, not on phase change
    useEffect(() => {
        if (!bundleId) return;

        let pollingInterval: ReturnType<typeof setTimeout>;
        let isPollingActive = true; // Track if polling should continue

        const pollScenarios = async () => {
            if (!isPollingActive) return;

            try {
                setApiError(null);
                const response: ScenariosResponse = await fetchBundleScenarios(bundleId);

                setScenarios(response.data.scenarios);
                setScenariosProgress(response.data.progress);

                console.log('Loaded scenarios:', response.data.scenarios.length, 'Progress:', response.data.progress);

                // Check if first scenario is ready for initial loading
                const firstScenario = response.data.scenarios.find(s => s.scenario_id === 1);
                if (firstScenario?.status === 'ready') {
                    setIsInitialLoading(false);
                    setIsLoadingScenario(false);
                }

                // Stop polling when ALL scenarios are ready AND no reference material is generating
                // We check reference_status explicitly because 'ready' status might leverage the fact that 
                // scenario+quiz are done to let the user start, even while reference is still generating.
                const anyReferenceGenerating = response.data.scenarios.some(s => s.status === 'generating');
                const allReady = response.data.progress.total > 0 &&
                    response.data.progress.ready === response.data.progress.total &&
                    !anyReferenceGenerating;

                if (allReady) {
                    console.log('All scenarios and references ready, stopping poll');
                    isPollingActive = false;
                    return; // Stop polling
                }

                // Continue polling if scenarios are still generating
                if (isPollingActive) {
                    pollingInterval = setTimeout(pollScenarios, 3000); // Poll every 3 seconds
                }

            } catch (error) {
                console.error('Error polling scenarios:', error);
                setApiError(error instanceof Error ? error.message : 'Failed to load scenarios');
                // Retry after error (but limit retries in production)
                if (isPollingActive) {
                    pollingInterval = setTimeout(pollScenarios, 5000);
                }
            }
        };

        // Start polling immediately
        pollScenarios();

        return () => {
            isPollingActive = false;
            if (pollingInterval) {
                clearTimeout(pollingInterval);
            }
        };
    }, [bundleId]); // Only re-run when bundleId changes, not on phase change

    // Backup answers whenever they change
    useEffect(() => {
        if (bundleId && userAnswers.length > 0) {
            storeAnswersBackup(bundleId, userAnswers);
        }
    }, [userAnswers, bundleId]);

    // Backup progress whenever it changes
    useEffect(() => {
        if (bundleId) {
            storeProgressBackup(bundleId, {
                currentScenario: currentPhase,
                completedScenarios: completedScenarios,
                answersSaved: answersSaved,
                cumulativeTime: cumulativeTime
            });
        }
    }, [bundleId, currentPhase, completedScenarios, answersSaved]);

    // 30-second timeout for initial loading
    useEffect(() => {
        if (isInitialLoading) {
            const timeoutTimer = setTimeout(() => {
                setShowTimeoutMessage(true);
            }, 30000); // 30 seconds

            return () => {
                clearTimeout(timeoutTimer);
            };
        } else {
            // Reset timeout message when loading is complete
            setShowTimeoutMessage(false);
        }
    }, [isInitialLoading]);

    // Initialize cosmos animation for loading screen
    useEffect(() => {
        if (isInitialLoading && animationContainer.current) {
            // Load and play the Cosmos animation
            animationInstance.current = lottie.loadAnimation({
                container: animationContainer.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/assets/Cosmos.json'
            });
        }

        // Cleanup function
        return () => {
            if (animationInstance.current) {
                animationInstance.current.destroy();
                animationInstance.current = null;
            }
        };
    }, [isInitialLoading]);

    // Track assessment loading completed
    useEffect(() => {
        if (!isInitialLoading && bundleId) {
            const duration = (Date.now() - initialLoadStartTime.current) / 1000;
            analytics.track('assessment_loading_completed', {
                bundle_id: bundleId,
                duration_seconds: duration
            });
        }
    }, [isInitialLoading, bundleId]);

    // Track phase start
    useEffect(() => {
        const currentScenarioData = scenarios.find(s => s.scenario_id === currentPhase);
        if (currentScenarioData && !isInitialLoading && !isCompleted) {
            analytics.track('phase_started', {
                phase_number: currentPhase,
                phase_name: currentScenarioData.scenario_name || `Phase ${currentPhase}`
            });
        }
    }, [currentPhase, scenarios, isInitialLoading, isCompleted]);

    // Assessment phases
    const phases = [
        'Initiating',
        'Planning',
        'Executing',
        'Monitoring & Controlling',
        'Closing'
    ];

    // Short labels for progress bar
    const phaseLabels = [
        'Init',
        'Plan',
        'Exec',
        'Monitor',
        'Close'
    ];

    // Function to get scenario briefing for each phase from API data
    const getScenarioBriefing = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (!scenario) {
            return {
                scenario: "Loading scenario...",
                challenge: "Please wait while we prepare your assessment.",
                task: "Scenario content will appear once ready.",
                goal: ""
            };
        }

        return {
            scenario: scenario.project_mandate.business_problem,
            challenge: scenario.phase_description,
            task: scenario.project_mandate.high_level_goal,
            goal: scenario.project_mandate.initial_budget
        };
    };

    // Function to get reference keywords for each phase from API data
    const getReferenceKeywords = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (!scenario || !scenario.reference_materials || !scenario.reference_materials.key_concepts) {
            return [];
        }

        return scenario.reference_materials.key_concepts;
    };


    // Function to get keyword definitions from API data
    const getKeywordDefinition = (_keyword: string) => {
        // Definitions are not available in the new data structure
        return "Definition not available in this version.";
    };

    // Function to get assessment title from scenario data
    const getAssessmentTitle = () => {
        if (scenarios.length > 0) {
            // Get the skill name from the first scenario as they should all be the same skill
            return scenarios[0].skill_name;
        }
        return "Assessment";
    };

    // Function to get current phase skill name from scenario data
    const getCurrentPhaseSkillName = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (scenario) {
            return scenario.skill_name;
        }
        // Fallback to general assessment title
        return getAssessmentTitle();
    };

    // Function to get current phase name from scenario data
    const getCurrentPhaseName = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (scenario) {
            return scenario.scenario_name || scenario.skill_name;
        }
        // Fallback to hardcoded phases if scenario not found
        return phases[phase - 1] || "Phase " + phase;
    };

    // Function to get questions for each phase from API data
    const getPhaseQuestions = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (!scenario || !scenario.questions || scenario.questions.length === 0) {
            return [];
        }

        return scenario.questions.map(q => ({
            id: q.question_id,
            question: q.question_text,
            options: q.options.map(o => o.text),
            correct: q.options.findIndex(o => o.is_correct)
        }));
    };

    // Function to scroll to top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Save scenario completion with answers
    const saveScenarioCompletion = async (scenarioIndex: number, finalAnswer?: UserAnswer) => {
        const sessionId = getStoredSessionId();
        if (!sessionId) {
            console.error('No session ID found, cannot save progress');
            return;
        }

        try {
            // Get answers for the current scenario
            const phaseQuestions = getPhaseQuestions(scenarioIndex);
            let scenarioAnswers = userAnswers.filter(answer =>
                phaseQuestions.some(q => q.id === answer.question_id)
            );

            // Include the final answer if provided (to handle race condition)
            if (finalAnswer && !scenarioAnswers.some(a => a.question_id === finalAnswer.question_id)) {
                scenarioAnswers.push(finalAnswer);
            }

            // Get scenario details
            const currentScenario = scenarios.find(s => s.scenario_id === scenarioIndex);

            // Build the new format with attempt_object
            const progressData: ProgressUpdateRequest = {
                session_id: Number(sessionId),
                attempt_object: {
                    phase_number: scenarioIndex, // 1-based phase number
                    phase_name: currentScenario ? (currentScenario.scenario_name || currentScenario.skill_name) : (phases[scenarioIndex - 1] || `Phase ${scenarioIndex}`),
                    scenario_id: currentScenario ? currentScenario.scenario_id : 0,
                    time_taken_in_seconds: Math.round((Date.now() - phaseStartTime.current) / 1000), // ✨ Calculate time taken in seconds
                    phase_user_answers: scenarioAnswers.map(answer => ({
                        question_id: answer.question_id,
                        selected_option: answer.selected_option
                    }))
                },
                time_taken_in_seconds: cumulativeTime + Math.round((Date.now() - phaseStartTime.current) / 1000) // ✨ Total time so far
            };

            console.log('Saving scenario completion:', progressData);

            const response = await updateProgressWithRetry(progressData);

            // Update local state on success
            setCompletedScenarios(prev => prev + 1);
            setAnswersSaved(prev => prev + scenarioAnswers.length);
            // Update cumulative time
            setCumulativeTime(prev => prev + Math.round((Date.now() - phaseStartTime.current) / 1000));

            // Show success feedback
            console.log(`Scenario ${scenarioIndex} completed! Progress saved.`, response);

        } catch (error) {
            console.error('Failed to save scenario completion:', error);

            // Still increment local counter for UI consistency
            setCompletedScenarios(prev => prev + 1);
        } finally {
            // Progress saving completed
        }
    };

    // Clear all backups when assessment is completed
    const clearAllBackups = () => {
        if (bundleId) {
            clearAnswersBackup(bundleId);
            clearProgressBackup(bundleId);
            clearAssessmentData(); // Clear all assessment related data
            console.log('Cleared all assessment backups');
        }
    };



    // Handle moving to next phase
    const handleNextPhase = () => {
        // Track phase completion
        analytics.track('phase_completed', {
            phase_number: currentPhase,
            phase_name: getCurrentPhaseName(currentPhase),
            total_questions_answered: getPhaseQuestions(currentPhase).length
        });

        // Move to next phase and scroll to top
        setCurrentPhase(currentPhase + 1);
        setCurrentQuestionIndex(0);

        setShowPhaseCompletion(false);
        setShowNextPhaseButton(false);

        // Scroll to top to read the new scenario
        scrollToTop();

        // Expand briefing for new phase
        setIsBriefingExpanded(true);
        setActiveTab('scenario');

        // Reset phase timer
        phaseStartTime.current = Date.now();
    };

    // Handle phase submission
    const handlePhaseSubmit = () => {
        // Validation: Ensure all questions are answered
        const phaseQuestions = getPhaseQuestions(currentPhase);
        const answeredCount = userAnswers.filter(a => phaseQuestions.some(q => q.id === a.question_id)).length;

        if (answeredCount < phaseQuestions.length) {
            // Should be covered by UI disabled state, but safety check
            return;
        }

        // Phase completed - show completion animation
        setShowPhaseCompletion(true);

        // Save using the LAST answered question logic or just save completion
        // We pass the last answer just to satisfy the function signature if needed, or update saveScenarioCompletion to be more flexible
        // For now, we just save the completion.
        saveScenarioCompletion(currentPhase);

        // Show next phase button after animation completes and start auto-progress
        setTimeout(() => {
            if (currentPhase < phases.length) { // Not the final phase
                setShowNextPhaseButton(true);
                // Start auto-progress animation
                setAutoProgressTime(0);
            } else {
                // All phases completed - show assessment complete animation
                setShowPhaseCompletion(false);
                setShowAssessmentComplete(true);
                setShowConfetti(true);
                setIsCompleted(true); // Mark assessment as completed

                // Track assessment completed
                analytics.track('assessment_completed', {
                    total_phases: phases.length,
                    bundle_id: bundleId
                });

                // Clear all backups since assessment is completed
                clearAllBackups();

                // After assessment complete animation, navigate to contact form
                setTimeout(() => {
                    // Navigate to contact details page
                    window.location.href = `/contact-details?id=${assessmentId}`;
                }, 4000); // 4 seconds for full celebration
            }
        }, 2500); // 2.5 seconds for completion animation
    };

    // Handle answer selection (update state only)
    const handleAnswerSelection = (questionId: number, answerIndex: number) => {
        if (showPhaseCompletion) return;

        const selectedOption = ['a', 'b', 'c', 'd'][answerIndex] as 'a' | 'b' | 'c' | 'd';
        const finalAnswer: UserAnswer = { question_id: questionId, selected_option: selectedOption };

        // Save answer in structured format
        setUserAnswers(prev => {
            const existing = prev.findIndex(a => a.question_id === questionId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = finalAnswer;
                return updated;
            }
            return [...prev, finalAnswer];
        });

        // No auto-advance logic here
    };

    // Auto-progress countdown effect - triggers when showNextPhaseButton is true
    useEffect(() => {
        if (!showNextPhaseButton || currentPhase >= phases.length) return;

        // Animate progress from 0 to 100 over 3 seconds
        const totalDuration = 3000; // 3 seconds
        const intervalMs = 50; // Update every 50ms for smooth animation
        const increment = (100 / totalDuration) * intervalMs;

        const progressInterval = setInterval(() => {
            setAutoProgressTime(prev => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(progressInterval);
                    // Auto-transition to next phase
                    handleNextPhase();
                    return 100;
                }
                return next;
            });
        }, intervalMs);

        return () => {
            clearInterval(progressInterval);
            setAutoProgressTime(0);
        };
    }, [showNextPhaseButton, currentPhase, phases.length]);



    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.keyword-button') && !target.closest('.keyword-tooltip')) {
                setActiveKeyword(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Show loading screen while waiting for first scenario
    if (isInitialLoading) {
        return (
            <div className="min-h-screen text-white font-sans flex flex-col relative" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <div className="flex-1 flex items-center justify-center px-4 md:px-6 lg:px-8">
                    <div className="w-full max-w-2xl text-center">

                        {/* Cosmos Animation */}
                        <div className="mb-8 flex justify-center">
                            <div
                                ref={animationContainer}
                                className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"
                            />
                        </div>

                        {/* Loading Text */}
                        <div className="space-y-6">
                            <div className="animate-fade-in-up">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                                    Preparing Your
                                    <br />
                                    <span className="text-[#98D048]">Assessment</span>
                                </h1>
                            </div>

                            <div className="animate-fade-in-up animation-delay-300">
                                <p className="text-lg md:text-xl text-gray-300">
                                    {showTimeoutMessage
                                        ? "Almost ready! Just a few more moments..."
                                        : "Generating scenarios..."
                                    }
                                </p>
                            </div>

                            {/* Progress indicator */}
                            <div className="animate-fade-in-up animation-delay-500">
                                <p className="text-sm text-gray-400">
                                    {scenariosProgress.ready} of {scenariosProgress.total} scenarios ready
                                </p>
                            </div>

                            {/* Loading Steps */}
                            <div className="animate-fade-in-up animation-delay-700">
                                <div className="text-sm text-gray-400 space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-[#98D048] rounded-full animate-pulse" />
                                        <span>Creating assessment scenarios</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-gray-600 rounded-full" />
                                        <span>Preparing reference materials</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-gray-600 rounded-full" />
                                        <span>Generating quiz questions</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeout message */}
                            {!showTimeoutMessage && (
                                <div className="animate-fade-in-up animation-delay-1000">
                                    <p className="text-xs text-gray-500">
                                        This usually takes 30-60 seconds
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pinch to zoom handlers removed

    return (
        <>
            <div className="min-h-screen text-white font-sans flex flex-col relative" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                {/* Top Bar with Logos */}
                <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                    <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                        <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                        <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                        <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                    </div>
                </TopBar>

                {/* Confetti Animation */}
                {showConfetti && (
                    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                        {[...Array(150)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute animate-confetti-fall"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2.5 + Math.random() * 1.5}s`
                                }}
                            >
                                <div
                                    className={`w-2 h-2 ${['bg-[#98D048]', 'bg-blue-500', 'bg-red-500', 'bg-yellow-400', 'bg-purple-500'][Math.floor(Math.random() * 5)]
                                        }`}
                                    style={{
                                        clipPath: Math.random() > 0.5 ? 'circle(50%)' : Math.random() > 0.5 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                                        transform: `rotate(${Math.random() * 360}deg)`
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Assessment Complete Screen */}
                {showAssessmentComplete ? (
                    <div className="flex-1 flex items-center justify-center px-4 relative z-10">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 md:p-12 max-w-lg w-full">
                            {/* Simple completion animation similar to phase completion */}
                            <div className="text-center">
                                {/* Completion circle similar to phase completion */}
                                <div className="relative flex justify-center mb-8">
                                    {/* Ripple effect */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 border-2 border-[#98D048]/30 rounded-full animate-completion-ripple" />
                                    </div>

                                    {/* Main completion circle */}
                                    <div className="w-24 h-24 bg-gradient-to-br from-[#98D048] to-[#7AB93D] rounded-full flex items-center justify-center animate-completion-circle shadow-2xl">
                                        <svg
                                            className="w-12 h-12 text-white animate-completion-check"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            style={{ strokeDasharray: '100', strokeDashoffset: '0' }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Simple text content */}
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 animate-completion-title">
                                    Congratulations
                                </h3>
                                <p className="text-xl text-[#98D048] font-semibold mb-8 animate-completion-subtitle">
                                    Assessment Complete
                                </p>

                                <div className="animate-completion-subtitle animation-delay-400">
                                    <p className="text-sm text-gray-300 animate-pulse">
                                        Generating a detailed report and personalized recommendations...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isCompleted ? (
                    /* This section is now handled by the separate ContactDetailsPage */
                    <div className="flex-1 flex items-center justify-center px-4">
                        <div className="text-center">
                            <p className="text-gray-400">Redirecting to contact form...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Progress Bar as Top Bar */}
                        <AssessmentProgressBar
                            currentPhase={currentPhase}
                            phases={phaseLabels}
                            skillName={getCurrentPhaseSkillName(currentPhase)}
                            scenariosProgress={scenariosProgress}
                            currentQuestion={currentQuestionIndex}
                            totalQuestionsInPhase={getPhaseQuestions(currentPhase).length}
                            totalAnswered={userAnswers.length}
                            totalQuestions={scenarios.reduce((sum, s) => sum + (s.questions?.length || 0), 0)}
                        />

                        {/* Main Content Area */}
                        <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 py-6">
                            <div className="w-full max-w-4xl mx-auto">
                                {/* Strategist's Briefing */}
                                <div className="animate-fade-in-up">
                                    {/* Header with Toggle */}
                                    <div
                                        className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg p-3 transition-colors duration-200"
                                        onClick={() => setIsBriefingExpanded(!isBriefingExpanded)}
                                    >
                                        <h3 className="text-lg font-bold text-white">{getCurrentPhaseName(currentPhase)}</h3>
                                        <div className={`transform transition-transform duration-200 ${isBriefingExpanded ? 'rotate-180' : ''}`}>
                                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Collapsible Content with Tabs */}
                                    {isBriefingExpanded && (
                                        <div className="mt-4 bg-white/5 rounded-lg overflow-hidden">
                                            {/* Tab Headers */}
                                            <div className="flex border-b border-white/10">
                                                <button
                                                    onClick={() => setActiveTab('scenario')}
                                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'scenario'
                                                        ? 'bg-[#98D048]/20 text-[#98D048] border-b-2 border-[#98D048]'
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    Scenario
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('reference')}
                                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'reference'
                                                        ? 'bg-[#98D048]/20 text-[#98D048] border-b-2 border-[#98D048]'
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    Reference Material
                                                </button>
                                            </div>

                                            {/* Tab Content */}
                                            <div className="p-4 pb-8">
                                                {apiError ? (
                                                    <div className="flex flex-col items-center justify-center py-8">
                                                        <div className="text-red-400 mb-4 text-center">
                                                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-sm font-medium">{apiError}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => window.location.reload()}
                                                            className="px-4 py-2 bg-[#98D048] text-black rounded-lg text-sm font-medium hover:bg-[#98D048]/90 transition-colors"
                                                        >
                                                            Reload Page
                                                        </button>
                                                    </div>
                                                ) : isLoadingScenario ? (
                                                    <div className="flex flex-col items-center justify-center py-8">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mb-4"></div>
                                                        <p className="text-gray-300 text-sm text-center">
                                                            {activeTab === 'scenario' ? (
                                                                <>
                                                                    Preparing your scenario...<br />
                                                                    <span className="text-xs text-gray-400">
                                                                        {scenariosProgress.ready} of {scenariosProgress.total} scenarios ready
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Loading reference materials...<br />
                                                                    <span className="text-xs text-gray-400">Please wait while we prepare the content</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : activeTab === 'scenario' ? (
                                                    <div className="space-y-4">
                                                        {/* Scenario */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-4 h-4 bg-[#98D048] rounded-full flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">S</span>
                                                                </div>
                                                                <span className="font-semibold text-[#98D048] text-sm">Scenario</span>
                                                            </div>
                                                            <p className={`text-gray-300 text-sm leading-relaxed pl-6 ${!expandedSections.scenario ? 'line-clamp-3 md:line-clamp-none' : ''}`}>
                                                                {getScenarioBriefing(currentPhase).scenario}
                                                            </p>
                                                            <button
                                                                onClick={() => setExpandedSections(prev => ({ ...prev, scenario: !prev.scenario }))}
                                                                className="md:hidden flex items-center gap-1 text-[#98D048] text-xs font-medium pl-6 mt-1 hover:underline"
                                                            >
                                                                <span>{expandedSections.scenario ? 'Show less' : 'Read more'}</span>
                                                                <svg className={`w-3 h-3 transition-transform ${expandedSections.scenario ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Challenge */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">C</span>
                                                                </div>
                                                                <span className="font-semibold text-orange-400 text-sm">Challenge</span>
                                                            </div>
                                                            <p className={`text-gray-300 text-sm leading-relaxed pl-6 ${!expandedSections.challenge ? 'line-clamp-2 md:line-clamp-none' : ''}`}>
                                                                {getScenarioBriefing(currentPhase).challenge}
                                                            </p>
                                                            <button
                                                                onClick={() => setExpandedSections(prev => ({ ...prev, challenge: !prev.challenge }))}
                                                                className="md:hidden flex items-center gap-1 text-orange-400 text-xs font-medium pl-6 mt-1 hover:underline"
                                                            >
                                                                <span>{expandedSections.challenge ? 'Show less' : 'Read more'}</span>
                                                                <svg className={`w-3 h-3 transition-transform ${expandedSections.challenge ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Task */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">T</span>
                                                                </div>
                                                                <span className="font-semibold text-blue-400 text-sm">Task</span>
                                                            </div>
                                                            <p className={`text-gray-300 text-sm leading-relaxed pl-6 ${!expandedSections.task ? 'line-clamp-2 md:line-clamp-none' : ''}`}>
                                                                {getScenarioBriefing(currentPhase).task}
                                                            </p>
                                                            <button
                                                                onClick={() => setExpandedSections(prev => ({ ...prev, task: !prev.task }))}
                                                                className="md:hidden flex items-center gap-1 text-blue-400 text-xs font-medium pl-6 mt-1 hover:underline"
                                                            >
                                                                <span>{expandedSections.task ? 'Show less' : 'Read more'}</span>
                                                                <svg className={`w-3 h-3 transition-transform ${expandedSections.task ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {/* Keywords Pills */}
                                                        <div>
                                                            <p className="text-sm text-gray-400 mb-3">Key Concepts:</p>
                                                            {/* Scrollable pills row */}
                                                            <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible scrollbar-hide pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                                                                {(() => {
                                                                    // Always show if available
                                                                    return getReferenceKeywords(currentPhase).length > 0 ? (
                                                                        getReferenceKeywords(currentPhase).map((keyword, index) => (
                                                                            <button
                                                                                key={index}
                                                                                data-keyword={keyword}
                                                                                className={`
                                            keyword-button inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0
                                            ${activeKeyword === keyword
                                                                                        ? 'bg-[#98D048]/40 border border-[#98D048] text-white'
                                                                                        : 'bg-[#98D048]/20 border border-[#98D048]/40 text-[#98D048] hover:bg-[#98D048]/30 hover:border-[#98D048]/60'
                                                                                    }
                                                        `}
                                                                                onClick={() => setActiveKeyword(activeKeyword === keyword ? null : keyword)}
                                                                                onMouseEnter={() => !('ontouchstart' in window) && setActiveKeyword(keyword)}
                                                                                onMouseLeave={() => !('ontouchstart' in window) && setActiveKeyword(null)}
                                                                            >
                                                                                {keyword}
                                                                                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                            </button>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-gray-400 text-sm">
                                                                            Loading key concepts...
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* Tooltip shown below the pills - outside overflow container */}
                                                            {activeKeyword && (
                                                                <div className="mt-3 keyword-tooltip bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-2xl animate-fade-in">
                                                                    <div className="text-xs text-white leading-relaxed">
                                                                        <strong className="text-[#98D048]">{activeKeyword}:</strong>
                                                                        <br />
                                                                        {getKeywordDefinition(activeKeyword)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Visual Model */}
                                                        <div>
                                                            <p className="text-sm text-gray-400 mb-3">Visual Model:</p>
                                                            <div className="bg-gradient-to-br from-[#98D048]/20 to-blue-500/20 rounded-lg p-4 border border-[#98D048]/30 min-h-[100px] flex items-center justify-center">
                                                                {(() => {
                                                                    const scenario = scenarios.find(s => s.scenario_id === currentPhase);
                                                                    const visualModel = scenario?.reference_materials?.visual_model;

                                                                    if (visualModel) {
                                                                        return (
                                                                            <div className="text-center w-full">
                                                                                <h4 className="text-[#98D048] font-bold mb-2 text-lg">{visualModel.name}</h4>
                                                                                <p className="text-sm text-gray-200 leading-relaxed">{visualModel.description}</p>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div className="text-gray-400 text-sm">
                                                                            Visual model not available
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Question Section */}
                            <div className="mt-8 animate-fade-in-up animation-delay-300">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 relative overflow-hidden">
                                    {/* Phase Completion Animation */}
                                    {showPhaseCompletion && (
                                        <div className="flex flex-col items-center justify-center animate-fade-in text-center py-12">
                                            <div className="relative mb-8">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-32 h-32 border-2 border-[#98D048]/30 rounded-full animate-completion-ripple" />
                                                </div>

                                                {/* Animated particles/sparkles - centered on the circle */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="relative animate-completion-particles">
                                                        {[...Array(8)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute w-2 h-2 bg-[#98D048] rounded-full opacity-70"
                                                                style={{
                                                                    top: '-1px',
                                                                    left: '-1px',
                                                                    transform: `rotate(${i * 45}deg) translateY(-60px)`,
                                                                    transformOrigin: '1px 61px',
                                                                    animationDelay: `${i * 0.1}s`
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Main completion circle - this is our anchor point */}
                                                <div className="w-24 h-24 bg-gradient-to-br from-[#98D048] to-[#7AB93D] rounded-full flex items-center justify-center animate-completion-circle shadow-2xl">
                                                    <svg
                                                        className="w-12 h-12 text-white animate-completion-check"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        style={{ strokeDasharray: '100', strokeDashoffset: '0' }}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Completion text */}
                                            <div className="text-center">
                                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 animate-completion-title">
                                                    Phase Complete!
                                                </h3>
                                                <div className="animate-completion-subtitle">
                                                    <p className="text-xl text-[#98D048] font-semibold mb-6">
                                                        {getCurrentPhaseName(currentPhase)}
                                                    </p>
                                                </div>

                                                {/* Next Phase Button with Auto-Progress */}
                                                {showNextPhaseButton && currentPhase < phases.length && (
                                                    <div className="animate-fade-in-up flex flex-col items-center gap-3">
                                                        {/* Manual CTA Button */}
                                                        <button
                                                            onClick={handleNextPhase}
                                                            className="bg-[#98D048] hover:bg-[#7AB93D] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg min-w-[180px]"
                                                        >
                                                            Next Phase
                                                            <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                        </button>

                                                        {/* Progress Bar - Below button, same width */}
                                                        <div className="min-w-[180px]">
                                                            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                                                                <div
                                                                    className="absolute inset-y-0 left-0 bg-[#98D048] rounded-full transition-all duration-75 ease-linear"
                                                                    style={{ width: `${autoProgressTime}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-2 text-center">
                                                                Moving to next phase...
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {!showNextPhaseButton && currentPhase < phases.length && (
                                                    <p className="text-sm text-gray-300 animate-completion-subtitle animation-delay-200">
                                                        Great job! 🎉
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Question Content - Hidden during completion animation */}
                                    {!showPhaseCompletion && getPhaseQuestions(currentPhase).length > 0 ? (
                                        <div className="transition-opacity duration-300 opacity-100">

                                            {/* Questions List */}
                                            <div className="space-y-8 mb-8">
                                                {getPhaseQuestions(currentPhase).map((question, qIndex) => {
                                                    const currentAnswer = userAnswers.find(a => a.question_id === question.id);
                                                    const selectedOptionIndex = currentAnswer ? ['a', 'b', 'c', 'd'].indexOf(currentAnswer.selected_option) : null;

                                                    return (
                                                        <div key={question.id} className="border-b border-white/10 pb-8 last:border-0 last:pb-0">
                                                            {/* Question Header */}
                                                            <div className="mb-4">
                                                                <h3 className="text-xl font-bold text-white mb-1">Question {qIndex + 1}</h3>
                                                            </div>

                                                            {/* Question Content */}
                                                            <div className="mb-6">
                                                                <h4 className="text-lg font-medium text-white mb-4 leading-relaxed">
                                                                    {question.question}
                                                                </h4>

                                                                {/* Answer Options */}
                                                                <div className="space-y-3">
                                                                    {question.options.map((option, optIndex) => (
                                                                        <button
                                                                            key={optIndex}
                                                                            onClick={() => handleAnswerSelection(question.id, optIndex)}
                                                                            className={`
                                                                                w-full text-left p-4 rounded-lg border transition-all duration-200 
                                                                                ${selectedOptionIndex === optIndex
                                                                                    ? 'bg-[#98D048]/20 border-[#98D048] text-white'
                                                                                    : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40 hover:bg-white/10 cursor-pointer'
                                                                                }
                                                                            `}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`
                                                                                    w-6 h-6 min-w-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0
                                                                                    ${selectedOptionIndex === optIndex
                                                                                        ? 'border-[#98D048] bg-[#98D048] text-white'
                                                                                        : 'border-white/40 text-white/60'
                                                                                    }
                                                                                `}>
                                                                                    {String.fromCharCode(65 + optIndex)}
                                                                                </div>
                                                                                <span className="text-sm md:text-base">{option}</span>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex justify-end pt-4 border-t border-white/10">
                                                <button
                                                    onClick={handlePhaseSubmit}
                                                    disabled={userAnswers.filter(a => getPhaseQuestions(currentPhase).some(q => q.id === a.question_id)).length < getPhaseQuestions(currentPhase).length}
                                                    className={`
                                                        px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg flex items-center gap-2
                                                        ${userAnswers.filter(a => getPhaseQuestions(currentPhase).some(q => q.id === a.question_id)).length < getPhaseQuestions(currentPhase).length
                                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                                            : 'bg-[#98D048] hover:bg-[#7AB93D] text-black hover:scale-105 active:scale-95'
                                                        }
                                                    `}
                                                >
                                                    <span>Complete Phase</span>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : !showPhaseCompletion ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mb-4"></div>
                                            <p className="text-gray-300 text-sm text-center">
                                                Loading quiz questions...<br />
                                                <span className="text-xs text-gray-400">Please wait while we prepare your assessment</span>
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Fullscreen Visual Model Modal - Removed as visual model is no longer an SVG */}
            {/* {isVisualModelFullscreen && ... } */}
        </>
    );
};

export default AssessmentPageVariant;

