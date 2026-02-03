import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from 'react';
import HeroHeading from '../components/HeroHeading';
import CertificateFan from '../components/CertificateFan';

import StickyBottomBar from '../components/StickyBottomBar';
import TopBar from '../components/TopBar';
import TagList from '../components/TagList';
import Button from '../components/Button';
import { createSession, getRoleContent, checkCertifiedUser } from '../services/api';
import { extractUrlParams, extractEmailFromUrl } from '../utils/urlParams';
import { storeSessionId, storeRole, storeUrlParams, storeEmail, hasValidSession, getStoredSessionId, storeContactDetails } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import RoleContentLoadingPage from '../components/RoleContentLoadingPage';
import CertificateValueSection from '../components/CertificateValueSection';
import VideoTestimonialsSection from '../components/VideoTestimonialsSection';
import type { RoleContentResponse, RoleGeneratingResponse, CertifiedUserData } from '../types';

const RolePage = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'HR Manager';
    const navigate = useNavigate();
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [contentError, setContentError] = useState<string | null>(null);
    const [roleContent, setRoleContent] = useState<RoleContentResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [estimatedWait, setEstimatedWait] = useState(0);
    const [_existingUser, setExistingUser] = useState<CertifiedUserData | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionOrigin, setTransitionOrigin] = useState({ x: 0, y: 0 });
    const [onlineUsersCount, setOnlineUsersCount] = useState(Math.floor(Math.random() * 20 + 30));
    const [percentage, setPercentage] = useState(0);
    const desktopButtonRef = useRef<HTMLButtonElement>(null);
    const mobileButtonRef = useRef<HTMLButtonElement>(null);

    // Get unique frameworks from skills
    // Get unique frameworks: use explicit frameworks list if available, otherwise flatmap skills
    const frameworks = useMemo(() => {
        const roleFrameworks = roleContent?.data?.role?.frameworks;
        if (roleFrameworks && roleFrameworks.length > 0) {
            return roleFrameworks.slice(0, 8);
        }
        return Array.from(new Set(
            roleContent?.data?.role?.skills?.flatMap(s => s.skill_frameworks || []) || []
        )).slice(0, 8);
    }, [roleContent]);

    // Animate percentage
    useEffect(() => {
        const timer = setTimeout(() => {
            let start = 0;
            const end = 40;
            const duration = 1500;
            const incrementTime = duration / end;

            const counter = setInterval(() => {
                start += 1;
                setPercentage(start);
                if (start === end) clearInterval(counter);
            }, incrementTime);

            return () => clearInterval(counter);
        }, 500); // Start after 500ms

        return () => clearTimeout(timer);
    }, []);

    // Dynamic online users simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineUsersCount(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2 variation
                const newValue = prev + change;
                return Math.max(25, Math.min(100, newValue)); // Keep between 25 and 100
            });
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Check if user exists in system (for returning users with email in URL)
    useEffect(() => {
        const checkExistingUser = async () => {
            const emailFromUrl = extractEmailFromUrl();

            if (!emailFromUrl) {
                console.log('No email in URL, skipping user check');
                return;
            }

            console.log('Email found in URL, checking if user exists:', emailFromUrl);

            // Store email regardless of whether user exists
            storeEmail(emailFromUrl);

            // Check if user exists in our system
            const userData = await checkCertifiedUser(emailFromUrl);

            if (userData) {
                console.log('Existing user found:', userData.name);
                setExistingUser(userData);
                // User exists - they can skip any signup forms
                // The UI can use existingUser to conditionally render forms
                storeContactDetails({
                    email: userData.email,
                    phone: userData.phone_number,
                    name: userData.name
                });
            }
        };

        checkExistingUser();
    }, []);

    // Create session on component mount
    useEffect(() => {
        const initializeSession = async () => {
            // Don't create a new session if we already have a valid one
            if (hasValidSession()) {
                console.log('Valid session already exists, skipping creation');

                // REGISTER GLOBAL PROPERTIES FOR EXISTING SESSION
                const storedSessionId = getStoredSessionId();
                if (storedSessionId) {
                    analytics.register({ session_id: storedSessionId, role_name: role });
                }
                return;
            }

            setIsLoadingSession(true);
            setSessionError(null);

            try {
                // Extract UTM parameters from URL
                const utmParams = extractUrlParams();
                console.log('Extracted UTM params:', utmParams);

                // Store URL params and role locally first
                storeUrlParams(utmParams);
                storeRole(role);

                // Create session with backend
                const sessionResponse = await createSession(role, utmParams);

                // Store session ID locally for future use [[memory:7256363]]
                storeSessionId(sessionResponse.session_id);

                // REGISTER GLOBAL PROPERTIES FOR NEW SESSION
                analytics.register({ session_id: sessionResponse.session_id, role_name: role });

                console.log('Session initialized successfully');
            } catch (error) {
                console.error('Failed to initialize session:', error);
                setSessionError('Failed to create session. Please try again.');
            } finally {
                setIsLoadingSession(false);
            }
        };

        initializeSession();
    }, [role]); // Re-run if role changes

    // Fetch role-specific content
    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval> | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const fetchRoleContent = async () => {
            // Check if we already have this role content
            if (roleContent && roleContent.data?.role?.name === role) {
                console.log('Role content already in state, skipping fetch');
                setIsLoadingContent(false);
                return;
            }

            // Check localStorage
            try {
                const storedRoleContent = localStorage.getItem('roleContent');
                if (storedRoleContent) {
                    const parsed = JSON.parse(storedRoleContent) as RoleContentResponse;
                    if (parsed.data?.role?.name === role) {
                        // Only use cache if it has the new role_core_skill field, otherwise fetch fresh
                        if (parsed.data?.role?.role_core_skill) {
                            console.log('Role content found in localStorage, using cached version');
                            setRoleContent(parsed);
                            setIsLoadingContent(false);
                            return;
                        }
                        console.log('Cached content found but missing role_core_skill, fetching fresh...');
                    }
                }
            } catch (error) {
                console.warn('Error reading from localStorage:', error);
            }

            setIsLoadingContent(true);
            setContentError(null);
            setIsGenerating(false);

            try {
                console.log(`Fetching content for role: ${role}`);
                const response = await getRoleContent(role);

                if (response.status === 'ready' || response.status === 'matched_by_ai' || response.status === 'generated') {
                    // Content is ready (200 response), matched by AI, or freshly generated
                    const readyResponse = response as RoleContentResponse;
                    setRoleContent(readyResponse);
                    setIsGenerating(false);

                    // Store role content for SelectSkillsPage
                    try {
                        localStorage.setItem('roleContent', JSON.stringify(readyResponse));
                    } catch (error) {
                        console.error('Failed to store role content:', error);
                    }

                    // TRACK LOADING COMPLETED (Immediate)
                    analytics.track('role_loading_completed', {
                        role_name: role,
                        status: response.status,
                        duration_seconds: 0.5 // Approximate for immediate load
                    });

                    if (response.status === 'matched_by_ai') {
                        console.log('Role content loaded via AI matching:', readyResponse.data.aiMatching);
                    } else if (response.status === 'generated') {
                        console.log('Role content generated successfully');
                    } else {
                        console.log('Role content loaded successfully');
                    }
                } else if (response.status === 'generating') {
                    // Content is being generated (202 response)
                    const generatingResponse = response as RoleGeneratingResponse;
                    setIsGenerating(true);
                    setEstimatedWait(generatingResponse.data.estimated_wait_seconds);
                    console.log(`Content generating for ${generatingResponse.data.role_name}, estimated wait: ${generatingResponse.data.estimated_wait_seconds}s`);

                    analytics.track('role_loading_started', { role_name: role });

                    // Poll for content every 3 seconds until ready
                    pollInterval = setInterval(async () => {
                        try {
                            const pollResponse = await getRoleContent(role);
                            if (pollResponse.status === 'ready' || pollResponse.status === 'matched_by_ai' || pollResponse.status === 'generated') {
                                const readyResponse = pollResponse as RoleContentResponse;
                                setRoleContent(readyResponse);
                                setIsGenerating(false);
                                if (pollInterval) clearInterval(pollInterval);

                                analytics.track('role_loading_completed', {
                                    role_name: role,
                                    status: pollResponse.status,
                                    duration_seconds: generatingResponse.data.estimated_wait_seconds // Approximate
                                });

                                // Store role content for SelectSkillsPage
                                try {
                                    localStorage.setItem('roleContent', JSON.stringify(readyResponse));
                                } catch (error) {
                                    console.error('Failed to store role content:', error);
                                }

                                if (pollResponse.status === 'matched_by_ai') {
                                    console.log('Role content generation completed via AI matching');
                                } else if (pollResponse.status === 'generated') {
                                    console.log('Role content generation completed via AI generation');
                                } else {
                                    console.log('Role content generation completed');
                                }
                            }
                        } catch (pollError) {
                            console.error('Error polling for content:', pollError);
                            if (pollInterval) clearInterval(pollInterval);
                            setContentError('Failed to load role content. Please try again.');
                            setIsGenerating(false);
                        }
                    }, 3000);

                    // Clean up interval after estimated wait time + buffer
                    timeoutId = setTimeout(() => {
                        if (pollInterval) clearInterval(pollInterval);
                    }, (generatingResponse.data.estimated_wait_seconds + 10) * 1000);
                }
            } catch (error: any) {
                console.error('Failed to fetch role content:', error);

                // Handle 'Invalid Role' error (gibberish role) by redirecting to homepage with UTM params
                if (error.message === 'Invalid Role') {
                    console.log('Invalid role detected, redirecting to homepage...');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('role');
                    window.location.replace(`/?${newParams.toString()}`);
                    return;
                }

                setContentError('Failed to load role content. Please try again.');
                setIsGenerating(false);
            } finally {
                setIsLoadingContent(false);
            }
        };

        fetchRoleContent();

        // Cleanup function
        return () => {
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [role]); // Re-run if role changes

    // Track view_role_page event
    const hasTrackedViewRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isLoadingContent && !isGenerating && roleContent && hasTrackedViewRef.current !== role) {
            const isGeneratedByAi = roleContent.status === 'generated' || roleContent.status === 'matched_by_ai';

            // Track the view event
            analytics.track('view_role_page', {
                role_name: role,
                is_generated_by_ai: isGeneratedByAi
            });

            // Also ensure global properties are updated just in case
            const currentSessionId = getStoredSessionId();
            if (currentSessionId) {
                analytics.register({ session_id: currentSessionId, role_name: role });
            }

            hasTrackedViewRef.current = role;
        }
    }, [isLoadingContent, isGenerating, roleContent, role]);

    const handleBeginAssessment = async (buttonRef?: React.RefObject<HTMLButtonElement | null>) => {
        if (isLoadingSession || isTransitioning) {
            console.log('Session still loading or transitioning, please wait...');
            return;
        }

        // If there's an error, try to retry session creation
        if (sessionError) {
            console.log('Retrying session creation...');
            setIsLoadingSession(true);
            setSessionError(null);

            try {
                const utmParams = extractUrlParams();
                const sessionResponse = await createSession(role, utmParams);
                storeSessionId(sessionResponse.session_id);
                console.log('Session retry successful');
                setIsLoadingSession(false);
            } catch (error) {
                console.error('Session retry failed:', error);
                setSessionError('Failed to create session. Please try again.');
                setIsLoadingSession(false);
                return;
            }
        }

        // Get button position for animation origin
        const button = buttonRef?.current;
        if (button) {
            const rect = button.getBoundingClientRect();
            setTransitionOrigin({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        } else {
            // Fallback to center of screen
            setTransitionOrigin({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            });
        }

        // Start transition animation
        setIsTransitioning(true);

        // Navigate after animation completes
        setTimeout(() => {
            navigate('/loading');
        }, 1000); // Match animation duration
    };



    // Show loading screen while content is being fetched/generated
    // Show loading screen while content is being fetched/generated
    // We check for roleContent to conditions mostly, but if we have content, we show it.
    if ((isLoadingContent || isGenerating) && !roleContent) {
        const loadingMessage = isGenerating
            ? `Generating your personalized assessment... (${estimatedWait}s estimated)`
            : contentError
                ? 'Retrying content generation...'
                : 'Loading your personalized assessment...';

        return (
            <RoleContentLoadingPage
                role={role}
                statusMessage={loadingMessage}
            />
        );
    }

    // Show error state if content failed to load
    if (contentError && !roleContent) {
        return (
            <div className="min-h-screen text-white font-sans flex items-center justify-center"
                style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                    <p className="text-gray-300 mb-6">{contentError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[#98D048] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#87C639] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans pt-4 pb-48 lg:pb-8 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Centered Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 md:px-6 lg:px-8 xl:px-12 w-full pt-4 md:pt-6 lg:pt-8">
                <div className="w-full max-w-7xl">
                    <main className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center lg:items-start w-full">
                        {/* Left Column - Text Content */}
                        <div className="flex flex-col items-center lg:items-start lg:max-w-none w-full relative z-10">
                            {/* Hero Section */}
                            <HeroHeading
                                className="mb-2 lg:mb-10 max-w-4xl lg:max-w-none"
                                fallbackRole={roleContent?.data?.role?.name || role}
                                coreSkill={roleContent?.data?.role?.role_core_skill || roleContent?.data?.role?.skills?.[0]?.skill_name}
                                userName={_existingUser?.name}
                                subtitle={
                                    <>
                                        Stand Out With Global Certifications Like <span className="text-[#FFEA9A] font-bold">CHRPx</span>, <span className="text-[#FFEA9A] font-bold">SHRBPx</span> & <span className="text-[#FFEA9A] font-bold">PMHRx</span>.
                                    </>
                                }
                            />

                            {/* Mobile Only: Prominent Salary Display */}
                            <div className="lg:hidden w-full flex justify-center mb-10 animate-fade-in-up animation-delay-300 relative z-20">
                                <div className="inline-flex items-center gap-2 bg-[#38BDF8]/10 border border-[#38BDF8]/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.15)] backdrop-blur-sm">
                                    <img
                                        src="/assets/check-badge.svg"
                                        alt="Check"
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white font-medium text-xs tracking-wide">
                                        Unlock <span className="text-[#38BDF8] font-bold text-sm">{percentage}% Higher Salaries</span>
                                    </span>
                                </div>
                            </div>

                            {/* CTA Button & Social Proof - Desktop Only */}
                            <div className="hidden lg:flex lg:flex-col lg:items-start gap-4 mb-20">
                                {/* Motivational Line */}
                                <p className="text-[#98D048] font-semibold text-lg animate-fade-in-up animation-delay-900">
                                    Ready to Upgrade Your Profile? Ready to be Chased by Recruiters.
                                </p>
                                <div className="animate-fade-in-up animation-delay-1000">
                                    <Button
                                        ref={desktopButtonRef}
                                        variant="primary"
                                        className={`text-lg py-1 px-8 animate-pulsate-glow ${isLoadingSession || isTransitioning ? 'opacity-75 cursor-wait' : ''} ${sessionError ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        icon={isLoadingSession || isTransitioning ? <span className="text-xl animate-spin">⏳</span> : <span className="text-xl">→</span>}
                                        onClick={() => {
                                            analytics.track('click_begin_assessment', { role_name: role });
                                            handleBeginAssessment(desktopButtonRef);
                                        }}
                                        disabled={isLoadingSession || isTransitioning || !!sessionError}
                                    >
                                        {isLoadingSession || isTransitioning ? 'Starting...' : sessionError ? 'Error - Try Again' : 'Begin Assessment Now'}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-400 animate-fade-in-up animation-delay-1100">
                                    <div className="flex items-center gap-1.5 bg-[#001C2C] border border-[#7FC241]/30 px-2 py-0.5 rounded-full">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7FC241] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7FC241]"></span>
                                        </span>
                                        <span className="text-[#7FC241] font-bold text-[10px] uppercase tracking-wider">LIVE - {onlineUsersCount}</span>
                                    </div>
                                    <span className="text-white">{roleContent?.data?.role?.name || role}s taking test now</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Certificate Visual & Info Cards (Desktop) */}
                        <div className="w-full flex flex-col items-center mb-0 lg:mb-0">
                            <CertificateFan
                                className="lg:scale-110 xl:scale-125 transform-gpu lg:mb-8"
                                certificateImages={roleContent?.data?.role?.skills?.map(s => s.skill_certificate_preview_image_link || s.certificate_preview_url)}
                                certificateNames={roleContent?.data?.role?.skills?.map(s => s.certificate_name_short || s.skill_name)}
                                certificateFullNames={roleContent?.data?.role?.skills?.map(s => s.certificate_name || s.skill_name)}
                                delay={2200}
                            />

                            {/* Company Logos */}
                            <div className="w-full max-w-lg mb-8 lg:mb-4 mt-16 lg:mt-32 opacity-0 animate-fade-in-up" style={{ animationDelay: '3.5s' }}>
                                <CertificateValueSection
                                    showBenefits={false}
                                    showLogos={true}
                                    compact={true}
                                />
                            </div>

                            {/* Features & Report Section */}
                            <div className="mt-6 w-full max-w-lg opacity-0 animate-fade-in-up animation-delay-[4000ms]" style={{ animationDelay: '5.0s' }}>
                                <div className="bg-gradient-to-b from-[#0F2942]/80 to-[#0B1E32]/90 border border-[#38BDF8]/20 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-[#38BDF8]/40 transition-all duration-300">
                                    {/* Abstract background glow */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#38BDF8]/10 rounded-full blur-2xl group-hover:bg-[#38BDF8]/20 transition-all duration-500"></div>

                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="text-[#98D048]">Unlock</span> Your Career Potential
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Bonus 1 */}
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-[#001C2C]/50 border border-white/5 hover:bg-[#001C2C]/80 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-[#38BDF8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-5 h-5 text-[#38BDF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold text-sm">Detailed Free Report</h4>
                                                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                                    Get a comprehensive analysis of your current skill level and a roadmap to reach your career goals.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bonus 2 */}
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-[#001C2C]/50 border border-white/5 hover:bg-[#001C2C]/80 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-[#7FC241]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-5 h-5 text-[#7FC241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold text-sm">Personalized Courses</h4>
                                                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                                    Access curated micro-courses specifically designed to bridge your identified skill gaps immediately.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Included with Assessment</span>
                                    </div>
                                </div>
                            </div>


                            {/* Info Cards - Desktop Only (Frameworks) */}
                            <div className="hidden lg:block mt-24 w-full max-w-lg">
                                {/* InfoCards removed as requested */}

                                {/* Frameworks List */}
                                {frameworks.length > 0 && (
                                    <div className="flex flex-col items-center mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '4.5s' }}>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Global Frameworks</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {frameworks.map((fw, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-gradient-to-b from-[#0F2942] to-[#0B1E32] border border-white/10 rounded-md text-[11px] font-medium text-gray-300 shadow-sm hover:border-[#38BDF8]/50 hover:text-white hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all duration-300">
                                                    {fw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Cards - Mobile Only */}
                        <div className="lg:hidden mb-6 md:mb-8 col-span-full w-full max-w-lg mx-auto">

                            {/* Frameworks List */}
                            {frameworks.length > 0 && (
                                <div className="flex flex-col items-center mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '4.5s' }}>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Global HR Management Frameworks</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {frameworks.map((fw, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-gradient-to-b from-[#0F2942] to-[#0B1E32] border border-white/10 rounded-md text-[11px] font-medium text-gray-300 shadow-sm hover:border-[#38BDF8]/50 hover:text-white hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all duration-300">
                                                {fw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Certificate Ticker (using TagList) */}
                        <div className="w-full mt-8 mb-4 lg:hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '5.2s' }}>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-center">Included Certifications</p>
                            <TagList
                                tags={roleContent?.data?.role?.skills?.map(s => s.certificate_name_short || s.skill_name)}
                            />
                        </div>

                        {/* Video Testimonials Section */}
                        <div className="col-span-full w-full mt-12 lg:mt-24 mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '5.5s' }}>
                            <VideoTestimonialsSection />
                        </div>
                    </main>


                </div>
            </div>

            {/* Sticky Bottom Section - Mobile Only */}
            <div className="fixed bottom-0 left-0 w-full z-50 lg:hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '4.5s' }}>
                {/* The Bar itself */}
                <StickyBottomBar className="!relative !bottom-auto bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="hidden md:block">
                            {/* Placeholder for left content if needed */}
                        </div>

                        <div className="w-full md:w-auto flex flex-col items-center gap-2">
                            {/* Motivational Line */}
                            <p className="text-[#98D048] font-semibold text-base">
                                Ready to upgrade your profile?
                            </p>
                            <Button
                                ref={mobileButtonRef}
                                variant="primary"
                                className={`w-full md:w-auto text-lg py-2 px-6 md:py-3 md:px-8 animate-pulsate-glow ${isLoadingSession || isTransitioning ? 'opacity-75 cursor-wait' : ''} ${sessionError ? 'opacity-50 cursor-not-allowed' : ''}`}
                                icon={isLoadingSession || isTransitioning ? <span className="text-xl animate-spin">⏳</span> : <span className="text-xl">→</span>}
                                onClick={() => {
                                    analytics.track('click_begin_assessment', { role_name: role });
                                    handleBeginAssessment(mobileButtonRef);
                                }}
                                disabled={isLoadingSession || isTransitioning || !!sessionError}
                            >
                                {isLoadingSession || isTransitioning ? 'Starting...' : sessionError ? 'Error - Try Again' : 'Begin Assessment Now'}
                            </Button>

                            <p className="text-xs md:text-sm text-gray-400 mt-2">
                                <span className="text-white font-semibold">92%</span> of {roleContent?.data?.role?.name || role}s secured <span className="text-white font-semibold">Senior Interviews</span>
                            </p>
                        </div>

                        <div className="hidden md:block">
                            {/* Placeholder for right content */}
                        </div>
                    </div>
                </StickyBottomBar>
            </div>

            {/* Page Transition Overlay */}
            {isTransitioning && (
                <div className="page-transition-overlay">
                    <div
                        className="page-transition-circle"
                        style={{
                            left: transitionOrigin.x,
                            top: transitionOrigin.y
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default RolePage;
