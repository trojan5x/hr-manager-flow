import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { getStoredSessionId } from '../utils/localStorage';

const LoadingPage = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [animationLoaded, setAnimationLoaded] = useState(false);
    const animationContainer = useRef<HTMLDivElement>(null);
    const animationInstance = useRef<any>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedCerts = useRef(searchParams.get('certs')?.split(',') || []);

    // Load Lottie animation using vanilla lottie-web
    useEffect(() => {
        const loadLottieAnimation = async () => {
            // Prevent loading if already loaded or container doesn't exist
            if (animationInstance.current || !animationContainer.current) {
                return;
            }

            try {
                // Dynamically import lottie-web
                const lottie = (await import('lottie-web')).default;

                // Load JSON animation file
                const response = await fetch('/assets/Cosmos.json');
                const animationData = await response.json();

                // Create animation
                if (animationContainer.current && !animationInstance.current) {
                    animationInstance.current = lottie.loadAnimation({
                        container: animationContainer.current,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: animationData,
                    });
                    setAnimationLoaded(true);
                }
            } catch (error) {
                console.error('Error loading Lottie animation:', error);
            }
        };

        loadLottieAnimation();

        // Cleanup function
        return () => {
            if (animationInstance.current) {
                animationInstance.current.destroy();
                animationInstance.current = null;
                setAnimationLoaded(false);
            }
        };
    }, []);

    const steps = [
        "Analyzing selected certifications...",
        "Generating personalized questions...",
        "Applying global framework standards...",
        "Optimizing assessment difficulty...",
        "Finalizing your premium experience..."
    ];

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 2000);

        // Auto-navigate to assessment after loading completes
        const navigationTimeout = setTimeout(() => {
            // Use the real session ID if available, otherwise fallback to mock for safety
            const realSessionId = getStoredSessionId();
            const assessmentId = realSessionId || `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Handle empty certs gracefully
            const certsParam = selectedCerts.current.length > 0 ? `&certs=${selectedCerts.current.join(',')}` : '';
            const targetUrl = `/assessment?id=${assessmentId}${certsParam}`;
            console.log('Auto-navigating to:', targetUrl);
            navigate(targetUrl);
        }, 3000);

        return () => {
            clearInterval(stepInterval);
            clearTimeout(navigationTimeout);
        };
    }, []); // Empty dependency array to prevent re-running

    return (
        <div className="min-h-screen text-white font-sans pt-4 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Main Loading Content */}
            <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 pt-8">
                <div className="w-full max-w-2xl mx-auto text-center">

                    {/* Main Heading - At the top */}
                    <div className="mb-8 animate-fade-in-up">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-[#98D048] to-white bg-clip-text text-transparent">
                            Preparing Your Assessment
                        </h1>
                        <p className="text-base md:text-lg text-gray-300">
                            Our AI is personalizing your certification journey
                        </p>
                    </div>

                    {/* Lottie Animation */}
                    <div className="relative mb-6 animate-fade-in-up animation-delay-200">
                        <div className="w-48 h-48 md:w-56 md:h-56 mx-auto">
                            <div
                                ref={animationContainer}
                                className="w-full h-full"
                                style={{ opacity: animationLoaded ? 1 : 0 }}
                            />
                            {!animationLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-[#98D048] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Step - Below animation */}
                    <div className="mb-8 animate-fade-in-up animation-delay-400">
                        <p className="text-sm md:text-base text-[#98D048] font-medium">
                            {steps[currentStep]}
                        </p>
                    </div>

                </div>
            </div>

            {/* Social Proof - Fixed to Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-10 animate-fade-in-up animation-delay-600">
                <div className="bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10 px-4 py-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-xs text-gray-400 mb-2">
                            Our certificates are recognized by leading companies
                        </p>
                        <div className="flex items-center justify-center gap-4 md:gap-6">
                            <img
                                src="/assets/companyLogos/image 2.svg"
                                alt="Company Logo"
                                className="h-5 md:h-6 opacity-60 hover:opacity-90 transition-opacity filter brightness-0 invert"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <img
                                src="/assets/companyLogos/image 3.svg"
                                alt="Company Logo"
                                className="h-5 md:h-6 opacity-60 hover:opacity-90 transition-opacity filter brightness-0 invert"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <img
                                src="/assets/companyLogos/image 4.svg"
                                alt="Company Logo"
                                className="h-5 md:h-6 opacity-60 hover:opacity-90 transition-opacity filter brightness-0 invert"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <img
                                src="/assets/companyLogos/image 5.svg"
                                alt="Company Logo"
                                className="h-5 md:h-6 opacity-60 hover:opacity-90 transition-opacity filter brightness-0 invert"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingPage;
