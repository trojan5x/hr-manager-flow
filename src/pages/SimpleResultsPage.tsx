import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import SimplifiedResultsCard from '../components/SimplifiedResultsCard';
import BundleSection from '../components/BundleSection';
import FAQSection from '../components/FAQSection';
import CertificateValueSection from '../components/CertificateValueSection';
import SuccessStoriesSection from '../components/SuccessStoriesSection';
import SingleCertificationCard from '../components/SingleCertificationCard';
import { fetchAssessmentReport, fetchBundleProducts, createRazorpayOrder, checkPaymentStatus, type BundleProductData, type CertificationItem } from '../services/api';
import { getStoredSessionId, getStoredBundleId } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import type { AssessmentReportData } from '../types';
import type { PhaseBreakdown } from '../components/ResultsCard'; // Reuse type

// Razorpay key from environment variable
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';



const SimpleResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [isBundleVisible, setIsBundleVisible] = useState(false);

    // API State
    const [reportData, setReportData] = useState<AssessmentReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPollingSummary, setIsPollingSummary] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [selectedIndividualIds, setSelectedIndividualIds] = useState<string[]>([]);

    // Bundle State
    const [bundleData, setBundleData] = useState<BundleProductData | null>(null);

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

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsBundleVisible(entry.isIntersecting);
            },
            { threshold: 0.1 } // Trigger when 10% visible
        );

        // Wait a bit for DOM to be ready or check if loading is false
        if (!isLoading) {
            const el = document.getElementById('bundle-section');
            if (el) observer.observe(el);
            return () => {
                if (el) observer.unobserve(el);
            };
        }
    }, [isLoading]);

    // Track results page view
    useEffect(() => {
        // Register session if available
        const currentSessionId = getStoredSessionId();
        if (currentSessionId) {
            analytics.register({ session_id: currentSessionId });
            analytics.setSessionId(currentSessionId);
            
            if (import.meta.env.DEV) {
                console.log('[SimpleResultsPage] 📝 Registered session with analytics:', currentSessionId.slice(0, 8) + '...');
            }
        }
        
        if (!isLoading && score !== null) {
            analytics.track('view_results_simplified', {
                score,
                result_status: score >= 50 ? 'Pass' : 'Fail'
            });
        }
    }, [isLoading, score]);

    // Determine Role Name
    const roleParam = searchParams.get('role');
    const derivedRole = roleParam || 'Professional';

    // Fetch Assessment Report
    useEffect(() => {
        let isMounted = true;
        let pollingInterval: ReturnType<typeof setInterval>;
        let attempts = 0;
        const maxAttempts = 12; // Poll for ~1 minute

        const loadReport = async () => {
            if (!sessionId) {
                console.warn('No session ID found for report.');
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                if (isMounted) setIsLoading(true);
                const response = await fetchAssessmentReport(sessionId, 0);

                if (isMounted) {
                    setReportData(response.data);

                    if (response.data.assessment_score) {
                        const rawScore = parseInt(response.data.assessment_score, 10);
                        const totalQuestions = response.data.score_breakdown?.reduce((sum, item) => sum + item.phase_total_questions, 0) || 36;
                        setScore(Math.round((rawScore / totalQuestions) * 100));
                    }

                    setIsLoading(false);

                    if (!response.data.ai_summary || response.data.ai_summary.trim() === '') {
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
                                    if (isMounted) {
                                        setReportData(prev => ({ ...prev!, ...newResponse.data }));
                                        setIsPollingSummary(false);
                                    }
                                    clearInterval(pollingInterval);
                                }
                            } catch (e) {
                                console.error('Polling error:', e);
                            }
                        }, 5000);
                    }
                }
            } catch (err) {
                console.error('Failed to load assessment report:', err);
                if (isMounted) {
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
            if (!bundleId) return;
            try {
                const response = await fetchBundleProducts(bundleId);
                let productData = response.data;

                // Try to patch images from localStorage 'roleContent'
                try {
                    const storedRoleContent = localStorage.getItem('roleContent');
                    if (storedRoleContent) {
                        const parsedContent = JSON.parse(storedRoleContent);
                        const roleSkills = parsedContent?.data?.role?.skills || [];

                        // We'll map mostly by skill name or similar identifier since IDs might differ or be absent in product data in the same format

                        if (productData && productData.certifications) {
                            productData.certifications = productData.certifications.map(cert => {
                                // Find matching skill in local storage
                                // Try ID match first (most reliable), then fallback to name matching
                                const matchedSkill = roleSkills.find((s: any) =>
                                    (s.skill_id && cert.skill_id && String(s.skill_id) === String(cert.skill_id)) ||
                                    (s.skill_name && cert.certification_name && cert.certification_name.toLowerCase().includes(s.skill_name.toLowerCase())) ||
                                    (s.certification_name && cert.certification_name && s.certification_name.toLowerCase() === cert.certification_name.toLowerCase()) ||
                                    (s.certification_name_short && cert.certification_name_short && s.certification_name_short.toLowerCase() === cert.certification_name_short.toLowerCase())
                                );

                                if (matchedSkill) {
                                    // Prioritize the preview URL, but keep existing if already present and new one is empty
                                    const previewUrl = matchedSkill.certificate_preview_url || matchedSkill.skill_certificate_preview_image_link;
                                    const frameworks = matchedSkill.frameworks;

                                    if (previewUrl || frameworks) {
                                        return {
                                            ...cert,
                                            certificate_preview_url: previewUrl || cert.certificate_preview_url,
                                            frameworks: frameworks || cert.frameworks
                                        };
                                    }
                                }
                                return cert;
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Failed to load images from local role content', e);
                }

                setBundleData(productData);
            } catch (err) {
                console.error('Failed to load bundle products:', err);
            }
        };
        loadBundleProducts();
    }, [bundleId]);

    const breakdown: PhaseBreakdown[] | undefined = reportData?.score_breakdown?.map(item => ({
        phase: item.phase_name,
        score: Math.round((item.phase_correct_answers / item.phase_total_questions) * 100),
        maxScore: 100,
        questions: item.phase_total_questions,
        correct: item.phase_correct_answers,
        skill: item.skill_name || item.phase_name
    }));

    // Calculate bundle pricing
    const bundlePrice = bundleData?.product_cost || 5999;
    const certCount = bundleData?.certifications?.length || 4;
    let bundleOriginalPrice = certCount * 2499;
    if (certCount >= 6) bundleOriginalPrice = 11998; // Cap for bundle display

    // Payment Logic
    const openRazorpay = (razorpayOrderId: string, internalOrderId: number, amount: number, description: string) => {
        const options = {
            key: RAZORPAY_KEY,
            amount: amount * 100,
            currency: 'INR',
            name: 'LearnTube',
            description: description,
            order_id: razorpayOrderId,
            handler: function (response: any) {
                analytics.track('payment_success', { payment_id: response.razorpay_payment_id, order_id: response.razorpay_order_id, amount });
                setShowPaymentSuccess(true);


                // Polling for success status
                const pollInterval = setInterval(async () => {
                    try {
                        const statusResult = await checkPaymentStatus(internalOrderId);
                        if (statusResult.result === 'success' && statusResult.data.status === 'paid') {
                            clearInterval(pollInterval);
                            setTimeout(() => {
                                window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${internalOrderId}`;
                            }, 1000);
                        }
                    } catch (e) { }
                }, 3000);
            },
            modal: { ondismiss: () => setIsPurchasing(false) },
            theme: { color: '#7FC241' }
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const handleBundlePurchase = async () => {
        if (!sessionId || !bundleId) return;
        setIsPurchasing(true);
        try {
            analytics.track('click_checkout_bundle_simple', { price: bundlePrice });
            const response = await createRazorpayOrder({
                session_id: sessionId,
                bundle_id: bundleId,
                purchase_type: 'bundle',
                skill_ids: []
            });
            openRazorpay(response.data.razorpay_order_id, response.data.id, bundlePrice, 'Complete Certification Bundle - Earned Pricing');
        } catch (error) {
            alert('Failed to create order.');
            setIsPurchasing(false);
        }
    };

    const handleCustomCheckout = async (selectedCerts: CertificationItem[], total: number) => {
        if (!sessionId || !bundleId) return;
        setIsPurchasing(true);
        try {
            analytics.track('click_checkout_custom_simple', { price: total, count: selectedCerts.length });
            // Check if it's full bundle or individual
            // If full bundle (count match), treat as bundle purchase? Let's just do individual unless logic matches
            // API expects skill_ids for individual
            const skillIds = selectedCerts.map(c => c.skill_id);

            const response = await createRazorpayOrder({
                session_id: sessionId,
                bundle_id: bundleId,
                purchase_type: 'individual',
                skill_ids: skillIds
            });
            openRazorpay(response.data.razorpay_order_id, response.data.id, total, `Custom Bundle (${selectedCerts.length} items)`);
        } catch (error) {
            alert('Failed to create order.');
            setIsPurchasing(false);
        }
    };

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
        // Fallback for > 6 to bundle price or just keep max tier 
        return PRICING_TIERS[effectiveCount] || PRICING_TIERS[6];
    };

    const toggleIndividualCert = (skillId: string) => {
        setSelectedIndividualIds(prev => {
            if (prev.includes(skillId)) {
                return prev.filter(id => id !== skillId);
            } else {
                return [...prev, skillId];
            }
        });
    };

    const handleIndividualCheckout = () => {
        if (!bundleData) return;

        const selectedItems = bundleData.certifications.filter(c => selectedIndividualIds.includes(String(c.skill_id)));
        const count = selectedItems.length;
        const { price } = getPricing(count);

        // Ensure we handle cases where count > 6 properly if needed, but for now max tier is fine.
        // If count is effectively the whole bundle (4+), we might want to treat it as bundle purchase logic-wise?
        // But requested is 'individual' purchase type with list of IDs.

        handleCustomCheckout(selectedItems, price);
    };

    return (
        <>
            {/* Payment Success Overlay */}
            {showPaymentSuccess && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#001C2C]/95 backdrop-blur-sm animate-fade-in">
                    <div className="text-center text-white">
                        <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                        <p>Redirecting you now...</p>
                    </div>
                </div>
            )}



            <div className="min-h-screen text-white font-sans pt-4 pb-32 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <TopBar className={`pt-2 lg:pt-4 xl:pt-6 transition-all duration-300 ${!isLoading && score >= 50 && !isPurchasing ? 'mt-14 sm:mt-16' : ''}`}>
                    <div className="flex justify-center items-center gap-4 animate-fade-in-up w-full">
                        <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-8 md:h-12 object-contain" />
                        <div className="h-8 w-px bg-gray-600/50"></div>
                        <img src="/assets/backed-by-google.svg" alt="Google" className="h-6 md:h-10 object-contain" />
                    </div>
                </TopBar>

                <div className="flex-1 px-4">
                    {/* Sticky Claim Bar */}
                    {!isLoading && score >= 50 && !isPurchasing && (
                        <div
                            className={`fixed top-0 left-0 right-0 z-40 bg-[#001C2C]/95 backdrop-blur-md border-b border-white/10 shadow-lg transform transition-transform duration-300 ${isBundleVisible ? '-translate-y-full' : 'translate-y-0'}`}
                        >
                            <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#7FC241]/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm leading-tight">You are Certified!</p>
                                        <p className="text-gray-400 text-xs">Don't forget to claim your bundle.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => document.getElementById('bundle-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-[#7FC241] h-9 px-4 rounded-lg text-black text-xs font-bold uppercase tracking-wider hover:bg-[#68A335] transition-colors"
                                >
                                    Claim Now
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-5xl mx-auto flex flex-col items-center space-y-12 pt-4">

                        {/* 1. Results Card (Overview only default) */}
                        {!isLoading && (
                            <SimplifiedResultsCard
                                score={score}
                                role={derivedRole}
                                breakdown={breakdown}
                                aiSummary={reportData?.ai_summary}
                                strengths={reportData?.strengths}
                                weaknesses={reportData?.weaknesses}
                                timeTakenInSeconds={reportData?.time_taken_in_seconds}
                                answerSheet={reportData?.answer_sheet}
                                isGeneratingSummary={isPollingSummary}
                            />
                        )}

                        {/* 2. Company Logos (Trusted By) */}
                        {!isLoading && score >= 50 && (
                            <CertificateValueSection
                                role={derivedRole}
                                compact={true}
                                showBenefits={false}
                                showLogos={true}
                                className="!py-0" // Reduce padding for tighter fit
                            />
                        )}

                        {/* 3. Bundle Section (Payment) */}
                        {!isLoading && score >= 50 && (
                            <div id="bundle-section" className="w-full">
                                {(() => {
                                    const certCount = bundleData?.certifications?.length || 4;
                                    const packName = `Pack of ${certCount} (${certCount > 1 ? 'Full Bundle' : 'Single Certification'})`;

                                    // Render logic for Single Certifications Section if more than 1 available
                                    const showIndividualSelection = bundleData?.certifications && bundleData.certifications.length > 1;

                                    return (
                                        <div className="space-y-12">
                                            <BundleSection
                                                bundleName={packName}
                                                subtitle={`Includes ${certCount} official certifications matching your test selection.`}
                                                skills={[
                                                    `Industry-Recognized ${derivedRole} Certifications`,
                                                    "Verifiable Digital Credentials for LinkedIn",
                                                    "Customizable Learning Path",
                                                    `Exclusive ${derivedRole} Career Advancement Toolkit`
                                                ]}
                                                originalPrice={bundleOriginalPrice}
                                                discountedPrice={bundlePrice}
                                                onGetBundle={handleBundlePurchase}
                                                isLoading={isPurchasing}
                                                certifications={bundleData?.certifications}
                                            />

                                            {showIndividualSelection && (
                                                <div className="w-full animate-fade-in-up delay-200">
                                                    <div className="text-center mb-6">
                                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Individual Certifications</h3>
                                                        <p className="text-gray-400 text-sm">Select only the certifications you need.</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {bundleData?.certifications.map((cert) => (
                                                            <SingleCertificationCard
                                                                key={cert.skill_id}
                                                                certification={cert}
                                                                isSelected={selectedIndividualIds.includes(String(cert.skill_id))}
                                                                onToggle={() => toggleIndividualCert(String(cert.skill_id))}
                                                                price={1999}
                                                            />
                                                        ))}
                                                    </div>

                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 4. Value Props (Specific Benefits) */}
                        {!isLoading && score >= 50 && (
                            <CertificateValueSection
                                role={derivedRole}
                                compact={true}
                                showBenefits={true}
                                showLogos={false}
                            />
                        )}

                        {/* 5. Success Stories (Social Proof) */}
                        {!isLoading && score >= 50 && (
                            <SuccessStoriesSection role={derivedRole} />
                        )}

                        {/* 5. FAQ */}
                        <FAQSection />
                    </div>
                </div>
            </div>
            {/* Sticky Bottom Bar for Selection Fallout - Moved to Root */}
            {
                selectedIndividualIds.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#001C2C] border-t border-white/10 p-3 sm:p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-slide-up backdrop-blur-md bg-opacity-95">
                        <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-[#7FC241]/20 p-2 rounded-lg hidden sm:block">
                                    <svg className="w-6 h-6 text-[#7FC241]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-gray-400 text-xs uppercase tracking-wide hidden sm:block">Your Selection</div>
                                    <div className="text-white font-bold text-sm sm:text-lg leading-none">
                                        {selectedIndividualIds.length} <span className="sm:hidden">Certs</span><span className="hidden sm:inline">Certification{selectedIndividualIds.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="text-right">
                                    {(() => {
                                        const count = selectedIndividualIds.length;
                                        const { price: currentPrice, original: originalPrice, label } = getPricing(count);
                                        return (
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    {originalPrice > currentPrice && (
                                                        <span className="text-gray-500 line-through text-[10px] sm:text-xs">₹{originalPrice.toLocaleString()}</span>
                                                    )}
                                                    {label && (
                                                        <span className="bg-[#7FC241]/20 text-[#7FC241] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{label}</span>
                                                    )}
                                                </div>
                                                <span className="text-white font-bold text-base sm:text-xl">₹{currentPrice.toLocaleString()}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <button
                                    onClick={handleIndividualCheckout}
                                    disabled={isPurchasing}
                                    className={`bg-[#7FC241] hover:bg-[#68A335] text-black font-bold text-sm sm:text-lg px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group ${isPurchasing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isPurchasing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="hidden sm:inline">Processing...</span>
                                            <span className="sm:hidden">...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Checkout</span>
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default SimpleResultsPage;
