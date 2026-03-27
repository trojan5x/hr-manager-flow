import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { countryCodes } from '../constants/countryCodes';
import { analytics } from '../services/analytics';
import { storeContactDetails, getUserEmail, getStoredSessionId } from '../utils/localStorage';
import {
    checkCertifiedUser,
    signupUser,
    updateSessionUser,
    getSessionDetails,
    getRoleCommunitySize
} from '../services/api';

const ContactDetailsPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const assessmentId = searchParams.get('id');
    const sessionIdParam = searchParams.get('session_id');

    // Helper function to build results URL with all available parameters
    const buildResultsUrl = () => {
        const params = new URLSearchParams();
        if (assessmentId) params.append('id', assessmentId);
        if (sessionIdParam) params.append('session_id', sessionIdParam);
        return `/results?${params.toString()}`;
    };

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

    // Form state
    const [contactDetails, setContactDetails] = useState({
        email: '',
        phone: '',
        name: ''
    });
    const [countryCode, setCountryCode] = useState('+91');
    const [roleName, setRoleName] = useState(''); // Dynamic role name
    const [communitySize, setCommunitySize] = useState(2847); // Dynamic community size
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingUser, setIsCheckingUser] = useState(true);

    // Track page view and check user
    useEffect(() => {
        // Register session if available
        const currentSessionId = getStoredSessionId();
        if (currentSessionId) {
            analytics.register({ session_id: currentSessionId });
            analytics.setSessionId(currentSessionId);
            
            if (import.meta.env.DEV) {
                console.log('[ContactDetailsPage] 📝 Registered session with analytics:', currentSessionId.slice(0, 8) + '...');
            }
        }
        
        analytics.track('view_contact_details');

        const checkExistingUserAndFetchDetails = async () => {
            // Fetch session details if we have an assessmentId
            if (assessmentId) {
                const sessionDetails = await getSessionDetails(assessmentId);
                if (sessionDetails?.role) {
                    setRoleName(sessionDetails.role);
                    const size = await getRoleCommunitySize(sessionDetails.role);
                    setCommunitySize(size);
                }
            } else {
                // Fallback for direct navigation without ID
                setRoleName('Professional');
            }

            const storedEmail = getUserEmail();

            if (storedEmail) {
                // Always pre-fill if we have an email
                setContactDetails(prev => ({ ...prev, email: storedEmail }));

                try {
                    // Check if user exists in system
                    const userData = await checkCertifiedUser(storedEmail);

                    if (userData) {
                        // EXISTING USER - Skip form flow
                        console.log('Existing user found, skipping form:', userData);

                        // ✨ User is recognized from external system (e.g. Xano)
                        // We must ensure they have a record in our local Supabase 'users' table too
                        const signupRes = await signupUser({
                            name: userData.name,
                            email: userData.email,
                            phone: userData.phone_number
                        });

                        const userId = signupRes?.data?.id;
                        const currentSessionId = assessmentId || getStoredSessionId();

                        if (currentSessionId && userId) {
                            console.log('Linking recognized user to session:', userId);
                            await updateSessionUser(currentSessionId, userId);
                        }

                        // Store consistency in local storage
                        localStorage.setItem('userEmail', userData.email);
                        localStorage.setItem('userName', userData.name);
                        localStorage.setItem('userPhone', userData.phone_number);

                        // Proceed directly to results
                        navigate(buildResultsUrl());
                        return;
                    }
                } catch (error) {
                    console.error('Error checking user:', error);
                }
            }

            // If no user found or error, show form
            setIsCheckingUser(false);
        };

        checkExistingUserAndFetchDetails();
    }, [assessmentId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactDetails.email || !contactDetails.name) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Signup/Upsert User in Supabase
            const signupRes = await signupUser({
                name: contactDetails.name,
                email: contactDetails.email,
                phone: `${countryCode}${contactDetails.phone}`,
                role: roleName
            });

            // 2. Link User to Session
            const currentSessionId = assessmentId || getStoredSessionId();
            const userId = signupRes?.data?.id;

            if (currentSessionId && userId) {
                console.log('Linking new user to session:', userId);
                await updateSessionUser(currentSessionId, userId);
            }

            // 3. Store contact details locally
            storeContactDetails({
                email: contactDetails.email,
                name: contactDetails.name,
                phone: `${countryCode}${contactDetails.phone}`
            });
            localStorage.setItem('userEmail', contactDetails.email);
            localStorage.setItem('userName', contactDetails.name);
            localStorage.setItem('userPhone', `${countryCode}${contactDetails.phone}`);

            // Track contact submission
            analytics.track('contact_details_submitted', {
                email: contactDetails.email,
                role: roleName
            });

            // 4. Finally Navigate
            navigate(buildResultsUrl());

        } catch (e) {
            console.error('Signup/Link flow failed', e);
            // Re-enable button so user can try again or we can show an error
            setIsSubmitting(false);
            alert('There was a problem saving your details. Please try again or contact support.');
        }
    };

    if (isCheckingUser) {
        return (
            <div className="min-h-screen text-white font-sans flex flex-col items-center justify-center" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <div className="w-16 h-16 border-4 border-[#98D048] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-white animate-pulse">Checking your account...</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans pt-4 pb-16 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Centered Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 md:px-6 lg:px-8 xl:px-12">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-8 animate-fade-in-up">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Your Report is Ready
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Please provide your contact details to receive your personalized {roleName} Strategic Assessment report.
                        </p>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 animate-fade-in-up animation-delay-200">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={contactDetails.name}
                                    onChange={(e) => setContactDetails({ ...contactDetails, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#98D048] focus:bg-white/20 transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={contactDetails.email}
                                    onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#98D048] focus:bg-white/20 transition-colors"
                                    placeholder="your.email@company.com"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Phone Number *
                                </label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    {/* Country Code Selector */}
                                    <div className="relative w-full md:w-1/3 md:min-w-[120px]">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="w-full h-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:border-[#98D048] focus:bg-white/20 transition-colors cursor-pointer"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                backgroundPosition: 'right 0.5rem center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundSize: '1.5em 1.5em',
                                                paddingRight: '2.5rem'
                                            }}
                                        >
                                            {countryCodes.map((country) => (
                                                <option key={country.code} value={country.dial_code} className="bg-[#001C2C] text-white">
                                                    {country.code} ({country.dial_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={contactDetails.phone}
                                        onChange={(e) => setContactDetails({ ...contactDetails, phone: e.target.value })}
                                        className="w-full md:flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#98D048] focus:bg-white/20 transition-colors"
                                        placeholder="98765 43210"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${isSubmitting ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-[#98D048] hover:bg-[#7AB93D] active:scale-95 text-black hover:shadow-lg'}`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                        <span>Generating Results...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Get My Results</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* Social Proof */}
                        <div className="mt-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <div className="flex -space-x-1">
                                    {randomProfileImages.map((imageSrc, index) => (
                                        <img
                                            key={index}
                                            src={imageSrc}
                                            alt={`Professional ${index + 1}`}
                                            className="w-5 h-5 rounded-full border-2 border-[#001C2C] shadow-lg object-cover"
                                        />
                                    ))}
                                </div>
                                <span>Join {communitySize.toLocaleString()}+ {roleName} leaders</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactDetailsPage;
