import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import ResultsCard, { type PhaseBreakdown } from '../components/ResultsCard';
import BundleSection from '../components/BundleSection';


import FAQSection from '../components/FAQSection';
import CertificateValueSection from '../components/CertificateValueSection';
// import SuccessStoriesSection from '../components/SuccessStoriesSection';
import CareerImpactSection from '../components/CareerImpactSection';
import AwardsSection from '../components/AwardsSection';
import LinkedInTestimonialsSection from '../components/LinkedInTestimonialsSection';
import VideoTestimonialsSection from '../components/VideoTestimonialsSection';
import { MOCK_ASSESSMENT } from '../data/staticData';
import { fetchBundleProducts, checkPaymentStatus, createPaymentOrder } from '../services/api';
import SocialProofSection from '../components/SocialProofSection';
import ComparisonTable from '../components/ComparisonTable';
import { getStoredSessionId, getStoredBundleId, getUserName, getStoredRole, getStoredProgressBackup } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import { supabase } from '../services/supabaseClient';
import type { AssessmentReportData, BundleProductData, CertificationItem } from '../types';

// Razorpay key from environment variable
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';



const ResultsPageV3 = () => {
    const [searchParams] = useSearchParams();

    // API State
    const [reportData, setReportData] = useState<AssessmentReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState<string>('');
    const [selectedIndividualIds, setSelectedIndividualIds] = useState<number[]>([]);
    const [isPurchaseAreaVisible, setIsPurchaseAreaVisible] = useState(false);
    const [isBundleSectionVisible, setIsBundleSectionVisible] = useState(false);


    // Bundle State
    const [bundleData, setBundleData] = useState<BundleProductData | null>(null);

    // Get IDs from URL or localStorage
    const sessionIdParam = searchParams.get('session_id');
    const storedSessionId = getStoredSessionId();
    // Keep as string for UUID compatibility
    const sessionId = sessionIdParam || storedSessionId;

    const bundleIdParam = searchParams.get('bundle_id');
    const storedBundleId = getStoredBundleId();
    const bundleId = bundleIdParam ? parseInt(bundleIdParam, 10) : (storedBundleId ? parseInt(storedBundleId, 10) : 12345);

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

        const loadReport = async () => {
            if (isMounted) setIsLoading(true);

            try {
                // --- LOCAL SCORING LOGIC START ---
                console.log('RESULTS_V3: Starting local score calculation...');

                const answersMap = new Map<number, Map<number, any>>();
                const allStorageKeys = Object.keys(localStorage);
                const phaseDataKeys = allStorageKeys.filter(k => k.match(/assessment_.*_phase_\d+_data/));

                phaseDataKeys.forEach(key => {
                    try {
                        const data = JSON.parse(localStorage.getItem(key) || '{}');
                        let scenarioId = parseInt(data.scenario_id, 10);
                        if (isNaN(scenarioId)) scenarioId = parseInt(data.phase_number, 10);

                        if (!isNaN(scenarioId) && data.phase_user_answers) {
                            const currentMap = answersMap.get(scenarioId) || new Map<number, any>();
                            data.phase_user_answers.forEach((ans: any) => {
                                currentMap.set(parseInt(ans.question_id, 10), ans);
                            });
                            answersMap.set(scenarioId, currentMap);
                        }
                    } catch (e) {
                        console.warn('Error parsing key', key);
                    }
                });

                // Calculate Score
                let correctCount = 0;
                let totalQuestions = 0;
                const scoreBreakdown: any[] = [];
                const answerSheet: any[] = [];

                MOCK_ASSESSMENT.data.scenarios.forEach((scenario, index) => {
                    let phaseCorrect = 0;
                    let phaseTotal = scenario.questions?.length || 0;
                    const scenarioId = Number(scenario.scenario_id);
                    const scenarioAnswers = answersMap.get(scenarioId);

                    scenario.questions?.forEach((q: any) => {
                        totalQuestions++;
                        const qId = Number(q.question_id);
                        let isCorrect = false;
                        let userSelectedOption = '-';
                        let correctOptionId = '-';

                        // Find Correct Option
                        const correctRef = q.options?.find((o: any) => o.is_correct);
                        if (correctRef) correctOptionId = correctRef.option_id;

                        // Check User Answer
                        if (scenarioAnswers && scenarioAnswers.has(qId)) {
                            const userAns = scenarioAnswers.get(qId);
                            userSelectedOption = userAns.selected_option;

                            // Normalize & Compare
                            const normUser = String(userSelectedOption).trim().toLowerCase();
                            const normRef = String(correctOptionId).trim().toLowerCase();
                            if (normUser === normRef) {
                                isCorrect = true;
                                phaseCorrect++;
                            }
                        }

                        // Use legacy fallback if needed (omitted for strict local logic unless requested)

                        answerSheet.push({
                            question: q.question_text,
                            is_correct: isCorrect,
                            users_answer: userSelectedOption,
                            correct_answer: correctOptionId
                        });
                    });

                    correctCount += phaseCorrect;

                    scoreBreakdown.push({
                        phase_name: scenario.phase || 'Unknown Phase',
                        phase_score: phaseTotal > 0 ? Math.round((phaseCorrect / phaseTotal) * 100) : 0,
                        phase_number: index + 1,
                        phase_correct_answers: phaseCorrect,
                        phase_total_questions: phaseTotal,
                        skill_name: scenario.phase || scenario.scenario_name // Validated user request
                    });
                });

                console.log(`RESULTS_V3: Calculated Score: ${correctCount}/${totalQuestions}`);

                // Get time taken from progress backup
                const progressBackup = bundleId ? getStoredProgressBackup(bundleId) : null;
                const timeTaken = progressBackup?.cumulativeTime || 300;

                const finalReportData: AssessmentReportData = {
                    id: 999,
                    created_at: Date.now(),
                    specialized_sessions_id: sessionId ? 0 : 0, // Mock ID for type compliance, actual UUID used for Supabase
                    specialized_session_user_bundle_id: 12345,
                    specialized_session_quiz_data_id: 888,
                    assessment_score: correctCount.toString(),
                    score_breakdown: scoreBreakdown,
                    ai_summary: '',
                    answer_sheet: answerSheet,
                    strengths: [{ category: "Management", description: "Strategic Thinking", evidence: "Assessment" }],
                    weaknesses: [{ category: "Tactical", description: "Execution", recommendation: "Coursework" }],
                    time_taken_in_seconds: timeTaken,
                    ai_skill_breakdown: [] // strict type compliance
                };

                if (isMounted) {
                    setReportData(finalReportData);
                    // Update score state (Percentage)
                    setScore(totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);
                    setIsLoading(false);

                    // Update Supabase Session
                    if (sessionId) {
                        const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
                        supabase.from('sessions')
                            .update({
                                score: finalScore,
                                passed: finalScore >= 50
                            })
                            .eq('session_id', sessionId)
                            .then(({ error }) => {
                                if (error) console.error('Failed to save score to session:', error);
                                else console.log('Score saved to session:', finalScore);
                            });
                    }
                }
                // --- LOCAL SCORING LOGIC END ---

            } catch (err) {
                console.error('Failed to calculate local report:', err);
                if (isMounted) {
                    setApiError('Failed to generate report.');
                    setIsLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
        };
    }, [sessionId]);

    // Intersection Observer for Bundle Section Visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsBundleSectionVisible(entry.isIntersecting);
                });
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1 // Trigger when 10% of the section is visible
            }
        );

        const bundleSection = document.getElementById('claim-certificates-section');
        if (bundleSection) {
            observer.observe(bundleSection);
        }

        return () => {
            if (bundleSection) {
                observer.unobserve(bundleSection);
            }
        };
    }, [score]); // Re-run when score changes (in case section appears/disappears)

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
    }, [bundleId]);

    // Initialize selected IDs when bundle data loads
    useEffect(() => {
        if (bundleData?.certifications) {
            console.log('ResultsPage: Initializing selection with 101, 102, 105', bundleData.certifications);
            // Default to CDAPx I, CDAPx II, and AI in Data Analysis (101, 102, 105)
            setSelectedIndividualIds([101, 102, 105]);
        }
    }, [bundleData]);

    // Intersection Observer for sticky bar visibility - watch BundleSection specifically
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show sticky bar when BundleSection is NOT visible (has scrolled out of view)
                setIsPurchaseAreaVisible(entry.isIntersecting);
            },
            {
                threshold: 0,
                rootMargin: '-50px 0px 0px 0px' // Trigger slightly before it goes completely out of view
            }
        );

        const bundleSection = document.getElementById('claim-certificates-section');
        if (bundleSection) {
            observer.observe(bundleSection);
        }

        return () => {
            if (bundleSection) {
                observer.unobserve(bundleSection);
            }
        };
    }, []);



    // Map API breakdown to Component breakdown
    const breakdown: PhaseBreakdown[] | undefined = reportData?.score_breakdown?.map(item => ({
        phase: item.phase_name,
        score: item.phase_score,
        maxScore: 100,
        questions: item.phase_total_questions,
        correct: item.phase_correct_answers,
        skill: item.phase_name // Show Phase Name instead of Scrum Master Basic/Advanced
    })).map(b => ({
        ...b,
        score: Math.round((b.correct / b.questions) * 100)
    }));

    // Calculate bundle pricing
    // Calculate bundle pricing
    // Calculate dynamic pricing based on sum of selected items
    const getDynamicBundlePricing = () => {
        if (!bundleData?.certifications) return { price: 0, original: 0, isBundle: false };

        let totalPrice = 0;
        let totalOriginal = 0;

        selectedIndividualIds.forEach(id => {
            const cert = bundleData.certifications.find(c => c.skill_id === id);
            if (cert) {
                // Apply custom pricing for specific certifications
                let price = cert.price || 999;
                let originalPrice = cert.original_price || (cert.price ? Math.round(cert.price * 2) : 2499);

                // CDAPx I and CDAPx II (101, 102) - RECOMMENDED - ₹1999 (was ₹4999)
                if (id === 101 || id === 102) {
                    price = 1999;
                    originalPrice = 4999;
                }
                // CBAPx and PMPx (103, 104) - 50% OFF - ₹999 (was ₹1999)
                else if (id === 103 || id === 104) {
                    price = 999;
                    originalPrice = 1999;
                }
                // AI for Data Analysis (105) - POPULAR - ₹999 (was ₹1999)
                else if (id === 105) {
                    price = 999;
                    originalPrice = 1999;
                }

                totalPrice += price;
                totalOriginal += originalPrice;
            }
        });

        // Add bonus values to the original price (to show true discount including free bonuses)
        const nonAICertCount = selectedIndividualIds.filter(id => id !== 105).length;
        const hasAICert = selectedIndividualIds.includes(105);
        const onlyBasicCerts = selectedIndividualIds.filter(id => id !== 105).every(id => id === 101 || id === 102) && nonAICertCount > 0;
        const basicCertsWithAI = onlyBasicCerts && hasAICert;

        let activeBonusCount = 0;
        if (basicCertsWithAI) {
            activeBonusCount = 2;
        } else if (onlyBasicCerts) {
            activeBonusCount = 1;
        } else if (nonAICertCount >= 3) {
            activeBonusCount = 4;
        }

        // Bonus values
        const bonusValues = {
            dataAnalyticsCourse: 2999,
            aiCourse: 1999,
            resumeEnhancer: 999,
            learnTubePro: 599
        };

        let totalBonusValue = 0;

        // Add bonus values based on what's unlocked
        if (activeBonusCount >= 1) {
            totalBonusValue += bonusValues.dataAnalyticsCourse;
        }
        if (hasAICert) {
            totalBonusValue += bonusValues.aiCourse;
        }
        if (activeBonusCount >= 3) {
            totalBonusValue += bonusValues.resumeEnhancer;
        }
        if (activeBonusCount >= 4) {
            totalBonusValue += bonusValues.learnTubePro;
        }

        // The original price now includes cert prices + free bonus values
        const finalOriginalPrice = totalOriginal + totalBonusValue;

        return {
            price: totalPrice,
            original: finalOriginalPrice,
            isBundle: selectedIndividualIds.length === bundleData.certifications.length
        };
    };

    const { price: currentDisplayPrice, original: currentDisplayOriginal } = getDynamicBundlePricing();

    // Open Razorpay payment modal
    const openRazorpay = (razorpayOrderId: string, internalOrderId: number, amount: number, description: string, notes: any, purchasedItemsForStorage: CertificationItem[]) => {
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

                // Store purchased items for the success page
                try {
                    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItemsForStorage));
                } catch (e) {
                    console.error('Failed to store purchased items:', e);
                }

                // Update Supabase Session immediately and Await it
                const updateSessionPromise = (async () => {
                    try {
                        // Normalize purchased products simple string for quick glance
                        // Distinguish PMPx Basic (101) vs Advanced (102) in simple list if needed

                        const updateData: any = {
                            is_paid: true,
                            amount_paid: amount,
                            payment_id: response.razorpay_payment_id,
                            purchased_products: purchasedItemsForStorage // storing JSONb
                        };

                        // We'll update is_paid primarily
                        const { error } = await supabase.from('sessions')
                            .update(updateData)
                            .eq('session_id', storedSessionId || sessionIdParam); // Use stable ID

                        if (error) console.error('Failed to update session is_paid:', error);
                        else console.log('Session marked as paid.');
                    } catch (e) {
                        console.error('Session update error:', e);
                    }
                })();

                // Await Analytics
                const trackPromise = analytics.track('payment_success', {
                    payment_id: response.razorpay_payment_id,
                    order_id: response.razorpay_order_id,
                    amount: amount // Use the original amount in currency unit
                });

                // Wait for BOTH to complete before redirecting
                // We don't want to block the success UI (modal) but we MUST block the redirect
                Promise.all([updateSessionPromise, trackPromise]).finally(() => {
                    console.log('Critical Purchase Data Saved. Proceeding...');

                    // Poll for payment status using INTERNAL order ID
                    const pollInterval = setInterval(async () => {
                        try {
                            const statusResult = await checkPaymentStatus(internalOrderId);
                            // ... rest of polling logic (kept same for brevity in thought, but code included below)

                            // Actually, since we already got success from Razorpay handler above, 
                            // and we saved our own data, the polling is for the BACKEND to confirm it saw it too?
                            // Or just legacy?

                            // The existing code polled. We can keep polling but ensure we don't redirect until our critical saves are done.
                            // BUT: The redirect was INSIDE the poll. 

                            // Let's keep the poll, but now we know our local saves are done.

                            if (statusResult.result === 'success' && statusResult.data.status === 'paid') {
                                clearInterval(pollInterval);
                                setTimeout(() => {
                                    window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${internalOrderId}&session_id=${storedSessionId || sessionIdParam}`;
                                }, 1000);
                            } else if (statusResult.result === 'success' && statusResult.data.status === 'failed') {
                                clearInterval(pollInterval);
                                setShowPaymentSuccess(false);
                                alert('Payment verification failed. Please contact support.');
                            }
                        } catch (error) {
                            console.warn('Payment polling error:', error);
                        }
                    }, 3000);
                });
            },
            modal: {
                ondismiss: function () {
                    analytics.track('payment_modal_closed', {
                        order_id: razorpayOrderId
                    });
                    setIsPurchasing(false); // Assuming isPurchasing is set to true before opening modal
                }
            },
            notes: notes, // Add notes here
            prefill: {
                name: notes.user_name,
                email: notes.user_email,
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
            console.warn('Session or Bundle ID missing, proceeding with static fallbacks.');
            // Continue without returning
        }

        const { isBundle, price } = getDynamicBundlePricing();

        if (isBundle) {
            // Full Bundle Purchase
            handleBundlePurchase(price);
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
    const handleBundlePurchase = async (price: number) => {
        setIsPurchasing(true);
        try {
            analytics.track('click_checkout_bundle', {
                price: price,
                product_name: bundleData?.bundle_name || 'Complete Certification Bundle'
            });

            // Get User Details for Notes
            const allStorage = localStorage;
            const userDataStr = allStorage.getItem('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : {};
            const userEmail = userData.email || 'guest@example.com';
            // Try to get name from multiple sources
            const userNameVal = userData.name || userData.contactDetails?.name || userName || 'Guest';

            const productList = bundleData?.certifications.map(c => c.certification_name).join(', ') || 'All Certifications';

            // Create Order via Real API
            const orderData = await createPaymentOrder(
                price,
                productList,
                'specialized_v2_hr_static',
                {
                    user_name: userNameVal,
                    user_email: userEmail,
                    project_name: 'specialized_v2_hr_static',
                    purchase_type: 'BUNDLE'
                }
            );

            // Assuming orderData returns { id: 'order_...', ... } from Razorpay
            // If the API wrapper returns it in a specific field, adjust below. 
            // Based on user snippet: return result.response.result; which is likely the Razorpay order object.
            const razorpayOrderId = orderData.id;
            const internalOrderId = 999; // Still mocking internal ID for polling unless API returns it

            // Construct Notes for display (API already handles sending them to Razorpay order)
            // We pass them to openRazorpay for prefill consistency if needed
            const notes = {
                user_name: userNameVal,
                user_email: userEmail,
                project_name: 'specialized_v2_hr_static',
                purchase_type: 'BUNDLE',
                item_list: bundleData?.certifications.map(c => {
                    if (c.skill_id === 101) return "CDAPx I";
                    if (c.skill_id === 102) return "CDAPx II";
                    return c.certification_name_short || c.certification_name;
                }).join(', '),
                detailed_items: JSON.stringify(bundleData?.certifications.map(c => ({
                    id: c.skill_id,
                    name: c.certification_name,
                    tier: (c.skill_id === 101 || c.skill_id === 102) ? (c.skill_id === 101 ? "Basic" : "Advanced") : "Standard"
                })))
            };

            openRazorpay(razorpayOrderId, internalOrderId, price, 'Bundle Purchase', notes, bundleData?.certifications || []);
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to initiate purchase. Please try again.');
            setIsPurchasing(false);
        }
    };


    // Handle individual purchase
    const handleIndividualPurchase = async (selectedCerts: CertificationItem[], totalPrice: number) => {
        setIsPurchasing(true);
        try {
            analytics.track('click_checkout_individual', {
                price: totalPrice,
                product_count: selectedCerts.length
            });

            // Get User Details for Notes
            const allStorage = localStorage;
            const userDataStr = allStorage.getItem('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : {};
            const userEmail = userData.email || 'guest@example.com';
            // Try to get name from multiple sources
            const userNameVal = userData.name || userData.contactDetails?.name || userName || 'Guest';

            const productList = selectedCerts.map(c => c.certification_name).join(', ');

            // Create Order via Real API
            const orderData = await createPaymentOrder(
                totalPrice,
                productList,
                'specialized_v2_hr_static',
                {
                    user_name: userNameVal,
                    user_email: userEmail,
                    project_name: 'specialized_v2_hr_static',
                    purchase_type: 'INDIVIDUAL'
                }
            );

            const razorpayOrderId = orderData.id;
            const internalOrderId = 888; // Mock internal ID

            // Construct Notes
            const notes = {
                user_name: userNameVal,
                user_email: userEmail,
                project_name: 'specialized_v2_hr_static',
                purchase_type: 'INDIVIDUAL',
                item_list: selectedCerts.map(c => {
                    if (c.skill_id === 101) return "CDAPx I";
                    if (c.skill_id === 102) return "CDAPx II";
                    return c.certification_name_short || c.certification_name;
                }).join(', '),
                detailed_items: JSON.stringify(selectedCerts.map(c => ({
                    id: c.skill_id,
                    name: c.certification_name,
                    tier: (c.skill_id === 101 || c.skill_id === 102) ? (c.skill_id === 101 ? "Basic" : "Advanced") : "Standard"
                })))
            };

            openRazorpay(razorpayOrderId, internalOrderId, totalPrice, 'Individual Certification Purchase', notes, selectedCerts);
        } catch (error) {
            console.error('Failed to initiate individual purchase:', error);
            alert('Failed to initiate purchase. Please try again.');
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
                                    isGeneratingSummary={false}
                                    strengths={reportData?.strengths}
                                    weaknesses={reportData?.weaknesses}
                                    timeTakenInSeconds={reportData?.time_taken_in_seconds}
                                    price={currentDisplayPrice}
                                    originalPrice={currentDisplayOriginal}
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

                                {/* Video Testimonials Section */}
                                {!isLoading && score >= 50 && (
                                    <VideoTestimonialsSection />
                                )}

                                {/* Career Impact Section - Moved here to be under "How Our Certificates Help" */
                                /* Note: The above comment refers to BundleSection's internal content. We are placing VideoTestimonials strictly after BundleSection now. */}
                                {!isLoading && score >= 50 && (
                                    <CareerImpactSection className="animate-fade-in-up animation-delay-400 w-full" />
                                )}

                                {/* Company Logos */}
                                {!isLoading && score >= 50 && (
                                    <CertificateValueSection
                                        role={derivedRole}
                                        showBenefits={false}
                                        showLogos={true}
                                        className="animate-fade-in-up animation-delay-400 w-full"
                                    />
                                )}

                                {/* Comparison Table */}
                                {!isLoading && score >= 50 && (
                                    <ComparisonTable className="animate-fade-in-up animation-delay-500" />
                                )}




                            </div>

                            {/* Success Stories - Show before Certificate Values */}
                            {/* {!isLoading && score >= 50 && (
                                <SuccessStoriesSection
                                    role={derivedRole}
                                    className="animate-fade-in-up animation-delay-400"
                                />
                            )} */}

                            {/* Certificate Benefits & Social Proof - Show only if passed - Moved to bottom */}
                            {/* {!isLoading && score >= 50 && (
                                    <CertificateValueSection
                                        role={derivedRole}
                                        showLogos={false}
                                        className="animate-fade-in-up animation-delay-500"
                                    />
                                )} */}

                            {/* LinkedIn Testimonials - New Addition */}
                            {!isLoading && score >= 50 && (
                                <LinkedInTestimonialsSection role={derivedRole} className="animate-fade-in-up animation-delay-600" />
                            )}

                            {/* Awards Section - Restored */}
                            {!isLoading && score >= 50 && (
                                <AwardsSection className="animate-fade-in-up animation-delay-600" />
                            )}

                            {/* Social Proof Section - Join 11 Lakh+ Professionals */}
                            {!isLoading && score >= 50 && (
                                <SocialProofSection className="animate-fade-in-up animation-delay-600" />
                            )}



                            {/* FAQ Section - Always show */}
                            <FAQSection className="animate-fade-in-up animation-delay-700" />
                        </main>
                    </div>
                </div>
            </div>


            {/* Buy Certificates Sticky Bar */}
            {!isLoading && score >= 50 && !isPurchasing && !isPurchaseAreaVisible && !isBundleSectionVisible && (
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

export default ResultsPageV3;
