import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { fetchPopularRoles, searchRoles } from '../services/api';
import { analytics } from '../services/analytics';
import { extractUrlParams, extractEmailFromUrl } from '../utils/urlParams';
import { storeUrlParams } from '../utils/localStorage';

const Homepage = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [popularRoles, setPopularRoles] = useState<string[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Available profile images
    const profileImages = [
        '/assets/profile-images/image.png',
        '/assets/profile-images/image copy.png',
        '/assets/profile-images/image copy 2.png',
        '/assets/profile-images/image copy 3.png'
    ];

    // Generate random selection of 3 images that stays consistent during component lifecycle
    const randomProfileImages = useMemo(() => {
        const shuffled = [...profileImages].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }, []);

    // Initialize component and load data
    useEffect(() => {
        // Capture params BEFORE clearing to preserve them
        const urlParams = extractUrlParams();
        const email = extractEmailFromUrl();

        // Clear all local storage data when user comes to homepage (fresh user experience)
        try {
            localStorage.clear();
            console.log('Homepage: Cleared all localStorage data for fresh user experience');
        } catch (error) {
            console.error('Homepage: Error clearing localStorage:', error);
        }

        // Restore URL params if they existed
        if (Object.keys(urlParams).length > 0 || email) {
            storeUrlParams(urlParams, email);
            console.log('Homepage: Restored URL params after clear:', urlParams);
        }

        // Prevent double execution in React StrictMode
        if (hasInitialized) return;
        setHasInitialized(true);

        // Only check for role in URL (remove localStorage prefilling)
        const roleFromUrl = searchParams.get('role');

        if (roleFromUrl) {
            setSearchQuery(decodeURIComponent(roleFromUrl));
            console.log('Homepage: Pre-filled search with URL role:', roleFromUrl);
        }

        // Fetch popular roles from API (limit to 12 roles)
        const loadPopularRoles = async () => {
            try {
                setIsLoadingRoles(true);
                const roles = await fetchPopularRoles(12, 0); // Request 12 roles max
                const limitedRoles = roles.slice(0, 12); // Ensure max 12 roles
                setPopularRoles(limitedRoles);
                console.log('Homepage: Loaded popular roles:', limitedRoles);
            } catch (error) {
                console.error('Homepage: Failed to load popular roles:', error);
                // No fallback - show empty state
                setPopularRoles([]);
            } finally {
                setIsLoadingRoles(false);
            }
        };

        loadPopularRoles();
    }, [hasInitialized, searchParams]);

    // Handle search input with debouncing
    const handleSearchInputChange = (value: string) => {
        setSearchQuery(value);
        setSelectedSuggestionIndex(-1);

        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Hide suggestions if input is empty
        if (!value.trim() || value.trim().length < 2) {
            setShowSuggestions(false);
            setSearchSuggestions([]);
            return;
        }

        // Show loading state immediately for better UX
        setIsLoadingSuggestions(true);
        setShowSuggestions(true);
        console.log('Homepage: Showing suggestions dropdown for search:', value);

        // Debounce the API call
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('Homepage: Searching for suggestions:', value);
                const suggestions = await searchRoles(value, 8); // Limit to 8 suggestions
                console.log('Homepage: Got suggestions:', suggestions);
                setSearchSuggestions(suggestions);
                setShowSuggestions(suggestions.length > 0);
                console.log('Homepage: Set showSuggestions to:', suggestions.length > 0);
            } catch (error) {
                console.error('Failed to fetch search suggestions:', error);
                setSearchSuggestions([]);
                setShowSuggestions(false);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 300); // 300ms debounce delay
    };

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || searchSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < searchSuggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : searchSuggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    handleSuggestionClick(searchSuggestions[selectedSuggestionIndex], 'enter_key');
                } else {
                    handleGenerateAssessment('enter_key');
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string, selectionMethod: 'click' | 'enter_key') => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        analytics.track('search_role_performed', {
            search_query: suggestion,
            selection_method: selectionMethod
        });
        // Focus back on the input after selection
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Handle clicking outside to close suggestions
    const handleBlur = (e: React.FocusEvent) => {
        console.log('Homepage: Input blur event triggered');
        console.log('Homepage: Is mobile device:', 'ontouchstart' in window);
        console.log('Homepage: Current showSuggestions:', showSuggestions);

        // On mobile, don't hide suggestions on blur - let click outside handle it
        if ('ontouchstart' in window) {
            console.log('Homepage: Mobile detected, not hiding suggestions on blur');
            return;
        }

        // Check if the focus is moving to a suggestion button
        const relatedTarget = e.relatedTarget as HTMLElement;
        const suggestionsContainer = e.currentTarget.closest('.relative')?.querySelector('[data-suggestions-container]');

        // If focus is moving to a suggestion, don't hide
        if (relatedTarget && suggestionsContainer?.contains(relatedTarget)) {
            console.log('Homepage: Focus moving to suggestion, not hiding');
            return;
        }

        console.log('Homepage: Hiding suggestions after blur delay');
        // Delay hiding suggestions to allow for click events
        setTimeout(() => setShowSuggestions(false), 200);
    };

    // Handle clicking outside to close suggestions (mobile-friendly)
    const handleClickOutside = (e: Event) => {
        const target = e.target as HTMLElement;
        const searchContainer = searchInputRef.current?.closest('.relative');

        if (searchContainer && !searchContainer.contains(target)) {
            setShowSuggestions(false);
        }
    };

    // Add/remove click outside listener
    useEffect(() => {
        if (showSuggestions) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        } else {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showSuggestions]);

    // Cleanup debounce timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleGenerateAssessment = (trigger: 'button_click' | 'enter_key' = 'button_click') => {
        const params = new URLSearchParams(searchParams);

        if (searchQuery.trim()) {
            analytics.track('generate_assessment_clicked', {
                search_query: searchQuery.trim(),
                trigger_method: trigger
            });
            // Navigate with the role query parameter to homepage, preserving other params
            params.set('role', searchQuery.trim());
            navigate(`/?${params.toString()}`);
        } else {
            analytics.track('generate_assessment_clicked', {
                search_query: 'empty',
                trigger_method: trigger,
                action: 'navigate_to_role_selection'
            });
            // Navigate to role selection page with preserved params
            navigate(`/role?${params.toString()}`);
        }
    };

    const handleRoleClick = (role: string) => {
        analytics.track('popular_role_clicked', { role_name: role });
        const params = new URLSearchParams(searchParams);
        params.set('role', role);
        navigate(`/?${params.toString()}`);
    };

    return (
        <div className="min-h-screen text-white font-sans overflow-x-hidden relative" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Ambient Background Elements - Reduced on mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 bg-[#98D048]/5 rounded-full blur-2xl sm:blur-3xl"></div>
                <div className="absolute top-1/3 -left-20 sm:-left-40 w-48 sm:w-96 h-48 sm:h-96 bg-[#4285F4]/3 rounded-full blur-2xl sm:blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 sm:right-1/3 w-32 sm:w-64 h-32 sm:h-64 bg-[#98D048]/3 rounded-full blur-2xl sm:blur-3xl"></div>
            </div>

            {/* Top Bar with Logos */}
            <TopBar className="relative z-10 pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Main Content */}
            <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 pb-16 sm:pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <section className="text-center pt-6 sm:pt-8 lg:pt-12 xl:pt-16 pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
                        {/* Main Heading */}
                        <div className="mb-8 sm:mb-10 lg:mb-12">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-6 sm:mb-6 lg:mb-8 animate-fade-in-up px-2">
                                Prove Your Skills with
                                <br className="hidden sm:block" />
                                <span className="sm:hidden"> </span>
                                <span className="bg-gradient-to-r from-[#98D048] via-[#7AB836] to-[#98D048] bg-clip-text text-transparent drop-shadow-sm">
                                    Globally-Recognized
                                </span>
                                <br className="hidden sm:block" />
                                <span className="sm:hidden"> </span>
                                <span className="text-gray-100">Frameworks</span>
                            </h1>
                            <p className="text-lg sm:text-xl md:text-xl lg:text-2xl text-gray-300 font-light max-w-4xl mx-auto leading-relaxed animate-fade-in-up px-2" style={{ animationDelay: '0.2s' }}>
                                Get role-specific certifications through
                                <span className="text-white font-medium"> AI-powered assessments</span>.
                                <br className="hidden sm:block" />
                                <span className="sm:hidden"> </span>
                                Tell us your desired role and we'll generate a personalized assessment.
                            </p>
                        </div>

                        {/* Trusted by Section */}
                        <div className="mb-10 sm:mb-12 lg:mb-14 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <p className="text-base sm:text-lg lg:text-lg text-gray-400 mb-6 sm:mb-6 lg:mb-8 font-medium px-2">Recognized by industry leaders</p>
                            <div className="flex justify-center items-center gap-2 xs:gap-3 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16 px-2 xs:px-4 overflow-x-auto pb-2 scrollbar-hide">
                                <img src="/assets/companyLogos/image 2.svg" alt="Google" className="h-6 xs:h-7 sm:h-10 md:h-12 lg:h-14 flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 filter grayscale hover:grayscale-0 min-w-0" />
                                <img src="/assets/companyLogos/image 3.svg" alt="Flipkart" className="h-6 xs:h-7 sm:h-10 md:h-12 lg:h-14 flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 filter grayscale hover:grayscale-0 min-w-0" />
                                <img src="/assets/companyLogos/image 4.svg" alt="Zepto" className="h-6 xs:h-7 sm:h-10 md:h-12 lg:h-14 flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 filter grayscale hover:grayscale-0 min-w-0" />
                                <img src="/assets/companyLogos/image 5.svg" alt="LinkedIn" className="h-6 xs:h-7 sm:h-10 md:h-12 lg:h-14 flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 filter grayscale hover:grayscale-0 min-w-0" />
                            </div>
                        </div>

                        {/* CTA Search Section */}
                        <div className="max-w-3xl mx-auto mb-12 sm:mb-14 lg:mb-16 animate-fade-in-up px-2" style={{ animationDelay: '0.4s' }}>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#98D048] via-[#4285F4] to-[#98D048] rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                                <div className="relative bg-[#0F2B3C]/90 backdrop-blur-xl rounded-2xl p-2 sm:p-3 border border-[#98D048]/30 shadow-2xl">
                                    <div className="flex flex-col gap-2 sm:gap-3">
                                        <div className="flex-1 relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#98D048]/5 via-transparent to-[#4285F4]/5 rounded-xl"></div>
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Enter your desired role... (e.g., HR Leader, Backend Engineer, Product Manager)"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                onBlur={handleBlur}
                                                onFocus={() => {
                                                    console.log('Homepage: Input focused, suggestions length:', searchSuggestions.length);
                                                    console.log('Homepage: Current search query:', searchQuery);
                                                    console.log('Homepage: Is mobile device:', 'ontouchstart' in window);

                                                    // Force show suggestions if we have them
                                                    if (searchSuggestions.length > 0 && searchQuery.trim().length >= 2) {
                                                        setShowSuggestions(true);
                                                        console.log('Homepage: Showing suggestions on focus');
                                                    }

                                                    // On mobile, trigger search if there's already content
                                                    if ('ontouchstart' in window && searchQuery.trim().length >= 2) {
                                                        handleSearchInputChange(searchQuery);
                                                    }
                                                }}
                                                onInput={(e) => {
                                                    // Additional mobile compatibility
                                                    console.log('Homepage: Input event triggered:', (e.target as HTMLInputElement).value);
                                                }}
                                                className="relative z-10 w-full bg-[#001C2C]/60 text-white placeholder-gray-300 px-5 sm:px-6 py-5 sm:py-6 outline-none text-base sm:text-lg font-medium rounded-xl border border-[#98D048]/20 focus:border-[#98D048]/50 focus:bg-[#001C2C]/80 transition-all duration-200 focus:placeholder-gray-400 touch-manipulation"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                            />

                                            {/* Search Suggestions Dropdown */}
                                            {showSuggestions && (() => {
                                                console.log('Homepage: Rendering suggestions dropdown, showSuggestions:', showSuggestions, 'suggestions length:', searchSuggestions.length, 'isLoading:', isLoadingSuggestions);
                                                return true;
                                            })() && (
                                                    <div
                                                        data-suggestions-container
                                                        className="absolute top-full left-0 right-0 mt-2 bg-[#0F2B3C] backdrop-blur-sm rounded-xl border border-[#98D048]/60 shadow-2xl z-[999] max-h-64 overflow-y-auto"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: '0',
                                                            right: '0',
                                                            zIndex: 9999,
                                                            marginTop: '8px',
                                                            backgroundColor: '#0F2B3C',
                                                            minWidth: '100%',
                                                            width: '100%',
                                                            display: 'block',
                                                            visibility: 'visible',
                                                            opacity: 1
                                                        }}
                                                        onMouseDown={(e) => {
                                                            // Prevent input blur when clicking suggestions
                                                            e.preventDefault();
                                                        }}
                                                        onTouchStart={() => {
                                                            // Log touch interaction
                                                            console.log('Homepage: Touch start on suggestions container');
                                                        }}
                                                    >
                                                        {isLoadingSuggestions ? (
                                                            <div className="p-4 text-center text-gray-300 bg-[#0F2B3C]">
                                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#98D048]"></div>
                                                                <span className="ml-2">Searching...</span>
                                                            </div>
                                                        ) : searchSuggestions.length > 0 ? (
                                                            <div className="py-2">
                                                                {searchSuggestions.map((suggestion, index) => (
                                                                    <button
                                                                        key={`suggestion-${index}`}
                                                                        onClick={(e) => {
                                                                            console.log('Homepage: Suggestion clicked:', suggestion);
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleSuggestionClick(suggestion, 'click');
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            // Prevent input blur
                                                                            e.preventDefault();
                                                                            console.log('Homepage: Suggestion mouse down:', suggestion);
                                                                        }}
                                                                        onTouchStart={() => {
                                                                            setSelectedSuggestionIndex(index);
                                                                            console.log('Homepage: Suggestion touch start:', suggestion);
                                                                        }}
                                                                        onTouchEnd={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            console.log('Homepage: Suggestion touch end, clicking:', suggestion);
                                                                            handleSuggestionClick(suggestion, 'click');
                                                                        }}
                                                                        className={`w-full text-left px-4 py-4 text-white hover:bg-[#98D048]/20 active:bg-[#98D048]/30 transition-colors duration-200 touch-manipulation cursor-pointer ${index === selectedSuggestionIndex
                                                                            ? 'bg-[#98D048]/20 border-l-2 border-[#98D048]'
                                                                            : ''
                                                                            }`}
                                                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                                                        style={{
                                                                            minHeight: '48px', // Ensure good touch target size
                                                                            WebkitTapHighlightColor: 'rgba(152, 208, 72, 0.2)'
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#98D048]/30 flex items-center justify-center">
                                                                                <div className="w-2 h-2 rounded-full bg-[#98D048]"></div>
                                                                            </div>
                                                                            <span className="text-base font-medium">{suggestion}</span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 text-center text-gray-400">
                                                                No roles found for "{searchQuery}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                        <button
                                            onClick={() => handleGenerateAssessment('button_click')}
                                            className="bg-gradient-to-r from-[#98D048] to-[#7AB836] hover:from-[#87BF3F] hover:to-[#6BA32D] text-[#021019] px-6 sm:px-10 py-5 sm:py-6 rounded-xl font-bold transition-all duration-200 text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-[0.98] w-full sm:w-auto relative overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Generate My Assessment
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 text-sm sm:text-base text-gray-300 px-2">
                                <div className="flex -space-x-2 sm:-space-x-3">
                                    {randomProfileImages.map((imageSrc, index) => (
                                        <img
                                            key={index}
                                            src={imageSrc}
                                            alt={`Professional ${index + 1}`}
                                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-3 border-[#001C2C] shadow-lg object-cover"
                                        />
                                    ))}
                                </div>
                                <span className="font-medium text-center">127 assessments generated today</span>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="mb-14 sm:mb-16 lg:mb-20 animate-fade-in-up px-2" style={{ animationDelay: '0.5s' }}>
                        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5">Why Choose Our Certifications?</h2>
                            <p className="text-lg sm:text-xl lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">Experience the most efficient and credible way to validate your professional skills</p>
                        </div>

                        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-12">
                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#98D048] to-[#7AB836] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative bg-[#0B2A3D]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 h-full">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#98D048]/20 to-[#7AB836]/20 rounded-2xl mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#98D048]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Quick Assessment</h3>
                                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                                        Complete practical assessments in just 30 minutes.
                                        <span className="text-white font-medium"> If you have the skills, you'll breeze through it</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4285F4] to-[#3367D6] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative bg-[#0B2A3D]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 h-full">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#4285F4]/20 to-[#3367D6]/20 rounded-2xl mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#4285F4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Industry Recognition</h3>
                                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                                        Backed by frameworks from 1100+ companies.
                                        <span className="text-white font-medium"> Share instantly on LinkedIn or your resume</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                <div className="relative bg-[#0B2A3D]/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 h-full">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF6B35]/20 to-[#E55A2B]/20 rounded-2xl mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6m8 0H8" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">Real-World Scenarios</h3>
                                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                                        Solve authentic challenges that professionals face daily.
                                        <span className="text-white font-medium"> Prove your job-readiness with practical skills</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Certifications Section */}
                    <section className="text-center animate-fade-in-up px-2" style={{ animationDelay: '0.6s' }}>
                        <div className="mb-8 sm:mb-10 lg:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5">Popular Role-Based Assessments</h2>
                            <p className="text-lg sm:text-xl lg:text-xl text-gray-300 max-w-3xl mx-auto px-2">Or select from these high-demand professional roles to get started instantly</p>
                        </div>

                        {/* Animated TagList */}
                        <div className="mb-8 sm:mb-10 lg:mb-12">
                            <div className="animate-fade-in-up">
                                {isLoadingRoles ? (
                                    // Loading state for popular roles
                                    <>
                                        {/* Mobile: Loading skeleton */}
                                        <div className="relative overflow-hidden lg:hidden">
                                            <div className="flex items-center gap-3">
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <div key={i} className="px-4 py-3 min-w-[80px] h-[40px] rounded-2xl bg-white/10 animate-pulse flex-shrink-0"></div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Desktop: Loading skeleton */}
                                        <div className="hidden lg:flex lg:flex-wrap lg:justify-center lg:gap-4 max-w-6xl mx-auto">
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <div key={i} className="px-5 py-3 h-[48px] min-w-[120px] rounded-2xl bg-white/10 animate-pulse"></div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Mobile: Scrolling Animation */}
                                        <div
                                            className="relative overflow-hidden lg:hidden"
                                            onMouseEnter={(e) => {
                                                const scrollDiv = e.currentTarget.querySelector('.animate-scroll-infinite');
                                                if (scrollDiv) (scrollDiv as HTMLElement).style.animationPlayState = 'paused';
                                            }}
                                            onMouseLeave={(e) => {
                                                const scrollDiv = e.currentTarget.querySelector('.animate-scroll-infinite');
                                                if (scrollDiv) (scrollDiv as HTMLElement).style.animationPlayState = 'running';
                                            }}
                                            onTouchStart={(e) => {
                                                const scrollDiv = e.currentTarget.querySelector('.animate-scroll-infinite');
                                                if (scrollDiv) (scrollDiv as HTMLElement).style.animationPlayState = 'paused';
                                            }}
                                            onTouchEnd={(e) => {
                                                const scrollDiv = e.currentTarget.querySelector('.animate-scroll-infinite');
                                                if (scrollDiv) (scrollDiv as HTMLElement).style.animationPlayState = 'running';
                                            }}
                                        >
                                            <div className="flex items-center animate-scroll-infinite" style={{ gap: '12px' }}>
                                                {[...popularRoles, ...popularRoles, ...popularRoles].map((role, index) => (
                                                    <React.Fragment key={`${role}-${index}`}>
                                                        <button
                                                            onClick={() => handleRoleClick(role)}
                                                            className="px-4 py-3 min-w-[80px] h-[40px] flex items-center justify-center rounded-2xl border border-[#98D048]/40 bg-[#98D048]/10 hover:bg-[#98D048]/20 text-white text-sm backdrop-blur-sm whitespace-nowrap flex-shrink-0 select-none transition-all duration-200 active:scale-95"
                                                        >
                                                            {role}
                                                        </button>
                                                        {index < ([...popularRoles, ...popularRoles, ...popularRoles].length - 1) && (
                                                            <div className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0"></div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Desktop: Single Row Static Grid */}
                                        <div className="hidden lg:flex lg:flex-wrap lg:justify-center lg:gap-4 max-w-6xl mx-auto">
                                            {popularRoles.map((role, index) => (
                                                <button
                                                    key={`${role}-${index}`}
                                                    onClick={() => handleRoleClick(role)}
                                                    className="px-5 py-3 flex items-center justify-center rounded-2xl border border-[#98D048]/40 bg-[#98D048]/10 hover:bg-[#98D048]/20 hover:border-[#98D048]/60 text-white text-base backdrop-blur-sm whitespace-nowrap select-none transition-all duration-200 hover:scale-105 active:scale-95"
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                navigate(`/role?${params.toString()}`);
                            }}
                            className="text-[#98D048] hover:text-[#7AB836] transition-colors duration-200 text-base sm:text-lg font-medium group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl hover:bg-[#98D048]/10 border border-[#98D048]/20 hover:border-[#98D048]/40 transition-all duration-200"
                        >
                            <span>Explore all role assessments</span>
                            <span className="inline-block transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
