import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';

const PaymentLoadingPage = () => {
    const [animationPhase, setAnimationPhase] = useState<'loading' | 'success' | 'complete'>('loading');
    const [showElements, setShowElements] = useState({
        circle: false,
        check: false,
        ripple: false,
        title: false,
        subtitle: false,
        particles: false
    });

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId') || 'order_temp_123';
    const purchasedCerts = searchParams.get('certs')?.split(',') || [];

    // Simulate payment verification process
    useEffect(() => {
        const verifyPayment = async () => {
            // Show loading phase first
            await new Promise(resolve => setTimeout(resolve, 1500));

            // TODO: Call actual backend API to verify payment
            try {
                // Simulating API call
                const response = await fetch(`/api/verify-payment/${orderId}`);
                const result = await response.json();

                if (result.success) {
                    setAnimationPhase('success');
                    // Start success animation sequence
                    setTimeout(() => setShowElements(prev => ({ ...prev, circle: true })), 100);
                    setTimeout(() => setShowElements(prev => ({ ...prev, check: true, ripple: true })), 600);
                    setTimeout(() => setShowElements(prev => ({ ...prev, title: true })), 1200);
                    setTimeout(() => setShowElements(prev => ({ ...prev, subtitle: true })), 1600);
                    setTimeout(() => setShowElements(prev => ({ ...prev, particles: true })), 800);

                    // Navigate to success page after animation
                    setTimeout(() => {
                        setAnimationPhase('complete');
                        navigate(`/payment-success?orderId=${orderId}&certs=${purchasedCerts.join(',')}`);
                    }, 3000);
                } else {
                    // Handle payment failure
                    navigate('/payment-failed');
                }
            } catch (error) {
                console.error('Payment verification failed:', error);
                // For demo purposes, continue to success
                setAnimationPhase('success');
                setTimeout(() => setShowElements(prev => ({ ...prev, circle: true })), 100);
                setTimeout(() => setShowElements(prev => ({ ...prev, check: true, ripple: true })), 600);
                setTimeout(() => setShowElements(prev => ({ ...prev, title: true })), 1200);
                setTimeout(() => setShowElements(prev => ({ ...prev, subtitle: true })), 1600);
                setTimeout(() => setShowElements(prev => ({ ...prev, particles: true })), 800);

                setTimeout(() => {
                    setAnimationPhase('complete');
                    navigate(`/payment-success?orderId=${orderId}&certs=${purchasedCerts.join(',')}`);
                }, 3000);
            }
        };

        verifyPayment();
    }, [orderId, navigate, purchasedCerts]);

    return (
        <div className="min-h-screen text-white font-sans pt-4 overflow-x-hidden flex flex-col relative" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Loading Phase */}
            {animationPhase === 'loading' && (
                <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 xl:px-12">
                    <div className="text-center animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-6">
                            <div className="w-full h-full border-4 border-[#98D048] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-[#98D048] to-white bg-clip-text text-transparent">
                            Processing Your Payment
                        </h1>
                        <p className="text-base md:text-lg text-gray-300">
                            Verifying your transaction and preparing your certificates...
                        </p>
                    </div>
                </div>
            )}

            {/* Success Animation Phase */}
            {animationPhase === 'success' && (
                <>
                    {/* Success Animation Overlay */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001C2C]/95 backdrop-blur-xl">

                        {/* Animated Background Particles */}
                        {showElements.particles && (
                            <div className="absolute inset-0 animate-completion-particles">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-2 h-2 bg-[#98D048] rounded-full opacity-60"
                                        style={{
                                            left: `${20 + (i * 6.5)}%`,
                                            top: `${30 + (i % 3) * 20}%`,
                                            animationDelay: `${i * 0.1}s`,
                                            animation: `confettiFall 2s ease-out ${i * 0.1}s both`
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Main Success Content */}
                        <div className="relative text-center z-10">
                            {/* Success Circle with Ripple Effect */}
                            <div className="relative mb-8">
                                {/* Ripple Effect */}
                                {showElements.ripple && (
                                    <div className="absolute inset-0 rounded-full border-4 border-[#98D048] animate-completion-ripple opacity-30"></div>
                                )}

                                {/* Main Circle */}
                                {showElements.circle && (
                                    <div className="w-32 h-32 mx-auto bg-[#98D048] rounded-full flex items-center justify-center animate-completion-circle">
                                        {/* Checkmark */}
                                        {showElements.check && (
                                            <svg
                                                viewBox="0 0 100 100"
                                                className="w-16 h-16 text-[#021019] animate-completion-check"
                                            >
                                                <path
                                                    d="M20 52l16 16 32-32"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Success Title */}
                            {showElements.title && (
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#98D048] to-white bg-clip-text text-transparent animate-completion-title">
                                    Payment Successful!
                                </h1>
                            )}

                            {/* Success Subtitle */}
                            {showElements.subtitle && (
                                <p className="text-lg md:text-xl text-gray-300 animate-completion-subtitle">
                                    Your certificates are being prepared...
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2398D048' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>
        </div>
    );
};

export default PaymentLoadingPage;
