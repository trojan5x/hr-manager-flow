import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createSession, checkCertifiedUser } from '../services/api';
import { extractUrlParams, extractEmailFromUrl } from '../utils/urlParams';
import { storeSessionId, storeRole, storeUrlParams, hasValidSession, storeEmail, storeContactDetails, getStoredSessionId } from '../utils/localStorage';
import { analytics } from '../services/analytics';

// Components
// Components
import TopBar from '../components/TopBar';
import HeroSection from '../components/landing/HeroSection';
import ProblemAgitationSection from '../components/landing/ProblemAgitationSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import BenefitBreakdownSection from '../components/landing/BenefitBreakdownSection';
import SocialProofSection from '../components/landing/SocialProofSection';
import FAQSection from '../components/landing/FAQSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import StickyMobileCTA from '../components/landing/StickyMobileCTA';

const RolePageVariant = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'HR Manager';
    const navigate = useNavigate();

    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionOrigin, setTransitionOrigin] = useState({ x: 0, y: 0 });
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    // Scroll tracking for Sticky CTA
    // Scroll tracking for Sticky CTA using Intersection Observer
    const heroCtaRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If CTA is fully visible (isIntersecting is true), hide sticky bar.
                // If CTA is not fully visible (isIntersecting is false), show sticky bar.
                setShowStickyCTA(!entry.isIntersecting);
            },
            {
                threshold: 1.0, // Trigger when 100% visible
            }
        );

        if (heroCtaRef.current) {
            observer.observe(heroCtaRef.current);
        }

        return () => {
            if (heroCtaRef.current) {
                observer.unobserve(heroCtaRef.current);
            }
        };
    }, []);

    // Check if user exists in system (for returning users with email in URL)
    useEffect(() => {
        const checkExistingUser = async () => {
            const emailFromUrl = extractEmailFromUrl();

            if (!emailFromUrl) {
                return;
            }

            console.log('Email found in URL, checking if user exists:', emailFromUrl);

            // Store email regardless of whether user exists
            storeEmail(emailFromUrl);

            // Check if user exists in our system
            const userData = await checkCertifiedUser(emailFromUrl);

            if (userData) {
                console.log('Existing user found:', userData.name);
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

                // Store session ID locally for future use
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
    }, [role]);

    // Analytics (view tracking)
    const hasTrackedViewRef = useRef<boolean>(false);
    useEffect(() => {
        if (!hasTrackedViewRef.current) {
            // Register session if available
            const currentSessionId = getStoredSessionId();
            if (currentSessionId) {
                analytics.register({ session_id: currentSessionId, role_name: role });
            }

            analytics.track('view_role_page', { role_name: role });
            hasTrackedViewRef.current = true;
        }
    }, [role]);

    const handleBeginAssessment = async (e?: React.MouseEvent) => {
        if (isLoadingSession || isTransitioning) return;

        // Track click immediately
        analytics.track('click_begin_assessment', {
            role_name: role,
            source: 'landing_page_variant'
        });

        // Visual transition effect origin
        if (e) {
            setTransitionOrigin({ x: e.clientX, y: e.clientY });
        } else {
            setTransitionOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }

        // Check if session already exists
        if (hasValidSession()) {
            setIsTransitioning(true);
            setTimeout(() => navigate('/loading'), 800);
            return;
        }

        setIsLoadingSession(true);
        setSessionError(null);

        try {
            const utmParams = extractUrlParams();
            storeUrlParams(utmParams);
            storeRole(role);

            const sessionResponse = await createSession(role, utmParams);
            storeSessionId(sessionResponse.session_id);

            setIsTransitioning(true);
            setTimeout(() => navigate('/loading'), 800);
        } catch (error) {
            console.error('Failed to initialize session:', error);
            setSessionError('Failed to start assessment. Please try again.');
        } finally {
            setIsLoadingSession(false);
        }
    };

    return (
        <div className="min-h-screen text-white font-sans overflow-x-hidden flex flex-col bg-[#001C2C]">
            {/* Header Elements */}

            <TopBar className="pt-2 lg:pt-4 xl:pt-6 bg-transparent absolute w-full z-20">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 max-w-[40%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 w-px bg-white/20 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 max-w-[40%] object-contain" />
                </div>
            </TopBar>

            {/* Main Content Sections */}
            <main className="flex-1 w-full pt-16 lg:pt-20">
                <HeroSection
                    onBeginAssessment={() => handleBeginAssessment()}
                    isLoading={isLoadingSession || isTransitioning}
                    ctaRef={heroCtaRef}
                />

                <ProblemAgitationSection />

                <HowItWorksSection />

                <SocialProofSection />

                <BenefitBreakdownSection />

                <FAQSection />

                <FinalCTASection
                    onBeginAssessment={() => handleBeginAssessment()}
                    isLoading={isLoadingSession || isTransitioning}
                />
            </main>

            {/* Mobile Sticky CTA */}
            {showStickyCTA && (
                <StickyMobileCTA
                    onBeginAssessment={() => handleBeginAssessment()}
                    isLoading={isLoadingSession || isTransitioning}
                />
            )}

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

            {/* Error Toast */}
            {sessionError && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
                    {sessionError}
                </div>
            )}
        </div>
    );
};

export default RolePageVariant;
