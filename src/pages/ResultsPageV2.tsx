import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ResultsCard, { type PhaseBreakdown } from '../components/ResultsCard';
import BundleSection from '../components/BundleSection';


import FAQSection from '../components/FAQSection';
import CertificateValueSection from '../components/CertificateValueSection';
import SuccessStoriesSection from '../components/SuccessStoriesSection';
import { fetchAssessmentReport, fetchBundleProducts, createRazorpayOrder, checkPaymentStatus, type BundleProductData, type CertificationItem } from '../services/api';
import { getStoredSessionId, getStoredBundleId, getUserName, getStoredRole } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import type { AssessmentReportData } from '../types';

// Razorpay key from environment variable
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';



const ResultsPage = () => {
    const [searchParams] = useSearchParams();

    // API State
    const [reportData, setReportData] = useState<AssessmentReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isPollingSummary, setIsPollingSummary] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState<string>('');
    const [selectedIndividualIds, setSelectedIndividualIds] = useState<number[]>([]);


    // Bundle State
    const [bundleData, setBundleData] = useState<BundleProductData | null>(null);
    const [isPurchaseAreaVisible, setIsPurchaseAreaVisible] = useState(false);

    // Get IDs from URL or localStorage
    const sessionIdParam = searchParams.get('session_id');
    const storedSessionId = getStoredSessionId();
    const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : (storedSessionId ? parseInt(storedSessionId, 10) : null);

    const bundleIdParam = searchParams.get('bundle_id');
    const storedBundleId = getStoredBundleId();
    const bundleId = bundleIdParam ? parseInt(bundleIdParam, 10) : (storedBundleId ? parseInt(storedBundleId, 10) : null);

    // Get score from URL params, default to 80 for demo (will be overwritten by API if functional)
    const urlScore = parseInt(searchParams.get('score') || '0', 10);
    const [score, setScore] = useState(urlScore);

    // Track results page view
    useEffect(() => {
        if (!isLoading && score !== null) {
            analytics.track('view_results_page', {
                score,
                result_status: score >= 50 ? 'Pass' : 'Fail'
            });
        }
    }, [isLoading, score]);



    // Determine Role Name
    const roleParam = searchParams.get('role');
    const derivedRole = roleParam || getStoredRole() || 'Professional';
    const userName = getUserName();


    // Fetch Assessment Report
    useEffect(() => {
        let isMounted = true;
        let pollingInterval: ReturnType<typeof setInterval>;
        let attempts = 0;
        const maxAttempts = 12; // Poll for ~1 minute (5s * 12)

        const loadReport = async () => {
            if (!sessionId) {
                console.warn('No session ID found for report.');
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                if (isMounted) setIsLoading(true);
                // Initial fetch with 0 retries to load data fast (even if summary missing)
                const response = await fetchAssessmentReport(sessionId, 0);

                if (isMounted) {
                    setReportData(response.data);

                    // Update score from API (convert raw correct count to percentage)
                    if (response.data.assessment_score) {
                        const rawScore = parseInt(response.data.assessment_score, 10);
                        const totalQuestions = response.data.score_breakdown?.reduce((sum, item) => sum + item.phase_total_questions, 0) || 36;
                        setScore(Math.round((rawScore / totalQuestions) * 100));
                    }

                    setIsLoading(false); // Valid data loaded (maybe without summary)

                    // Start polling if summary is missing
                    if (!response.data.ai_summary || response.data.ai_summary.trim() === '') {
                        console.log('Summary missing, starting background polling...');
                        if (isMounted) setIsPollingSummary(true);

                        pollingInterval = setInterval(async () => {
                            attempts++;
                            if (attempts > maxAttempts || !isMounted) {
                                if (isMounted) setIsPollingSummary(false);
                                clearInterval(pollingInterval);
                                return;
                            }

                            try {
                                const newResponse = await fetchAssessmentReport(sessionId, 0);
                                if (newResponse.data.ai_summary && newResponse.data.ai_summary.trim() !== '') {
                                    console.log('Summary received via polling!');
                                    if (isMounted) {
                                        setReportData(prev => ({
                                            ...prev!,
                                            ai_summary: newResponse.data.ai_summary,
                                            strengths: newResponse.data.strengths,
                                            weaknesses: newResponse.data.weaknesses,
                                            ai_skill_breakdown: newResponse.data.ai_skill_breakdown
                                        }));
                                        setIsPollingSummary(false);
                                    }
                                    clearInterval(pollingInterval);
                                }
                            } catch (e) {
                                console.error('Polling error:', e);
                                // Don't stop polling on transient error, but could limit it
                            }
                        }, 5000); // Poll every 5 seconds
                    }
                }
            } catch (err) {
                console.error('Failed to load assessment report:', err);
                if (isMounted) {
                    setApiError('Failed to load detailed report. Showing preliminary results.');
                    setIsLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [sessionId]);

    // Fetch Bundle Products
    useEffect(() => {
        const loadBundleProducts = async () => {
            if (!bundleId) {
                console.warn('No bundle ID found for products.');
                return;
            }

            try {
                const response = await fetchBundleProducts(bundleId);

                // Enrich certifications with preview images from stored role content
                let enrichedCertifications = response.data.certifications;
                try {
                    const storedRoleContent = localStorage.getItem('roleContent');
                    if (storedRoleContent) {
                        const parsedContent = JSON.parse(storedRoleContent);
                        const roleSkills = parsedContent?.data?.role?.skills || [];

                        // Create lookup map for efficiency
                        const skillImageMap = new Map();
                        roleSkills.forEach((skill: any) => {
                            // Check both possible field names
                            const imageUrl = skill.skill_certificate_preview_image_link || skill.certificate_preview_url;
                            if (imageUrl) {
                                // Use skill_id if available (matches cert.skill_id), fallback to id
                                const key = skill.skill_id || skill.id;
                                skillImageMap.set(key, imageUrl);
                            }
                        });

                        if (skillImageMap.size > 0) {
                            enrichedCertifications = response.data.certifications.map(cert => ({
                                ...cert,
                                certificate_preview_url: skillImageMap.get(cert.skill_id) || cert.certificate_preview_url
                            }));
                        }
                    }
                } catch (e) {
                    console.warn('Failed to enrich certifications with stored images:', e);
                }

                setBundleData({
                    ...response.data,
                    certifications: enrichedCertifications
                });
            } catch (err) {
                console.error('Failed to load bundle products:', err);
                // Don't show error, just use fallback
            }
        };

        loadBundleProducts();
        loadBundleProducts();
    }, [bundleId]);

    // Initialize selected IDs when bundle data loads
    useEffect(() => {
        if (bundleData?.certifications) {
            const allIds = bundleData.certifications.map(c => c.skill_id);
            setSelectedIndividualIds(allIds);
        }
    }, [bundleData]);

    // Intersection Observer for Purchase Area
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsPurchaseAreaVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        const purchaseArea = document.getElementById('purchase-area');
        if (purchaseArea) {
            observer.observe(purchaseArea);
        }

        return () => {
            if (purchaseArea) {
                observer.unobserve(purchaseArea);
            }
        };
    }, [isLoading, bundleData]); // Re-run when data loads/renders

    // Map API breakdown to Component breakdown
    const breakdown: PhaseBreakdown[] | undefined = reportData?.score_breakdown?.map(item => ({
        phase: item.phase_name,
        score: item.phase_score,
        maxScore: 100,
        questions: item.phase_total_questions,
        correct: item.phase_correct_answers,
        skill: item.skill_name || item.phase_name
    })).map(b => ({
        ...b,
        score: Math.round((b.correct / b.questions) * 100)
    }));

    // Calculate bundle pricing
    // Calculate bundle pricing
    const bundlePrice = bundleData?.product_cost || 5999;
    const certCount = bundleData?.certifications?.length || 4;

    // Original price tiers matching IndividualSection.tsx
    let bundleOriginalPrice = certCount * 2499;
    if (certCount >= 6) bundleOriginalPrice = 11998;
    else if (certCount === 5) bundleOriginalPrice = 11998;
    else if (certCount === 4) bundleOriginalPrice = 10998;

    // Pricing Tiers (Matching IndividualSection.tsx)
    const PRICING_TIERS: Record<number, { price: number; original: number; label: string }> = {
        1: { price: 1999, original: 2499, label: '20% OFF' },
        2: { price: 3499, original: 4999, label: '30% OFF' },
        3: { price: 4999, original: 8332, label: '40% OFF' },
        4: { price: 5499, original: 10998, label: '50% OFF' },
        5: { price: 5999, original: 11998, label: '50% OFF' },
        6: { price: 5999, original: 11998, label: '50% OFF' }
    };

    const getPricing = (count: number) => {
        if (count === 0) return { price: 0, original: 0, label: '' };
        const effectiveCount = Math.min(count, 6);
        return PRICING_TIERS[effectiveCount] || { price: 0, original: 0, label: '' };
    };

    // Calculate dynamic pricing based on selection
    const getDynamicBundlePricing = () => {
        const totalCerts = bundleData?.certifications?.length || 0;
        const selectedCount = selectedIndividualIds.length;

        // If all selected, use Bundle Price
        if (selectedCount === totalCerts && totalCerts > 0) {
            return {
                price: bundlePrice,
                original: bundleOriginalPrice,
                isBundle: true
            };
        }

        // Otherwise use tiered pricing
        const tier = getPricing(selectedCount);
        return {
            price: tier.price,
            original: tier.original,
            isBundle: false
        };
    };

    const { price: currentDisplayPrice, original: currentDisplayOriginal } = getDynamicBundlePricing();

    // Open Razorpay payment modal
    const openRazorpay = (razorpayOrderId: string, internalOrderId: number, amount: number, description: string) => {
        const options: RazorpayOptions = {
            key: RAZORPAY_KEY,
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            name: 'LearnTube',
            description: description,
            order_id: razorpayOrderId,
            handler: function (response: RazorpayResponse) {
                console.log('Payment successful:', response);

                analytics.track('payment_success', {
                    payment_id: response.razorpay_payment_id,
                    order_id: response.razorpay_order_id,
                    amount: amount // Use the original amount in currency unit
                });

                // Show success overlay immediately
                setPaymentId(response.razorpay_payment_id);
                setShowPaymentSuccess(true);

                // Poll for payment status using INTERNAL order ID
                const pollInterval = setInterval(async () => {
                    try {
                        const statusResult = await checkPaymentStatus(internalOrderId);
                        if (statusResult.result === 'success' && statusResult.data.status === 'paid') {
                            clearInterval(pollInterval);
                            // Brief delay to ensure user sees the success state
                            setTimeout(() => {
                                // Pass INTERNAL order ID to success page
                                window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${internalOrderId}`;
                            }, 1000);
                        } else if (statusResult.result === 'success' && statusResult.data.status === 'failed') {
                            clearInterval(pollInterval);
                            setShowPaymentSuccess(false);
                            alert('Payment verification failed. Please contact support.');
                        }
                    } catch (error) {
                        console.warn('Payment polling error:', error);
                        // Continue polling on transient errors
                    }
                }, 3000); // Poll every 3 seconds
            },
            modal: {
                ondismiss: function () {
                    analytics.track('payment_modal_closed', {
                        order_id: razorpayOrderId
                    });
                    setIsPurchasing(false); // Assuming isPurchasing is set to true before opening modal
                }
            },
            prefill: {
                name: '',
                email: '',
                contact: ''
            },
            theme: {
                color: '#7FC241'
            }
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on('payment.failed', function (response: any) {
            console.error('Payment failed:', response.error);
            alert(`Payment failed: ${response.error.description}`);
            setIsPurchasing(false);
            analytics.track('payment_failed', {
                order_id: razorpayOrderId,
                error_code: response.error.code,
                error_description: response.error.description
            });
        });

        analytics.track('payment_initiated', {
            order_id: razorpayOrderId,
            amount: amount
        });

        razorpay.open();
    };

    // Handle unified purchase (Bundle vs Individual) for the main section
    const handleSmartPurchase = async () => {
        if (!sessionId || !bundleId) {
            alert('Session or Bundle ID not found. Please try again.');
            return;
        }

        const { isBundle, price } = getDynamicBundlePricing();

        if (isBundle) {
            // Full Bundle Purchase
            handleBundlePurchase();
        } else {
            // Partial Selection Purchase
            if (selectedIndividualIds.length === 0) {
                alert('Please select at least one certification.');
                return;
            }

            // Find the certification objects for the selected IDs
            const selectedCerts = bundleData?.certifications.filter(c => selectedIndividualIds.includes(c.skill_id)) || [];
            handleIndividualPurchase(selectedCerts, price);
        }
    };

    // Handle bundle purchase (Internal)
    const handleBundlePurchase = async () => {
        if (!sessionId || !bundleId) {
            alert('Session or Bundle ID not found. Please try again.');
            return;
        }

        setIsPurchasing(true);
        try {
            analytics.track('click_checkout_bundle', {
                price: bundlePrice,
                product_name: bundleData?.bundle_name || 'Complete Certification Bundle'
            });

            const response = await createRazorpayOrder({
                session_id: sessionId,
                bundle_id: bundleId,
                purchase_type: 'bundle',
                skill_ids: []
            });

            openRazorpay(response.data.razorpay_order_id, response.data.id, bundlePrice, 'Bundle Purchase');
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to create order. Please try again.');
            setIsPurchasing(false);
        }
    };

    // Handle individual purchase
    const handleIndividualPurchase = async (selectedCerts: CertificationItem[], totalPrice: number) => {
        if (!sessionId || !bundleId) {
            alert('Session or Bundle ID not found. Please try again.');
            return;
        }

        const skillIds = selectedCerts.map(cert => cert.skill_id);

        analytics.track('click_checkout_individual', {
            price: totalPrice,
            quantity: selectedCerts.length,
            certificate_names: selectedCerts.map(c => c.certification_name)
        });

        setIsPurchasing(true);
        try {
            const response = await createRazorpayOrder({
                session_id: sessionId,
                bundle_id: bundleId,
                purchase_type: 'individual',
                skill_ids: skillIds
            });

            openRazorpay(response.data.razorpay_order_id, response.data.id, totalPrice, `${selectedCerts.length} Certificate(s)`);
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to create order. Please try again.');
            setIsPurchasing(false);

        }
    };

    // Removed duplicate PRICING_TIERS and getPricing definition from here as it was moved up


    const toggleIndividualCert = (skillId: number) => {
        setSelectedIndividualIds(prev => {
            if (prev.includes(skillId)) {
                // Prevent removing the last item
                if (prev.length <= 1) {
                    return prev;
                }
                return prev.filter(id => id !== skillId);
            } else {
                return [...prev, skillId];
            }
        });
    };



    return (
        <>
            {/* Payment Success Overlay */}
            {showPaymentSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001C2C]/95 backdrop-blur-sm animate-fade-in">
                    <div className="text-center px-8">
                        {/* Animated Checkmark */}
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full bg-[#7FC241]/20 animate-ping" />
                            <div className="absolute inset-0 rounded-full bg-[#7FC241]/30 animate-pulse" />
                            <div className="relative w-full h-full rounded-full bg-[#7FC241] flex items-center justify-center animate-scale-in">
                                <svg className="w-16 h-16 text-white animate-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                        style={{
                                            strokeDasharray: 24,
                                            strokeDashoffset: 24,
                                            animation: 'drawCheck 0.5s ease-out 0.3s forwards'
                                        }}
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Success Text */}
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 animate-fade-in-up">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-400 text-lg mb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Your certificates are being prepared
                        </p>
                        <p className="text-gray-500 text-sm animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            Payment ID: {paymentId}
                        </p>

                        {/* Loading dots */}
                        <div className="flex justify-center gap-2 mt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                            <div className="w-2 h-2 rounded-full bg-[#7FC241] animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 rounded-full bg-[#7FC241] animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 rounded-full bg-[#7FC241] animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen text-white font-sans pt-4 pb-32 lg:pb-24 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                {/* Top Bar with Logos */}
                <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                    <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                        <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                        <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                        <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                    </div>
                </TopBar>

                {/* Main Results Content */}
                <div className="flex-1 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-8">
                    <div className="w-full max-w-6xl mx-auto">
                        <main className="flex flex-col items-center space-y-12">
                            {/* Loading State */}
                            {isLoading && (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mx-auto mb-4"></div>
                                    <p className="text-gray-300">Generating your detailed analysis...</p>
                                </div>
                            )}

                            {/* Error State */}
                            {apiError && !isLoading && (
                                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                    <p className="text-red-400 text-sm">{apiError}</p>
                                </div>
                            )}

                            {/* Results Card */}
                            {!isLoading && (
                                <ResultsCard
                                    score={score}
                                    role={derivedRole}
                                    className="animate-fade-in-up"
                                    breakdown={breakdown}
                                    aiSummary={reportData?.ai_summary}
                                    answerSheet={reportData?.answer_sheet}
                                    isGeneratingSummary={isPollingSummary}
                                    strengths={reportData?.strengths}
                                    weaknesses={reportData?.weaknesses}
                                    timeTakenInSeconds={reportData?.time_taken_in_seconds}
                                    price={bundlePrice}
                                    originalPrice={bundleOriginalPrice}
                                    userName={userName}
                                    certificationCount={bundleData?.certifications?.length || 6}
                                    hideCTA={true}
                                    showTabs={false}
                                    proficiencyBreakdown={breakdown?.map(item => ({
                                        proficiency_name: item.skill || item.phase,
                                        score: item.score
                                    }))}
                                />
                            )}


                            {/* Purchase Area Wrapper for Intersection Observation */}
                            <div id="purchase-area" className="w-full flex flex-col gap-12 items-center">
                                {/* Bundle Section - Show only if passed */}
                                {!isLoading && score >= 50 && (
                                    <BundleSection
                                        bundleName={bundleData?.bundle_name || `Executive ${derivedRole} Bundle`}
                                        role={derivedRole}

                                        originalPrice={currentDisplayOriginal}
                                        discountedPrice={currentDisplayPrice}
                                        certifiedCount={3441}
                                        onGetBundle={handleSmartPurchase}
                                        isLoading={isPurchasing}
                                        className="animate-fade-in-up animation-delay-300"
                                        certifications={bundleData?.certifications}
                                        selectedIds={selectedIndividualIds}
                                        onToggle={toggleIndividualCert}
                                    />
                                )}

                                {/* Company Logos - Moved here */}
                                {!isLoading && score >= 50 && (
                                    <CertificateValueSection
                                        role={derivedRole}
                                        showBenefits={false}
                                        showLogos={true}
                                        className="animate-fade-in-up animation-delay-400 w-full"
                                    />
                                )}




                            </div>

                            {/* Success Stories - Show before Certificate Values */}
                            {!isLoading && score >= 50 && (
                                <SuccessStoriesSection
                                    role={derivedRole}
                                    className="animate-fade-in-up animation-delay-400"
                                />
                            )}

                            {/* Certificate Benefits & Social Proof - Show only if passed - Moved to bottom */}
                            {!isLoading && score >= 50 && (
                                <CertificateValueSection
                                    role={derivedRole}
                                    showLogos={false}
                                    className="animate-fade-in-up animation-delay-500"
                                />
                            )}

                            {/* FAQ Section - Always show */}
                            <FAQSection className="animate-fade-in-up animation-delay-700" />
                        </main>
                    </div>
                </div>
            </div>


            {/* Buy Certificates Sticky Bar */}
            {!isLoading && score >= 50 && !isPurchasing && !isPurchaseAreaVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#001C2C] border-t border-white/10 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-slide-up backdrop-blur-md bg-opacity-95">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-lg">Get Certified</span>
                            <span className="text-gray-400 text-xs">
                                <span className="text-[#7FC241] font-bold">{bundleData?.certifications?.length || 4} Certificates</span> unlocked based on your performance!
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                document.getElementById('claim-certificates-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="bg-[#7FC241] hover:bg-[#68A335] text-black font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                        >
                            Buy Certificates
                        </button>
                    </div>
                </div>
            )}



        </>
    );
};

export default ResultsPage;
