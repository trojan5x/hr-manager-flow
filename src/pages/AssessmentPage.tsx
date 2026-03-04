import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import lottie from 'lottie-web';
import AssessmentProgressBar from '../components/AssessmentProgressBar';
// import InteractiveWalkthrough, { type Step } from '../components/InteractiveWalkthrough';
import TopBar from '../components/TopBar';
import { fetchBundleScenarios, updateProgressWithRetry, updateAssessmentPhase, completeAssessment } from '../services/api';
import {
    getStoredBundleId,
    getStoredSessionId,
    storeSessionId,
    storeAnswersBackup,
    getStoredAnswersBackup,
    storeProgressBackup,
    getStoredProgressBackup,
    storePhaseCompletion,
    // getStoredUrlParams
} from '../utils/localStorage';
import { analytics } from '../services/analytics';
import type { Scenario, ScenariosResponse, UserAnswer, ProgressUpdateRequest } from '../types';

const AssessmentPage = () => {
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
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
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
    const [sessionId, setSessionId] = useState<string | null>(null); // State for explicit session tracking

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

    // Scroll indicator
    const [showScrollIndicator, setShowScrollIndicator] = useState(true);
    const quizSectionRef = useRef<HTMLDivElement>(null);

    // Walkthrough state - hide if utm_medium is static_scrum_9 or static_scrum_9_test
    // const [showWalkthrough, setShowWalkthrough] = useState(() => {
    //     const urlParams = getStoredUrlParams();
    //     const utmMedium = urlParams?.utm_medium;
    //     // Don't show walkthrough if utm_medium is static_scrum_9 or static_scrum_9_test
    //     return utmMedium !== 'static_scrum_9' && utmMedium !== 'static_scrum_9_test' && utmMedium !== 'static_scrum_10';
    // });

    // const walkthroughSteps: Step[] = [
    //     {
    //         title: "Welcome to Assessments",
    //         content: "We've personalized this experience for you. Here's a quick guide on how to navigate.",
    //     },
    //     {
    //         targetId: "assessment-progress-bar",
    //         title: "Track Your Progress",
    //         content: "Keep an eye on your phase progress and time remaining here at the top.",
    //     },
    //     {
    //         targetId: "assessment-briefing-header",
    //         title: "Read the Briefing",
    //         content: "Start by analyzing the scenario and understanding your role and the challenge ahead.",
    //     },
    //     {
    //         targetId: "assessment-tab-buttons",
    //         title: "Consult Resources",
    //         content: "Access key concepts and visual models here to help you solve the challenge.",
    //     },
    //     {
    //         targetId: "assessment-questions-area",
    //         title: "Solve the Challenge",
    //         content: "Once you're ready, scroll down to answer the questions based on the scenario.",
    //     }
    // ];

    // Handle scroll visibility of the indicator
    useEffect(() => {
        const handleScroll = () => {
            if (quizSectionRef.current) {
                const rect = quizSectionRef.current.getBoundingClientRect();
                // Check if quiz section is approaching the viewport
                // If top of quiz section is within view (or close to it), hide the arrow
                const isVisible = rect.top <= window.innerHeight - 100;
                setShowScrollIndicator(!isVisible);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [currentPhase, activeTab]); // Re-check on these changes

    const scrollToQuiz = () => {
        quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initialize bundle ID and restore backup data from localStorage
    useEffect(() => {
        // Ensure we have a session ID locally - CRITICAL for skipped flow
        let currentSessionId = searchParams.get('session') || getStoredSessionId();
        if (!currentSessionId) {
            currentSessionId = `session_${Date.now()}`;
            storeSessionId(currentSessionId);
            console.log('Created new local session:', currentSessionId);
        } else if (searchParams.get('session')) {
            // If it came from URL, store it to update local
            storeSessionId(currentSessionId);
        }

        // Save to component state
        setSessionId(currentSessionId);

        // Register session with analytics if available
        if (currentSessionId) {
            analytics.register({ session_id: currentSessionId });
            analytics.setSessionId(currentSessionId);
            
            if (import.meta.env.DEV) {
                console.log('[AssessmentPage] 📝 Registered session with analytics:', currentSessionId.slice(0, 8) + '...');
            }
        }

        const storedBundleId = getStoredBundleId();

        // Use stored ID, or URL ID, or fallback to static string
        const activeBundleId = storedBundleId || assessmentId || 'static_bundle';

        setBundleId(activeBundleId);
        analytics.track('assessment_loading_started', { bundle_id: activeBundleId });

        // Restore answers backup if available
        const backupAnswers = getStoredAnswersBackup(activeBundleId);
        if (backupAnswers.length > 0) {
            setUserAnswers(backupAnswers);
            console.log(`Restored ${backupAnswers.length} answers from backup`);
        }

        // Restore progress backup if available
        const backupProgress = getStoredProgressBackup(activeBundleId);
        if (backupProgress) {
            setCurrentPhase(backupProgress.currentScenario);
            setCompletedScenarios(backupProgress.completedScenarios);
            setAnswersSaved(backupProgress.answersSaved);
            setCumulativeTime(backupProgress.cumulativeTime);
            console.log('Restored progress from backup:', backupProgress);
        }
    }, []);

    // Poll for scenario data - only re-run when bundleId changes, not on phase change
    // Poll for scenario data - only re-run when bundleId changes, not on phase change
    // Poll for scenario data - only re-run when bundleId changes, not on phase change
    useEffect(() => {
        if (!bundleId) return;

        const loadScenarios = async () => {
            try {
                setApiError(null);

                // Get the local session ID (we need this to fetch the role string from db)
                const currentSessionId = searchParams.get('session') || getStoredSessionId();
                if (currentSessionId) {
                    setSessionId(currentSessionId);
                    
                    // Ensure analytics has the session ID
                    analytics.register({ session_id: currentSessionId });
                    analytics.setSessionId(currentSessionId);
                }

                if (!currentSessionId) {
                    throw new Error('No session ID found');
                }

                // In static mode, we fetch once and it's always ready
                // Now fetching using the true Session ID so the backend can look up the role
                const response: ScenariosResponse = await fetchBundleScenarios(currentSessionId);

                // Add this guard
                if (!response.success || !response.data) {
                    // Start over, session is invalid
                    console.error("Session invalid or not found in backend:", response.message);
                    throw new Error(response.message || 'Session not found');
                }

                setScenarios(response.data.scenarios);

                // FORCE progress to be fully ready for static mode
                setScenariosProgress({
                    ready: response.data.scenarios.length,
                    total: response.data.scenarios.length,
                    generating: 0,
                    pending: 0
                });

                // Immediately stop loading state
                setIsInitialLoading(false);
                setIsLoadingScenario(false);

                // Create initial user assessment record (temporarily disabled to fix loading)
                try {
                    console.log('Skipping user assessment creation to avoid query issues');
                    // await createUserAssessment({
                    //     session_id: parseInt(currentSessionId),
                    //     current_phase_id: null, // Will be set when phases are actually started
                    //     is_complete: false,
                    //     user_answers: {}
                    // });
                    // console.log('Initial user assessment record created');
                } catch (assessmentError) {
                    console.warn('Failed to create initial assessment record:', assessmentError);
                    // Don't block the assessment if this fails
                }

            } catch (error) {
                console.error('Error loading scenarios:', error);
                setApiError(error instanceof Error ? error.message : 'Failed to load scenarios');
                setIsInitialLoading(false);
                setIsLoadingScenario(false);
            }
        };

        // Load immediately
        loadScenarios();
    }, [bundleId]);

    // Auto-save answers whenever they change
    useEffect(() => {
        if (bundleId && userAnswers.length > 0) {
            storeAnswersBackup(bundleId, userAnswers);
        }
    }, [bundleId, userAnswers]);

    // Auto-save progress whenever relevant state changes
    useEffect(() => {
        if (bundleId) {
            storeProgressBackup(bundleId, {
                currentScenario: currentPhase,
                completedScenarios,
                answersSaved,
                cumulativeTime
            });
        }
    }, [bundleId, currentPhase, completedScenarios, answersSaved, cumulativeTime]);

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

    // Assessment phases - dynamically pulled from scenarios
    const phases = scenarios.length > 0
        ? scenarios.map(s => s.phase || `Phase ${s.scenario_id}`)
        : ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

    // Short labels for progress bar
    const phaseLabels = scenarios.length > 0
        ? scenarios.map(s => {
            if (!s.phase) return `Phase ${s.scenario_id}`;
            const parts = s.phase.split(' ');
            return parts[0].length > 4 ? parts[0] : parts.slice(0, 2).join(' ');
        })
        : ['One', 'Two', 'Three', 'Four', 'Five'];

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
            scenario: scenario.context,
            challenge: scenario.challenge,
            task: scenario.task,
            goal: scenario.project_mandate?.initial_budget || ""
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





    // Function to get current phase name from scenario data
    const getCurrentPhaseName = (phase: number) => {
        const scenario = scenarios.find(s => s.scenario_id === phase);
        if (scenario) {
            return scenario.scenario_name || scenario.skill_name;
        }
        // Fallback to hardcoded phases if scenario not found
        return phases[phase - 1] || "Phase " + phase;
    };



    // Memoize shuffled questions for each phase so they don't re-shuffle on every render
    const shuffledQuestionsCache = useMemo(() => {
        const cache: { [key: number]: any[] } = {};

        scenarios.forEach(scenario => {
            if (scenario.questions && scenario.questions.length > 0) {
                cache[scenario.scenario_id] = scenario.questions.map(q => {

                    // Use the original index of the correct answer
                    const correctIndex = q.options.findIndex(o => o.is_correct);

                    return {
                        id: q.question_id,
                        question: q.question_text,
                        options: q.options.map(o => o.text),
                        correct: correctIndex
                    };
                });
            }
        });

        return cache;
    }, [scenarios]); // Only recalculate when scenarios data changes

    // Function to get questions for each phase from cached shuffled data
    const getPhaseQuestions = (phase: number) => {
        return shuffledQuestionsCache[phase] || [];
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
        const activeSessionId = sessionId || getStoredSessionId();
        if (!activeSessionId) {
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
            const phaseTimeTaken = Math.round((Date.now() - phaseStartTime.current) / 1000);

            // Build the new format with attempt_object for the existing API
            const progressData: ProgressUpdateRequest = {
                session_id: Number(activeSessionId) || 0, // Avoid NaN if it is a mock string ID
                attempt_object: {
                    phase_number: scenarioIndex, // 1-based phase number
                    phase_name: currentScenario ? (currentScenario.scenario_name || currentScenario.skill_name) : (phases[scenarioIndex - 1] || `Phase ${scenarioIndex}`),
                    scenario_id: currentScenario ? currentScenario.scenario_id : 0,
                    time_taken_in_seconds: phaseTimeTaken, // ✨ Calculate time taken in seconds
                    phase_user_answers: scenarioAnswers.map(answer => ({
                        question_id: answer.question_id,
                        selected_option: answer.selected_option
                    }))
                },
                time_taken_in_seconds: cumulativeTime + phaseTimeTaken // ✨ Total time so far
            };

            console.log('Saving scenario completion:', progressData);

            // Save to existing progress API
            const response = await updateProgressWithRetry(progressData);

            // ALSO save to user_assessments table with phase data
            const phaseAnswersForDb: { [questionId: number]: string } = {};
            scenarioAnswers.forEach(answer => {
                phaseAnswersForDb[answer.question_id] = answer.selected_option;
            });

            await updateAssessmentPhase(
                parseInt(activeSessionId),
                scenarioIndex,
                phaseAnswersForDb,
                phaseTimeTaken
            );

            // Update local state on success
            setCompletedScenarios(prev => prev + 1);
            setAnswersSaved(prev => prev + scenarioAnswers.length);
            // Update cumulative time
            setCumulativeTime(prev => prev + phaseTimeTaken);

            // Persist phase-wise data
            if (bundleId) {
                storePhaseCompletion(bundleId, scenarioIndex, progressData.attempt_object);
            }

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
        // Cleaning up disabled for static results logic
        console.log('Persisting assessment data for Results Page');
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
        setSelectedAnswer(null);
        setIsAnswerLocked(false);
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

    // Handle answer selection and progression
    const handleAnswerSelection = (answerIndex: number) => {
        setSelectedAnswer(answerIndex);
        setIsAnswerLocked(true);

        // Get current question and convert answer format
        const phaseQuestions = getPhaseQuestions(currentPhase);
        const currentQuestion = phaseQuestions[currentQuestionIndex];
        let finalAnswer: UserAnswer | undefined = undefined;

        if (currentQuestion) {
            const selectedOption = ['a', 'b', 'c', 'd'][answerIndex] as 'a' | 'b' | 'c' | 'd';
            finalAnswer = { question_id: currentQuestion.id, selected_option: selectedOption };

            // Track question answered
            analytics.track('question_answered', {
                phase_number: currentPhase,
                question_id: currentQuestion.id,
                is_correct: answerIndex === currentQuestion.correct
            });

            // Save answer in structured format
            setUserAnswers(prev => {
                const existing = prev.findIndex(a => a.question_id === currentQuestion.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = finalAnswer!;
                    return updated;
                }
                return [...prev, finalAnswer!];
            });
        }

        // Move to next question after a short delay
        setTimeout(() => {
            const phaseQuestions = getPhaseQuestions(currentPhase);

            if (currentQuestionIndex < phaseQuestions.length - 1) {
                // Next question in same phase
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedAnswer(null);
                setIsAnswerLocked(false);
            } else {
                // Phase completed - save answers and show completion animation
                setShowPhaseCompletion(true);

                // Save scenario completion with answers, including the final answer
                saveScenarioCompletion(currentPhase, finalAnswer);

                // Show next phase button after animation completes and start auto-progress
                setTimeout(async () => {
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

                        // Calculate final score and complete assessment
                        const totalQuestions = scenarios.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
                        const correctAnswers = userAnswers.reduce((correct, answer) => {
                            // Find which scenario this answer belongs to
                            for (const scenario of scenarios) {
                                const question = scenario.questions?.find(q => q.question_id === answer.question_id);
                                if (question) {
                                    const correctOption = question.options.find(opt => opt.is_correct);
                                    if (correctOption) {
                                        const correctIndex = question.options.indexOf(correctOption);
                                        const answerIndex = ['a', 'b', 'c', 'd'].indexOf(answer.selected_option);
                                        if (answerIndex === correctIndex) {
                                            return correct + 1;
                                        }
                                    }
                                    break;
                                }
                            }
                            return correct;
                        }, 0);

                        const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                        const isPassed = finalScore >= 50;
                        const totalTimeTaken = cumulativeTime + Math.round((Date.now() - phaseStartTime.current) / 1000);

                        // Save final assessment completion
                        try {
                            const activeSessionId = sessionId || getStoredSessionId();
                            if (activeSessionId) {
                                await completeAssessment(
                                    parseInt(activeSessionId),
                                    finalScore,
                                    isPassed,
                                    totalTimeTaken
                                );
                                console.log('Final assessment saved:', { score: finalScore, passed: isPassed });
                            }
                        } catch (error) {
                            console.error('Failed to save final assessment:', error);
                            // Don't block the flow if this fails
                        }

                        // Clear all backups since assessment is completed
                        clearAllBackups();

                        // After assessment complete animation, navigate to contact form
                        setTimeout(() => {
                            // Navigate to contact details page with session ID
                            const activeSessionId = sessionId || getStoredSessionId();
                            const urlParams = new URLSearchParams();
                            if (assessmentId) urlParams.append('id', assessmentId);
                            if (activeSessionId) urlParams.append('session_id', activeSessionId);
                            
                            window.location.href = `/contact-details?${urlParams.toString()}`;
                        }, 4000); // 4 seconds for full celebration
                    }
                }, 2500); // 2.5 seconds for completion animation
            }
        }, 600); // 0.6 seconds delay before moving to next question
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

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);

            // Load the previous answer if it exists
            const phaseQuestions = getPhaseQuestions(currentPhase);
            const previousQuestion = phaseQuestions[currentQuestionIndex - 1];
            if (previousQuestion) {
                const existingAnswer = userAnswers.find(a => a.question_id === previousQuestion.id);
                if (existingAnswer) {
                    const answerIndex = ['a', 'b', 'c', 'd'].indexOf(existingAnswer.selected_option);
                    setSelectedAnswer(answerIndex);
                } else {
                    setSelectedAnswer(null);
                }
            }
            setIsAnswerLocked(false); // Allow changing the answer when going back
        }
    };

    // Handle moving to next question (for already answered questions - no delay)
    const handleNextQuestion = () => {
        const phaseQuestions = getPhaseQuestions(currentPhase);

        if (currentQuestionIndex < phaseQuestions.length - 1) {
            // Move to next question immediately
            setCurrentQuestionIndex(currentQuestionIndex + 1);

            // Check if next question already has an answer
            const nextQuestion = phaseQuestions[currentQuestionIndex + 1];
            if (nextQuestion) {
                const existingAnswer = userAnswers.find(a => a.question_id === nextQuestion.id);
                if (existingAnswer) {
                    const answerIndex = ['a', 'b', 'c', 'd'].indexOf(existingAnswer.selected_option);
                    setSelectedAnswer(answerIndex);
                } else {
                    setSelectedAnswer(null);
                }
            } else {
                setSelectedAnswer(null);
            }
            setIsAnswerLocked(false);
        } else {
            // This is the last question - trigger normal answer flow to complete phase
            if (selectedAnswer !== null) {
                handleAnswerSelection(selectedAnswer);
            }
        }
    };

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
            {/* Walkthrough Overlay - Disabled for now */}
            {/* {currentPhase === 1 && !isInitialLoading && (
                <InteractiveWalkthrough
                    isVisible={showWalkthrough}
                    steps={walkthroughSteps}
                    onComplete={() => setShowWalkthrough(false)}
                    onSkip={() => setShowWalkthrough(false)}
                />
            )} */}

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
                        <div id="assessment-progress-bar">
                            <AssessmentProgressBar
                                currentPhase={currentPhase}
                                phases={phaseLabels}
                                skillName={phases[currentPhase - 1]}
                                scenariosProgress={scenariosProgress}
                                currentQuestion={currentQuestionIndex}
                                totalQuestionsInPhase={getPhaseQuestions(currentPhase).length}
                                totalAnswered={userAnswers.length}
                                totalQuestions={scenarios.reduce((sum, s) => sum + (s.questions?.length || 0), 0)}
                            />
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 py-6">
                            <div className="w-full max-w-4xl mx-auto">
                                {/* Manager's Briefing */}
                                <div className="animate-fade-in-up">
                                    {/* Header with Toggle */}
                                    <div
                                        id="assessment-briefing-header"
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
                                            <div id="assessment-tab-buttons" className="flex border-b border-white/10">
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
                                                                    // Always show if available (static data)
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
                                                                                <p className="text-sm text-gray-200 leading-relaxed mb-4">{visualModel.description}</p>

                                                                                {/* Render SVG if available */}
                                                                                {visualModel.svg && (
                                                                                    <div
                                                                                        className="w-full bg-white/5 rounded-lg p-2 overflow-hidden"
                                                                                        dangerouslySetInnerHTML={{ __html: visualModel.svg }}
                                                                                    />
                                                                                )}
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
                            <div id="assessment-questions-area" ref={quizSectionRef} className="mt-8 animate-fade-in-up animation-delay-300">
                                <div className="bg-white/5 max-w-4xl mx-auto w-full backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 relative overflow-hidden">
                                    {/* Phase Completion Animation Overlay */}
                                    {showPhaseCompletion && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#001C2C] via-[#00385C] to-[#001C2C] animate-completion-overlay rounded-xl flex items-center justify-center z-20">
                                            <div className="text-center">
                                                {/* Container for all animated elements - centered in viewport */}
                                                <div className="relative flex justify-center mb-8">
                                                    {/* Ripple effect - centered on the circle */}
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
                                        </div>
                                    )}

                                    {/* Question Content - Hidden during completion animation */}
                                    {getPhaseQuestions(currentPhase).length > 0 ? (
                                        <div className={`transition-opacity  duration-300 ${showPhaseCompletion ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                            {/* Question Header */}
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-white mb-1">Question {currentQuestionIndex + 1}</h3>
                                                <p className="text-sm text-gray-400">
                                                    {currentQuestionIndex + 1} of {getPhaseQuestions(currentPhase).length || 0} questions
                                                </p>
                                            </div>

                                            {/* Question Content */}
                                            <div className="mb-8">
                                                <h4 className="text-lg font-medium text-white mb-6 leading-relaxed">
                                                    {getPhaseQuestions(currentPhase)[currentQuestionIndex]?.question || 'Loading question...'}
                                                </h4>

                                                {/* Answer Options */}
                                                <div className="space-y-3">
                                                    {getPhaseQuestions(currentPhase)[currentQuestionIndex]?.options?.map((option: string, index: number) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleAnswerSelection(index)}
                                                            disabled={isAnswerLocked}
                                                            className={`
                                                    w-full text-left p-4 rounded-lg border transition-all duration-200 
                                                    ${selectedAnswer === index
                                                                    ? 'bg-[#98D048]/20 border-[#98D048] text-white'
                                                                    : isAnswerLocked
                                                                        ? 'bg-white/5 border-white/20 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40 hover:bg-white/10 cursor-pointer'
                                                                }
                                                `}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`
                                                        w-6 h-6 min-w-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0
                                                        ${selectedAnswer === index
                                                                        ? 'border-[#98D048] bg-[#98D048] text-white'
                                                                        : 'border-white/40 text-white/60'
                                                                    }
                                                    `}>
                                                                    {String.fromCharCode(65 + index)}
                                                                </div>
                                                                <span className="text-sm md:text-base">{option}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation and Progress */}
                                            <div className="space-y-4">
                                                {/* Navigation Buttons */}
                                                <div className="flex justify-between items-center gap-4">
                                                    {/* Back Button */}
                                                    {currentQuestionIndex > 0 && (
                                                        <button
                                                            onClick={handlePreviousQuestion}
                                                            disabled={isAnswerLocked}
                                                            className={`
                                                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                                                    ${isAnswerLocked
                                                                    ? 'bg-white/5 border-white/20 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-white/5 border-white/30 text-white hover:border-white/50 hover:bg-white/10'
                                                                }
                                                `}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                            <span className="text-sm">Previous</span>
                                                        </button>
                                                    )}

                                                    {/* Spacer when no back button */}
                                                    {currentQuestionIndex === 0 && <div />}

                                                    {/* Next Button - only show when question is already answered but not locked */}
                                                    {selectedAnswer !== null && !isAnswerLocked && (
                                                        <button
                                                            onClick={handleNextQuestion}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#98D048] hover:bg-[#7AB93D] text-black font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                                                        >
                                                            <span className="text-sm">Next</span>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Progress Indicator */}
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        {getPhaseQuestions(currentPhase).map((_, index) => (
                                                            <div
                                                                key={index}
                                                                className={`
                                                        w-2 h-2 rounded-full transition-colors duration-200
                                                        ${index < currentQuestionIndex
                                                                        ? 'bg-[#98D048]'
                                                                        : index === currentQuestionIndex
                                                                            ? 'bg-white'
                                                                            : 'bg-white/30'
                                                                    }
                                                    `}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        {isAnswerLocked
                                                            ? 'Moving to next question...'
                                                            : selectedAnswer !== null
                                                                ? 'Click Next or change your answer'
                                                                : 'Select your answer'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mb-4"></div>
                                            <p className="text-gray-300 text-sm text-center">
                                                Loading quiz questions...<br />
                                                <span className="text-xs text-gray-400">Please wait while we prepare your assessment</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Scroll Indicator Arrow - Fixed at bottom */}
                <div
                    className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-500 z-30 ${showScrollIndicator && !showAssessmentComplete && !isCompleted
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                    onClick={scrollToQuiz}
                >
                    <div className="flex flex-col items-center gap-0 animate-bounce">
                        <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Scroll</span>
                        <img
                            src="/assets/down-arrow-selection-page.png"
                            alt="Scroll Down"
                            className="w-12 h-12 opacity-80 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>
            </div>

            {/* Fullscreen Visual Model Modal - Removed as visual model is no longer an SVG */}
            {/* {isVisualModelFullscreen && ... } */}
        </>
    );
};

export default AssessmentPage;

