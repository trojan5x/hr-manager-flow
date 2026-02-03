import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import StickyBottomBar from '../components/StickyBottomBar';
import HorizontalSkillCard from '../components/HorizontalSkillCard';
import { certifications, type Certification } from '../constants/certifications';
import { getStoredSessionId, storeBundleId, getStoredUrlParams } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import type { RoleContentResponse } from '../types';
import { createBundle } from '../services/api';

const SelectSkillsPage = () => {
    const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
    const [roleData, setRoleData] = useState<RoleContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBundle, setIsCreatingBundle] = useState(false);
    const [bundleError, setBundleError] = useState<string | null>(null);
    const [showScrollArrow, setShowScrollArrow] = useState(true);
    const navigate = useNavigate();

    // Track scroll position for arrow fade
    useEffect(() => {
        const handleScroll = () => {
            // Hide arrow after scrolling 100px
            setShowScrollArrow(window.scrollY < 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    // Load role data from localStorage
    useEffect(() => {
        const loadRoleData = () => {
            try {
                // Try to get role content from localStorage (stored during role page visit)
                const storedRoleContent = localStorage.getItem('roleContent');

                if (storedRoleContent) {
                    const parsed = JSON.parse(storedRoleContent) as RoleContentResponse;
                    setRoleData(parsed);
                    console.log('Loaded role data from storage:', parsed);
                } else {
                    console.warn('No role data found in localStorage, using fallback static certifications');
                }
            } catch (error) {
                console.error('Error loading role data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRoleData();
    }, []);

    // Track page view once
    useEffect(() => {
        analytics.track('view_select_skills');
    }, []);

    // Convert API skills to Certification format
    const mapSkillsToCertifications = (skills: any[]): Certification[] => {
        return skills.map((skill) => ({
            id: skill.id.toString(), // Convert number to string
            name: skill.certificate_name || skill.skill_name, // Use certificate_name if available
            description: skill.description || 'Professional skill certification', // Fallback description
            testedSkill: skill.skill_name,
            frameworks: skill.frameworks || skill.skill_frameworks || [], // Support both field names
            price: 1999 // Static price as specified
        }));
    };

    // Get the original skill data for additional properties
    const getSkillData = (certificationId: string) => {
        return roleData?.data?.role?.skills?.find(skill => skill.id.toString() === certificationId);
    };

    // Note: Scenario distribution is now calculated by Xano backend

    // Get certifications - use API skills if available, otherwise fallback to static
    const availableCertifications = useMemo(() => {
        if (roleData?.data?.role?.skills) {
            return mapSkillsToCertifications(roleData.data.role.skills);
        }
        return certifications; // Fallback to static certifications
    }, [roleData]);



    // Default: Select all certifications when available
    useEffect(() => {
        if (!isLoading && availableCertifications.length > 0) {
            const allIds = Array.from(new Set(availableCertifications.map(c => c.id)));
            setSelectedCertifications(allIds);
        }
    }, [availableCertifications, isLoading]);


    const handleCertificationToggle = (id: string) => {
        setSelectedCertifications(prev => {
            // Use Set to prevent duplicates.
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            const newArray = Array.from(newSet);
            console.log('Updated selection:', newArray);
            return newArray;
        });
    };



    const [showPrepScreen, setShowPrepScreen] = useState(false);

    const handleStartAssessment = async (idsToSubmit?: string[], shouldShowPrepScreen: boolean = false) => {
        // Use passed IDs or fallback to state
        const ids = idsToSubmit || selectedCertifications;

        // Validation
        if (ids.length === 0) {
            setBundleError('Please select at least one certification to continue');
            return;
        }

        // Check if we have session and role data
        const sessionId = getStoredSessionId();
        if (!sessionId) {
            setBundleError('Session expired. Please refresh the page and try again.');
            return;
        }

        if (!roleData?.data?.role) {
            setBundleError('Role data not available. Please refresh the page and try again.');
            return;
        }

        // Only show prep screen if requested (auto-skip)
        if (shouldShowPrepScreen) {
            setShowPrepScreen(true);
        }

        setIsCreatingBundle(true);
        setBundleError(null);

        // Minimum loading time of 6 seconds - ONLY if showing prep screen
        const minLoadingPromise = shouldShowPrepScreen
            ? new Promise(resolve => setTimeout(resolve, 6000))
            : Promise.resolve(); // No delay for manual selection

        try {
            // Map selected certification IDs to skill objects with skill_id
            const selectedSkills = ids.map(id => {
                const skillData = getSkillData(id) as any; // Cast to access skill_id from API
                if (!skillData) {
                    throw new Error(`Skill data not found for ID: ${id}`);
                }
                return {
                    skill_id: skillData.skill_id || skillData.id // Use skill_id (specialized_skill_id) from API
                };
            });

            // Prepare bundle request with new format
            const bundleRequest = {
                session_id: sessionId,
                role_id: roleData.data.role.id, // Use role_id instead of role_name
                selected_skills: selectedSkills
            };

            console.log('Creating bundle with request:', bundleRequest);

            // Create the bundle in parallel with the timer (if exists)
            const [bundleResponse] = await Promise.all([
                createBundle(bundleRequest),
                minLoadingPromise
            ]);

            if (bundleResponse.success) {
                const bundleId = bundleResponse.data.bundle_id;

                // Store bundle ID for future API calls
                storeBundleId(bundleId);

                analytics.track('bundle_created', {
                    bundle_id: bundleId,
                    total_skills_selected: ids.length
                });

                console.log('Bundle created successfully, navigating to assessment...');

                // Clear any previous errors
                setBundleError(null);

                // Navigate to assessment page (bundle ID stored in localStorage)
                navigate('/assessment');
            } else {
                throw new Error(bundleResponse.message || 'Failed to create assessment bundle');
            }

        } catch (error) {
            console.error('Error creating bundle:', error);

            // If error, go back to selection screen
            setShowPrepScreen(false);

            if (error instanceof Error) {
                // Don't show success messages as errors
                if (error.message.includes('success') || error.message.includes('created successfully')) {
                    console.log('Bundle creation completed, navigation should have occurred');
                    return;
                }

                if (error.message.includes('400')) {
                    setBundleError('Invalid selection. Please check your skills and try again.');
                } else if (error.message.includes('404')) {
                    setBundleError('Session expired. Please refresh the page and try again.');
                } else if (error.message.includes('500')) {
                    setBundleError('Server error. Please try again later.');
                } else {
                    setBundleError(error.message || 'Failed to start assessment. Please try again.');
                }
            } else {
                setBundleError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsCreatingBundle(false);
        }

    };

    const autoSkipRef = useRef(false);

    // Auto-skip selection if utm_medium matches
    useEffect(() => {
        const checkAndSkip = async () => {
            // Check if already skipped or processing
            if (autoSkipRef.current || isCreatingBundle) return;

            // Ensure we have role data and certifications before proceeding
            if (!roleData?.data?.role || availableCertifications.length === 0) return;

            const urlParams = getStoredUrlParams();
            const utmMedium = urlParams?.utm_medium;

            if (utmMedium === 'opt_la_no-sel_res') {
                console.log('Auto-skipping selection due to utm_medium:', utmMedium);
                autoSkipRef.current = true;

                // Select all available certifications
                const allIds = availableCertifications.map(c => c.id);

                // Update selection state for UI consistency
                setSelectedCertifications(allIds);

                // Trigger assessment start immediately with prep screen
                await handleStartAssessment(allIds, true);
            }
        };

        checkAndSkip();
    }, [roleData, availableCertifications, isCreatingBundle]);


    // Lottie animation ref
    const animationContainer = useRef<HTMLDivElement>(null);
    const animationInstance = useRef<any>(null);

    // Handle Lottie animation when prep screen is shown
    useEffect(() => {
        if (!showPrepScreen) return;

        const loadLottieAnimation = async () => {
            if (animationInstance.current || !animationContainer.current) return;

            try {
                const lottie = (await import('lottie-web')).default;
                const response = await fetch('/assets/Cosmos.json');
                const animationData = await response.json();

                if (animationContainer.current && !animationInstance.current) {
                    animationInstance.current = lottie.loadAnimation({
                        container: animationContainer.current,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: animationData,
                    });
                }
            } catch (error) {
                console.error('Error loading Lottie animation:', error);
            }
        };

        loadLottieAnimation();

        return () => {
            if (animationInstance.current) {
                animationInstance.current.destroy();
                animationInstance.current = null;
            }
        };
    }, [showPrepScreen]);

    if (showPrepScreen) {
        return (
            <div className="min-h-screen text-white font-sans pt-4 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                    <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                        <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                        <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                        <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                    </div>
                </TopBar>

                <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 pt-8 flex flex-col items-center">
                    <div className="w-full max-w-2xl mx-auto text-center">
                        <div className="mb-8 animate-fade-in-up">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-[#98D048] to-white bg-clip-text text-transparent">
                                Creating your {roleData?.data?.role?.name || 'Professional'} Bundle
                            </h1>
                            <p className="text-base md:text-lg text-gray-300">
                                Personalizing your assessment experience...
                            </p>
                        </div>

                        {/* Lottie Animation */}
                        <div className="relative mb-6 animate-fade-in-up animation-delay-200">
                            <div className="w-48 h-48 md:w-56 md:h-56 mx-auto">
                                <div ref={animationContainer} className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="fixed bottom-0 left-0 right-0 z-10 animate-fade-in-up animation-delay-600">
                    <div className="bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10 px-4 py-4">
                        <div className="max-w-2xl mx-auto text-center">
                            <p className="text-xs text-gray-400 mb-2">
                                Our certificates are recognized by leading companies
                            </p>
                            <div className="flex items-center justify-center gap-4 md:gap-6">
                                {['image 2.svg', 'image 3.svg', 'image 4.svg', 'image 5.svg'].map((img, i) => (
                                    <img
                                        key={i}
                                        src={`/assets/companyLogos/${img}`}
                                        alt="Company Logo"
                                        className="h-5 md:h-6 opacity-60 hover:opacity-90 transition-opacity filter brightness-0 invert"
                                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans pt-4 pb-8 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Main Content */}
            <div className="flex-1 px-4 pt-4 md:px-6 lg:px-8 xl:px-12 py-8">
                <div className="w-full max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8 animate-fade-in-up">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-white mb-4">
                            Select top certifications to stand out in <span className="text-[#00C1FF] font-bold">{roleData?.data?.role?.name || 'Your Role'}</span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                            Recommended by experts, based on internationally recognized certifications & frameworks
                        </p>
                    </div>

                    {/* Select All Toggle - Hidden */}



                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mx-auto mb-4"></div>
                                <p className="text-gray-300">Loading your personalized skills...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Vertical Stacked Skills Cards */}
                            <div className="mb-12 animate-fade-in-up animation-delay-200">
                                <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                                    {availableCertifications.map((certification, index) => {
                                        const skillData = getSkillData(certification.id);
                                        // First card gets profile-match, last gets popular, rest get recommended
                                        const badgeType = index === 0
                                            ? 'profile-match'
                                            : (index === availableCertifications.length - 1 ? 'popular' : 'recommended');
                                        return (
                                            <HorizontalSkillCard
                                                key={certification.id}
                                                certification={certification}
                                                isSelected={selectedCertifications.includes(certification.id)}
                                                onToggle={handleCertificationToggle}
                                                certificateNameShort={skillData?.certificate_name_short}
                                                badgeType={badgeType}
                                                roleName={roleData?.data?.role?.name}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Sticky Bottom Bar - Always visible */}
            <div className={`fixed bottom-0 left-0 w-full z-50 animate-fade-in-up transition-transform duration-300 ${showScrollArrow && selectedCertifications.length === 0 ? 'translate-y-0' : 'translate-y-0'}`}>
                {/* Gradient top border effect */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#98D048]/50 to-transparent z-50"></div>

                <StickyBottomBar className="!relative !bottom-auto bg-[#001C2C]/95 backdrop-blur-2xl !p-0 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
                    <div className="flex flex-col items-center justify-center p-4 pb-6 gap-3">
                        <div className="w-full max-w-md mx-auto flex flex-col gap-3">
                            {/* Error message */}
                            {bundleError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mb-1 animate-fade-in">
                                    <p className="text-red-400 text-sm text-center">{bundleError}</p>
                                </div>
                            )}

                            {/* CTA Buttons Logic */}
                            {selectedCertifications.length === 0 || selectedCertifications.length === availableCertifications.length ? (
                                /* Default State: None or All selected - Single Primary CTA */
                                <button
                                    onClick={() => {
                                        if (selectedCertifications.length === 0) {
                                            const allIds = availableCertifications.map(c => c.id);
                                            handleStartAssessment(allIds);
                                        } else {
                                            handleStartAssessment();
                                        }
                                    }}
                                    disabled={isCreatingBundle}
                                    className={`
                                        w-full bg-[#98D048] text-[#001C2C] 
                                        font-bold text-sm sm:text-base md:text-lg py-3.5 px-3 sm:px-8 rounded-xl 
                                        flex items-center justify-center gap-2 sm:gap-3 
                                        transition-all duration-300 ease-out
                                        hover:bg-[#a6e64c] hover:shadow-[0_0_20px_rgba(152,208,72,0.4)] hover:-translate-y-0.5
                                        active:scale-[0.98]
                                        disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
                                        shadow-[0_4px_14px_rgba(0,0,0,0.25)]
                                        ${isCreatingBundle ? 'opacity-75' : ''}
                                    `}
                                >
                                    {isCreatingBundle ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#001C2C]"></div>
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="whitespace-nowrap font-bold">Continue with {availableCertifications.length} Certifications</span>
                                            <span className="text-lg md:text-xl">→</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                /* Less than all selected - Secondary (Selected) + Tertiary (All) */
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleStartAssessment()}
                                        disabled={isCreatingBundle || selectedCertifications.length === 0}
                                        className={`
                                            w-full bg-white/5 border border-white/20 text-white 
                                            font-bold text-sm sm:text-base py-3 px-3 rounded-xl 
                                            flex items-center justify-center gap-2 
                                            transition-all duration-300
                                            hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            ${isCreatingBundle ? 'opacity-75' : ''}
                                        `}
                                    >
                                        {isCreatingBundle ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <span className="whitespace-nowrap">Continue with {selectedCertifications.length} Selected Certifications</span>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            const allIds = availableCertifications.map(c => c.id);
                                            setSelectedCertifications(allIds);
                                            handleStartAssessment(allIds);
                                        }}
                                        disabled={isCreatingBundle}
                                        className="w-full text-sm font-extrabold transition-all duration-200 w-max mx-auto px-1 py-0.5 text-[#98D048] hover:text-[#a6e64c] hover:shadow-[0_1px_0_0_#a6e64c] shadow-[0_1px_0_0_#98D048] pb-0.5"
                                    >
                                        Continue with {availableCertifications.length} Certifications
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-col items-center mt-1">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0 font-medium">Based on review of 20,000+ job descriptions</p>

                        </div>
                    </div>
                </StickyBottomBar>
            </div>

            {/* Fixed Down Arrow at Bottom - Fades on Scroll */}
            {showScrollArrow && selectedCertifications.length === 0 && (
                <div
                    className="fixed bottom-32 md:bottom-36 inset-x-0 flex justify-center z-40 animate-bounce transition-opacity duration-300 pointer-events-none"
                    style={{ opacity: showScrollArrow ? 0.8 : 0 }}
                >
                    <img
                        src="/assets/down-arrow-selection-page.png"
                        alt="Scroll down"
                        className="w-12 h-12 md:w-16 md:h-16 cursor-pointer hover:opacity-100 pointer-events-auto filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        onClick={() => window.scrollBy({ top: 400, behavior: 'smooth' })}
                    />
                </div>
            )}
        </div>
    );
};

export default SelectSkillsPage;
