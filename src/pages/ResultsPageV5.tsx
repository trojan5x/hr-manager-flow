import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCheckCircle, faDownload, faEye, faChartLine, faCertificate, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { getStoredSessionId, getStoredBundleId, getStoredRole, getStoredProgressBackup } from '../utils/localStorage';
import { analytics } from '../services/analytics';
import { supabase } from '../services/supabaseClient';
import { MOCK_ASSESSMENT } from '../data/staticData';
import { getCertificatesByRole, fetchBundleProducts, createPaymentOrder } from '../services/api';
import type { AssessmentReportData, BundleProductData } from '../types';

// Razorpay configuration from environment variable
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';

// Debug: Log the key status for development
console.log('🔑 Razorpay Key Status:', RAZORPAY_KEY ? 'Key found' : 'Key missing - check VITE_RAZORPAY_KEY environment variable');
console.log('🌍 Environment:', RAZORPAY_KEY?.startsWith('rzp_test_') ? 'TEST MODE' : RAZORPAY_KEY?.startsWith('rzp_live_') ? 'LIVE MODE' : 'UNKNOWN');

const ResultsPageV5 = () => {
    const [searchParams] = useSearchParams();

    // API State
    const [reportData, setReportData] = useState<AssessmentReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Bundle State
    const [bundleData, setBundleData] = useState<BundleProductData | null>(null);

    // Get IDs from URL or localStorage - try different parameter names
    const sessionIdParam = searchParams.get('session_id') || searchParams.get('session') || searchParams.get('id');
    const storedSessionId = getStoredSessionId();
    // Keep as string for UUID compatibility
    const sessionId = sessionIdParam || storedSessionId;

    const bundleIdParam = searchParams.get('bundle_id');
    const storedBundleId = getStoredBundleId();
    const bundleId = bundleIdParam ? parseInt(bundleIdParam, 10) : (storedBundleId ? parseInt(storedBundleId, 10) : 12345);

    // Get score from URL params, default to 80 for demo (will be overwritten by API if functional)
    const urlScore = parseInt(searchParams.get('score') || '0', 10);
    const [score, setScore] = useState(urlScore);
    const [selectedPurchaseOption, setSelectedPurchaseOption] = useState<'individual' | 'bundle'>('individual');
    const [selectedAddon, setSelectedAddon] = useState<boolean>(false);
    const [isPurchaseAreaVisible, setIsPurchaseAreaVisible] = useState(false);
    
    // Payment processing states
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentId, setPaymentId] = useState<string>('');

    // User information collection (simplified - try localStorage first)
    const [showUserInfoModal, setShowUserInfoModal] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Determine Role Name
    const roleParam = searchParams.get('role');
    const derivedRole = roleParam || getStoredRole() || 'Professional';
    // const userName = getUserName();

    // Format time taken in seconds to MM:SS format
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Download Report Functionality (same as V4)
    const [isDownloading, setIsDownloading] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [openFAQItems, setOpenFAQItems] = useState<number[]>([]);

    const toggleFAQItem = (index: number) => {
        setOpenFAQItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    // V5-to-V4 Compatibility Layer - Convert V5 selections to V4-compatible structure
    
    // Convert V5 selections to V4-compatible certificate IDs
    const getSelectedCertificateIds = (): number[] => {
        if (!bundleData?.certifications) return [];
        
        if (selectedPurchaseOption === 'individual') {
            // Return primary certificate only
            const primaryCert = bundleData.certifications.find(cert => cert.type === 'default');
            return primaryCert ? [primaryCert.skill_id] : [bundleData.certifications[0]?.skill_id].filter(Boolean);
        } else {
            // Return all certificate IDs for bundle
            return bundleData.certifications.map(cert => cert.skill_id).filter(Boolean);
        }
    };

    // V5 fixed pricing
    const calculateTotalPrice = (): number => {
        let basePrice = selectedPurchaseOption === 'individual' ? 1999 : 4999;
        return selectedAddon ? basePrice + 999 : basePrice;
    };

    // Generate V4-compatible detailed_items array
    const generateDetailedItems = (): any[] => {
        const selectedCertIds = getSelectedCertificateIds();
        
        // Map selected certificates to V4 format
        const certItems = bundleData?.certifications
            .filter(cert => selectedCertIds.includes(cert.skill_id))
            .map(cert => ({
                id: cert.skill_id,                                          // CRITICAL: Maps to role_certificate_id
                name: cert.certification_name || 'Professional Certificate',
                short_name: cert.certification_name_short || 'CERT',
                price: cert.price || (selectedPurchaseOption === 'individual' ? 1999 : Math.floor(4999 / bundleData.certifications.length)),
                tier: cert.badge || cert.type || "Core Certification"
            })) || [];

        // Add placement addon as separate item (webhook can handle non-certificate items)
        if (selectedAddon) {
            certItems.push({
                id: 99999,                                                 // Special ID for addon (won't create certificate)
                name: 'Placement Support Service',
                short_name: 'Placement Support',
                price: 999,
                tier: 'Support Service'
            });
        }

        return certItems;
    };

    // Extract user data from session/assessment data
    const getUserDataFromSession = async () => {
        console.log('🔍 getUserDataFromSession: Starting user data extraction...');
        try {
            const currentSessionId = sessionId || getStoredSessionId();
            if (!currentSessionId) {
                console.log('❌ getUserDataFromSession: No session ID found');
                return null;
            }

            console.log('🔍 getUserDataFromSession: Session ID:', currentSessionId);
            console.log('🔍 getUserDataFromSession: reportData:', reportData);

            // Try to get user data from the assessment data first (if we have user_id)
            if (reportData && (reportData as any).user_id) {
                const userId = (reportData as any).user_id;
                console.log('🔍 getUserDataFromSession: Found user_id in reportData:', userId);
                
                // Get user details from users table (correct column names!)
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('name, email, phone_number')  // ✅ FIXED: phone_number not phone
                    .eq('id', userId)
                    .single();

                console.log('🔍 getUserDataFromSession: User query result:', { userData, error });

                if (userData && !error) {
                    console.log('✅ getUserDataFromSession: Successfully extracted user data:', userData);
                    return {
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone_number || ''  // ✅ Map phone_number to phone
                    };
                }
            } else {
                console.log('⚠️ getUserDataFromSession: No user_id found in reportData');
            }

            // Fallback: try to get from session table
            console.log('🔍 getUserDataFromSession: Trying fallback method - session table');
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('id', parseInt(currentSessionId))
                .single();

            console.log('🔍 getUserDataFromSession: Session query result:', { sessionData, sessionError });

            if (sessionData?.user_id && !sessionError) {
                console.log('🔍 getUserDataFromSession: Session has user_id:', sessionData.user_id);
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('name, email, phone_number')  // ✅ FIXED: phone_number not phone
                    .eq('id', sessionData.user_id)  // ✅ Use 'id' field (it's the primary key)
                    .single();

                console.log('🔍 getUserDataFromSession: Fallback user query result:', { userData, userError });

                if (userData && !userError) {
                    console.log('✅ getUserDataFromSession: Successfully extracted user data via fallback:', userData);
                    return {
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone_number || ''  // ✅ Map phone_number to phone
                    };
                }
            }
        } catch (error) {
            console.error('❌ getUserDataFromSession: Error during extraction:', error);
        }
        
        console.log('❌ getUserDataFromSession: No user data found, returning null');
        return null;
    };

    // User information collection helper
    // const saveUserInfo = () => {
    //     localStorage.setItem('userName', userInfo.name);
    //     localStorage.setItem('userEmail', userInfo.email);
    //     if (userInfo.phone) localStorage.setItem('userPhone', userInfo.phone);
    //     setShowUserInfoModal(false);
    //     handlePurchase(); // Retry purchase
    // };

    // Core Payment Functions (Direct Port from V4)
    
    // Open Razorpay payment modal
    // const openRazorpay = (razorpayOrderId: string, internalOrderId: number, amount: number, description: string, notes: any, purchasedItemsForStorage: any[]) => {
    //     // Check if Razorpay key is available
    //     if (!RAZORPAY_KEY) {
    //         console.error('❌ Razorpay key is missing! Please set VITE_RAZORPAY_KEY in your environment variables.');
    //         alert('Payment configuration error: Razorpay key not found. Please check your environment variables.');
    //         setIsPurchasing(false);
    //         return;
    //     }

    //     const options: RazorpayOptions = {
    //         key: RAZORPAY_KEY,
    //         amount: amount * 100, // Amount in paise
    //         currency: 'INR',
    //         name: 'LearnTube',
    //         description: description,
    //         order_id: razorpayOrderId,
    //         handler: function (response: RazorpayResponse) {
    //             console.log('🎉 Payment Success:', response.razorpay_payment_id);
    //             setPaymentId(response.razorpay_payment_id);
    //             setShowPaymentSuccess(true);
                
    //             // Store purchased items
    //             localStorage.setItem('purchasedItems', JSON.stringify(purchasedItemsForStorage));
                
    //             // Webhook will handle the rest automatically
    //             setTimeout(() => {
    //                 window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&session_id=${sessionId}`;
    //             }, 2000);
    //         },
    //         modal: {
    //             ondismiss: () => setIsPurchasing(false)
    //         },
    //         prefill: {
    //             name: notes.user_name,
    //             email: notes.user_email,
    //             contact: notes.user_phone || ''
    //         },
    //         theme: {
    //             color: '#00E599'  // V5 brand color
    //         }
    //     };

    //     const razorpay = new window.Razorpay(options);
    //     razorpay.open();
    // };

    // Main Purchase Handler (V5 with Session Data Integration)
    // const handlePurchase = async () => {
    //     setIsPurchasing(true);
        
    //     try {
    //         // First, try to get user data from session
    //         const sessionUserData = await getUserDataFromSession();
            
    //         let userName = '';
    //         let userEmail = '';
    //         let userPhone = '';

    //         if (sessionUserData) {
    //             // Use session data if available
    //             userName = sessionUserData.name;
    //             userEmail = sessionUserData.email;
    //             userPhone = sessionUserData.phone;
    //             console.log('Using user data from session:', sessionUserData);
    //         } else {
    //             // Fallback to localStorage or manual input
    //             userName = localStorage.getItem('userName') || userInfo.name;
    //             userEmail = localStorage.getItem('userEmail') || userInfo.email;
    //             userPhone = localStorage.getItem('userPhone') || userInfo.phone;
    //         }
            
    //         // If still no name/email, show the user info modal
    //         if (!userName || !userEmail) {
    //             setShowUserInfoModal(true);
    //             setIsPurchasing(false);
    //             return;
    //         }

    //         const totalPrice = calculateTotalPrice();
    //         const detailedItems = generateDetailedItems();
    //         const description = selectedPurchaseOption === 'bundle' 
    //             ? `${derivedRole} Complete Bundle${selectedAddon ? ' + Placement Support' : ''}` 
    //             : `Professional Certificate${selectedAddon ? ' + Placement Support' : ''}`;

    //         // Create order using EXACT V4 API structure
    //         const orderData = await createPaymentOrder(
    //             totalPrice,
    //             detailedItems.map(item => item.name).join(', '),                    // purchased_products
    //             'specialized_platform_main',
    //             {
    //                 // Core V4 fields - EXACT match
    //                 user_name: userName,
    //                 user_email: userEmail, 
    //                 user_phone: userPhone,
    //                 session_id: sessionId,
    //                 role_id: 37,                                                      // Default role ID
    //                 project_name: 'specialized_platform_main',
    //                 purchase_type: selectedPurchaseOption === 'bundle' ? 'BUNDLE' : 'INDIVIDUAL',
    //                 item_list: detailedItems.map(item => item.short_name).join(', ')
    //             },
    //             detailedItems                                                       // detailed_items array
    //         );

    //         // Open payment modal
    //         openRazorpay(
    //             orderData.id,
    //             orderData.internal_order_id || 999,
    //             totalPrice,
    //             description,
    //             orderData.notes,
    //             bundleData?.certifications || []
    //         );
            
    //     } catch (error) {
    //         console.error('Failed to create order:', error);
    //         alert('Failed to initiate purchase. Please try again.');
    //         setIsPurchasing(false);
    //     }
    // };

    // User information collection helper
    const saveUserInfo = () => {
        localStorage.setItem('userName', userInfo.name);
        localStorage.setItem('userEmail', userInfo.email);
        if (userInfo.phone) localStorage.setItem('userPhone', userInfo.phone);
        setShowUserInfoModal(false);
        handlePurchase(); // Retry purchase
    };

    // Core Payment Functions (Direct Port from V4)
    
    // Open Razorpay payment modal
    const openRazorpay = (razorpayOrderId: string, internalOrderId: number, amount: number, description: string, notes: any, purchasedItemsForStorage: any[]) => {
        // Check if Razorpay key is available
        if (!RAZORPAY_KEY) {
            console.error('❌ Razorpay key is missing! Please set VITE_RAZORPAY_KEY in your environment variables.');
            alert('Payment configuration error: Razorpay key not found. Please check your environment variables.');
            setIsPurchasing(false);
            return;
        }

        console.log('💳 ==== RAZORPAY MODAL INITIALIZATION ====');
        console.log(`➡️  Opening Modal for Order ID: ${razorpayOrderId}`);
        console.log(`➡️  Internal DB Order ID: ${internalOrderId}`);
        console.log(`➡️  Amount: ${amount}`);
        console.log(`➡️  Notes Attached to Modal:`, notes);
        console.log('============================================');

        const options: RazorpayOptions = {
            key: RAZORPAY_KEY,
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            name: 'LearnTube',
            description: description,
            order_id: razorpayOrderId,
            handler: function (response: RazorpayResponse) {
                console.log('🎉 ==== PAYMENT SUCCESS CAPTURED ====');
                console.log(`✅ Razorpay Payment ID: ${response.razorpay_payment_id}`);
                console.log(`✅ Tied to Order ID: ${response.razorpay_order_id}`);
                console.log(`✅ Expected Original Order ID: ${razorpayOrderId}`);
                console.log('=====================================');

                analytics.track('payment_success', {
                    payment_id: response.razorpay_payment_id,
                    order_id: response.razorpay_order_id,
                    amount: amount
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

                // Update Supabase Session immediately
                const updateSessionPromise = (async () => {
                    try {
                        const updateData: any = {
                            is_paid: true,
                            amount_paid: amount,
                            payment_id: response.razorpay_payment_id,
                            purchased_products: purchasedItemsForStorage
                        };

                        const { error } = await supabase.from('sessions')
                            .update(updateData)
                            .eq('session_id', storedSessionId || sessionIdParam);

                        if (error) console.error('Failed to update session is_paid:', error);
                        else console.log('Session marked as paid.');
                    } catch (e) {
                        console.error('Session update error:', e);
                    }
                })();

                // Wait for critical saves before redirecting (webhook handles the rest)
                Promise.all([updateSessionPromise]).finally(() => {
                    console.log('Critical Purchase Data Saved. Webhook will handle certificate generation.');
                    
                    // Redirect to payment success page after delay
                    setTimeout(() => {
                        window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&session_id=${sessionId}`;
                    }, 2000);
                });
            },
            modal: {
                ondismiss: function () {
                    analytics.track('payment_modal_closed', {
                        order_id: razorpayOrderId
                    });
                    setIsPurchasing(false);
                }
            },
            notes: notes,
            prefill: {
                name: notes.user_name,
                email: notes.user_email,
                contact: notes.user_phone || ''
            },
            theme: {
                color: '#00E599' // V5 brand color
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

    // Main Purchase Handler (V4-Compatible)
    const handlePurchase = async () => {
        console.log('🚀 handlePurchase: Starting purchase process...');
        setIsPurchasing(true);
        
        try {
            // First, try to get user data from session
            console.log('🔍 handlePurchase: About to call getUserDataFromSession...');
            const sessionUserData = await getUserDataFromSession();
            console.log('🔍 handlePurchase: getUserDataFromSession returned:', sessionUserData);
            
            let userName = '';
            let userEmail = '';
            let userPhone = '';

            if (sessionUserData) {
                // Use session data if available
                userName = sessionUserData.name;
                userEmail = sessionUserData.email;
                userPhone = sessionUserData.phone;
                console.log('✅ handlePurchase: Using user data from session:', sessionUserData);
            } else {
                // Fallback to localStorage or manual input
                userName = localStorage.getItem('userName') || userInfo.name;
                userEmail = localStorage.getItem('userEmail') || userInfo.email;
                userPhone = localStorage.getItem('userPhone') || userInfo.phone;
                console.log('⚠️ handlePurchase: Using localStorage/manual data:', { userName, userEmail, userPhone });
            }
            
            // If still no name/email, show the user info modal
            if (!userName || !userEmail) {
                console.log('❌ handlePurchase: No user data available, showing modal');
                setShowUserInfoModal(true);
                setIsPurchasing(false);
                return;
            }

            console.log('✅ handlePurchase: Proceeding with user data:', { userName, userEmail, userPhone });
            const totalPrice = calculateTotalPrice();
            const detailedItems = generateDetailedItems();
            const description = selectedPurchaseOption === 'bundle' 
                ? `${derivedRole} Complete Bundle${selectedAddon ? ' + Placement Support' : ''}` 
                : `Professional Certificate${selectedAddon ? ' + Placement Support' : ''}`;

            // Create order using EXACT V4 API structure
            const orderData = await createPaymentOrder(
                totalPrice,
                detailedItems.map(item => item.name).join(', '),                    // purchased_products
                'specialized_platform_main',
                {
                    // Core V4 fields - EXACT match
                    user_name: userName,
                    user_email: userEmail, 
                    user_phone: userPhone,
                    session_id: sessionId,
                    role_id: 37,                                                      // Default role ID
                    project_name: 'specialized_platform_main',
                    purchase_type: selectedPurchaseOption === 'bundle' ? 'BUNDLE' : 'INDIVIDUAL',
                    item_list: detailedItems.map(item => item.short_name).join(', ')
                },
                detailedItems                                                       // detailed_items array
            );

            // Open payment modal
            openRazorpay(
                orderData.id,
                orderData.internal_order_id || 999,
                totalPrice,
                description,
                orderData.notes,
                bundleData?.certifications || []
            );
            
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to initiate purchase. Please try again.');
            setIsPurchasing(false);
        }
    };

    // Generate AI Summary functionality
    const generateAISummary = async () => {
        if (!reportData || reportData.ai_summary) return reportData?.ai_summary || '';

        try {
            // Create a comprehensive summary based on performance data
            const totalQuestions = reportData.score_breakdown?.reduce((sum, phase) => sum + phase.phase_total_questions, 0) || 0;
            const correctAnswers = reportData.score_breakdown?.reduce((sum, phase) => sum + phase.phase_correct_answers, 0) || 0;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);
            
            // Generate summary based on performance
            let summary = `Assessment Performance Summary for ${derivedRole}\n\n`;
            
            if (percentage >= 80) {
                summary += `Excellent performance! You demonstrated strong competency across key ${derivedRole.toLowerCase()} skills, scoring ${percentage}% overall. `;
            } else if (percentage >= 60) {
                summary += `Good performance with room for growth. You showed solid understanding in several areas, achieving ${percentage}% overall. `;
            } else {
                summary += `Development opportunity identified. With ${percentage}% overall score, focused improvement in key areas will enhance your ${derivedRole.toLowerCase()} capabilities. `;
            }

            // Add phase-specific insights
            if (reportData.score_breakdown && reportData.score_breakdown.length > 0) {
                const topPhase = reportData.score_breakdown.reduce((max, phase) => 
                    phase.phase_score > max.phase_score ? phase : max
                );
                const weakPhase = reportData.score_breakdown.reduce((min, phase) => 
                    phase.phase_score < min.phase_score ? phase : min
                );

                summary += `Your strongest area was ${topPhase.phase_name} (${topPhase.phase_score}%), while ${weakPhase.phase_name} (${weakPhase.phase_score}%) presents an opportunity for focused development. `;
            }

            summary += `This assessment provides valuable insights into your current skill level and helps identify specific areas for professional growth in your ${derivedRole.toLowerCase()} career path.`;

            // Update reportData with generated summary
            const updatedReportData = { ...reportData, ai_summary: summary };
            setReportData(updatedReportData);
            
            return summary;
        } catch (error) {
            console.error('Error generating AI summary:', error);
            return 'Summary generation temporarily unavailable. Please try again later.';
        }
    };
    
    const handleDownloadReport = async () => {
        if (!reportData) {
            console.error('No report data available for download');
            return;
        }

        setIsDownloading(true);
        try {
            // Generate AI summary if it doesn't exist
            const aiSummary = reportData.ai_summary || await generateAISummary();
            
            const { pdf } = await import('@react-pdf/renderer');
            const ReportPDF = (await import('../components/ReportPDF')).default;

            const svgToPngDataUrl = async (svgUrl: string, width: number, height: number): Promise<string> => {
                const response = await fetch(svgUrl);
                const svgText = await response.text();

                return new Promise((resolve) => {
                    const img = new window.Image();
                    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(svgBlob);

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            const dataUrl = canvas.toDataURL('image/png');
                            resolve(dataUrl);
                        }
                        URL.revokeObjectURL(url);
                    };

                    img.src = url;
                });
            };

            // Convert logos to PNG data URLs
            const [learntubeDataUrl, googleDataUrl] = await Promise.all([
                svgToPngDataUrl('/assets/learntube-logo.svg', 400, 80),
                svgToPngDataUrl('/assets/backed-by-google.svg', 400, 80)
            ]);

            const logoUrls = {
                learntube: learntubeDataUrl,
                google: googleDataUrl
            };

            // Map API breakdown to Component breakdown
            const breakdown = reportData?.score_breakdown?.map(item => ({
                phase: item.phase_name,
                score: item.phase_score,
                maxScore: 100,
                questions: item.phase_total_questions,
                correct: item.phase_correct_answers,
            })) || [];

            const totalQuestions = breakdown.reduce((sum, phase) => sum + phase.questions, 0);
            const correctAnswers = breakdown.reduce((sum, phase) => sum + phase.correct, 0);

            const blob = await pdf(
                <ReportPDF
                    score={score}
                    role={derivedRole}
                    breakdown={breakdown}
                    aiSummary={aiSummary || ''}
                    answerSheet={reportData.answer_sheet || []}
                    logos={logoUrls.learntube && logoUrls.google ? logoUrls : undefined}
                    strengths={reportData.strengths || []}
                    weaknesses={reportData.weaknesses || []}
                    overview={{
                        totalQuestions,
                        correctAnswers,
                        timeTaken: formatTime(reportData.time_taken_in_seconds || 0)
                    }}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Assessment_Report_${derivedRole.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            analytics.track('report_downloaded', { role: derivedRole, score: score });

        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert("There was an error generating the PDF report. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    // FAQ Data
    const faqData = [
        {
            question: "What types of certificates do you offer?",
            answer: "We offer a wide range of professional certifications including CBAPX, CSCPX, CSP, PMQX, CPHRX, Cybersecurity, PMP-Assessment, Six Sigma (Black Belt & Yellow Belt), FPAA, DTPCX, SPIN Selling, CDAPX, CMAP, CloudArchX, CELX, and many more."
        },
        {
            question: "How do I earn a certificate?",
            answer: "To earn your certificate, you must complete an Assessment methodology and score at least 50% or above."
        },
        {
            question: "How long are the certificates valid?",
            answer: "Most of our certificates are valid for a lifetime and do not require renewal. If renewal is required for a specific Certificate, it will be clearly mentioned before making the payment."
        },
        {
            question: "How can I purchase a certificate?",
            answer: "You can purchase certificates directly on our platform after completing the required assessment. Payment options include major credit/debit cards, UPI, net banking, and international options."
        },
        {
            question: "What is your refund policy?",
            answer: "Refunds are only provided if we are unable to deliver the service you paid for within 48 hours of purchase (excluding public holidays). Once a certificate is issued, it is non-refundable and non-cancellable."
        },
        {
            question: "How will I receive my certificate?",
            answer: "Certificates are issued digitally and can be downloaded instantly once you pass the assessment and complete payment. Printed copies are available on request (additional charges may apply)."
        },
        {
            question: "Can I correct my name on the certificate?",
            answer: "Yes, if your name is misspelled, email us at hello@careerninja.in with valid ID proof. Corrections are free if requested within 7 days of issuance."
        },
        {
            question: "How can my employer verify my certificate?",
            answer: "Each certificate has a unique ID. Verification can be done anytime through our official link:"
        },
        {
            question: "I didn't receive my certificate. What should I do?",
            answer: "Check your inbox and spam/junk folder for an email from no-reply@learntube.ai. If you still don't see it, contact our support team with your Payment details."
        },
        {
            question: "How can I contact support?",
            answer: "For any certificate-related queries, email us at hello@careerninja.in. Our team usually responds within 24–48 business hours."
        }
    ];

    // Track results page view
    useEffect(() => {
        // Register session if available
        const currentSessionId = getStoredSessionId();
        if (currentSessionId) {
            analytics.register({ session_id: currentSessionId });
            analytics.setSessionId(currentSessionId);
            
            if (import.meta.env.DEV) {
                console.log('[ResultsPageV5] 📝 Registered session with analytics:', currentSessionId.slice(0, 8) + '...');
            }
        }
        
        if (!isLoading && score !== null) {
            analytics.track('view_results_page_v5', {
                score,
                result_status: score >= 50 ? 'Pass' : 'Fail',
                page_version: 'v5'
            });
        }
    }, [isLoading, score]);

    // Fetch Assessment Report (same logic as V4)
    useEffect(() => {
        let isMounted = true;

        const loadReport = async () => {
            if (isMounted) setIsLoading(true);

            try {
                // --- DATABASE-FIRST SCORING LOGIC START ---
                console.log(`RESULTS_V5: Starting database-first score calculation...`);

                // Get session ID from URL or localStorage
                const currentSessionId = sessionId || getStoredSessionId();
                if (!currentSessionId) {
                    throw new Error('No session ID found for results');
                }

                console.log('RESULTS_V5: Using session ID:', currentSessionId);
                
                // Try to fetch assessment data from database first
                let userAssessmentData: any = null;
                let answersMap = new Map<number, Map<number, any>>();
                let hasDbData = false;

                try {
                    console.log('RESULTS_V5: Attempting to fetch data from database...');
                    const { getUserAssessmentBySession } = await import('../services/api');
                    const assessmentResponse = await getUserAssessmentBySession(parseInt(currentSessionId));

                    if (assessmentResponse.result === 'success' && assessmentResponse.data) {
                        userAssessmentData = assessmentResponse.data;
                        hasDbData = true;
                        console.log('RESULTS_V5: Found assessment data in database:', userAssessmentData);

                        // Convert database user_answers to answersMap format
                        if (userAssessmentData.user_answers) {
                            Object.keys(userAssessmentData.user_answers).forEach(phaseKey => {
                                const phaseNum = parseInt(phaseKey);
                                const phaseAnswers = userAssessmentData.user_answers[phaseKey];
                                const currentMap = new Map<number, any>();
                                
                                Object.keys(phaseAnswers).forEach(questionIdKey => {
                                    const questionId = parseInt(questionIdKey);
                                    const answerValue = phaseAnswers[questionIdKey];
                                    // Convert string answer to object format expected by scoring logic
                                    const answerData = typeof answerValue === 'string' 
                                        ? { selected_option: answerValue }
                                        : answerValue;
                                    currentMap.set(questionId, answerData);
                                });
                                
                                answersMap.set(phaseNum, currentMap);
                            });
                            console.log('RESULTS_V5: Converted database answers to map:', answersMap);
                        }
                    }
                } catch (dbError) {
                    console.warn('RESULTS_V5: Failed to fetch from database, trying localStorage...', dbError);
                }

                // Fallback to localStorage if no database data
                if (!hasDbData) {
                    console.log('RESULTS_V5: No database data found, trying localStorage...');
                    
                    const allStorageKeys = Object.keys(localStorage);
                    const phaseDataKeys = allStorageKeys.filter(k => k.match(/assessment_.*_phase_\d+_data/));

                    console.log('RESULTS_V5: Found phase data keys in localStorage:', phaseDataKeys);

                    phaseDataKeys.forEach(key => {
                        try {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            console.log(`RESULTS_V5: Phase data for ${key}:`, data);
                            let scenarioId = parseInt(data.scenario_id, 10);
                            if (isNaN(scenarioId)) scenarioId = parseInt(data.phase_number, 10);

                            if (!isNaN(scenarioId) && data.phase_user_answers) {
                                console.log(`RESULTS_V5: Processing scenario ${scenarioId} with answers:`, data.phase_user_answers);
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
                }

                console.log('RESULTS_V5: Final answers map:', answersMap);

                // Calculate Score using real scenario data
                let correctCount = 0;
                let totalQuestions = 0;
                const scoreBreakdown: any[] = [];
                const answerSheet: any[] = [];

                // Fetch real scenarios from API instead of using mock data
                try {
                    const currentSessionId = sessionId || getStoredSessionId();
                    if (!currentSessionId) {
                        throw new Error('No session ID found for scoring');
                    }

                    console.log('RESULTS_V5: Fetching scenarios for session:', currentSessionId);
                    
                    // Import the fetchBundleScenarios function
                    const { fetchBundleScenarios } = await import('../services/api');
                    const scenariosResponse = await fetchBundleScenarios(currentSessionId);
                    
                    if (!scenariosResponse.success || !scenariosResponse.data?.scenarios) {
                        throw new Error('Failed to fetch scenarios for scoring');
                    }

                    const realScenarios = scenariosResponse.data.scenarios;
                    console.log('RESULTS_V5: Using real scenarios for scoring:', realScenarios);

                    console.log('RESULTS_V5: Real scenarios scenario_ids:', realScenarios.map(s => s.scenario_id));
                    console.log('RESULTS_V5: Answers map keys:', Array.from(answersMap.keys()));

                    realScenarios.forEach((scenario, index) => {
                        let phaseCorrect = 0;
                        let phaseTotal = scenario.questions?.length || 0;
                        const scenarioId = Number(scenario.scenario_id);
                        
                        // Try to find answers by scenario_id first, then by phase index
                        let scenarioAnswers = answersMap.get(scenarioId);
                        if (!scenarioAnswers || scenarioAnswers.size === 0) {
                            // Try using phase index (1-based)
                            scenarioAnswers = answersMap.get(index + 1);
                            console.log(`RESULTS_V5: No answers for scenario_id ${scenarioId}, trying phase index ${index + 1}`);
                        }

                        console.log(`RESULTS_V5: Processing scenario ${scenarioId} (phase ${index + 1}) with ${phaseTotal} questions`);
                        console.log(`RESULTS_V5: Scenario answers:`, scenarioAnswers);

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

                                console.log(`RESULTS_V5: Q${qId} - User: "${userSelectedOption}", Correct: "${correctOptionId}"`);

                                // Normalize & Compare
                                const normUser = String(userSelectedOption).trim().toLowerCase();
                                const normRef = String(correctOptionId).trim().toLowerCase();
                                console.log(`RESULTS_V5: Q${qId} - Normalized - User: "${normUser}", Correct: "${normRef}"`);
                                if (normUser === normRef) {
                                    isCorrect = true;
                                    phaseCorrect++;
                                    console.log(`RESULTS_V5: Q${qId} - CORRECT!`);
                                } else {
                                    console.log(`RESULTS_V5: Q${qId} - Wrong answer`);
                                }
                            } else {
                                console.log(`RESULTS_V5: Q${qId} - No user answer found`);
                            }

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
                            skill_name: scenario.phase || scenario.scenario_name
                        });
                    });

                } catch (scenarioError) {
                    console.error('RESULTS_V5: Failed to fetch real scenarios, falling back to mock data:', scenarioError);
                    
                    // Fallback to mock data if real scenarios fail
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
                            skill_name: scenario.phase || scenario.scenario_name
                        });
                    });
                }

                console.log(`RESULTS_V5: Calculated Score: ${correctCount}/${totalQuestions}`);
                console.log('RESULTS_V5: Score breakdown:', scoreBreakdown);

                // Get time taken - prioritize database data if available
                let timeTaken = 300; // default fallback
                if (hasDbData && userAssessmentData?.time_taken) {
                    timeTaken = userAssessmentData.time_taken;
                    console.log('RESULTS_V5: Using database time_taken:', timeTaken);
                } else {
                    const progressBackup = bundleId ? getStoredProgressBackup(bundleId) : null;
                    timeTaken = progressBackup?.cumulativeTime || 300;
                    console.log('RESULTS_V5: Using localStorage time_taken:', timeTaken);
                }

                const finalReportData: AssessmentReportData = {
                    id: 999,
                    created_at: Date.now(),
                    specialized_sessions_id: sessionId ? 0 : 0,
                    specialized_session_user_bundle_id: 12345,
                    specialized_session_quiz_data_id: 888,
                    assessment_score: correctCount.toString(),
                    score_breakdown: scoreBreakdown,
                    ai_summary: '',
                    answer_sheet: answerSheet,
                    strengths: [{ category: "Management", description: "Strategic Thinking", evidence: "Assessment" }],
                    weaknesses: [{ category: "Tactical", description: "Execution", recommendation: "Coursework" }],
                    time_taken_in_seconds: timeTaken,
                    ai_skill_breakdown: []
                };

                if (isMounted) {
                    setReportData(finalReportData);
                    
                    // Calculate score
                    let finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
                    
                    // Use existing database score for previously passed assessments
                    if (userAssessmentData && userAssessmentData.is_passed && userAssessmentData.score != null) {
                        console.log('RESULTS_V5: Found passed assessment with database score:', userAssessmentData.score, 'calculated would be:', finalScore);
                        
                        // If passed user has score below 50%, show 92% instead
                        if (userAssessmentData.score < 50) {
                            console.log('RESULTS_V5: Database score below 50% for passed user, using 92% instead of:', userAssessmentData.score);
                            finalScore = 92;
                        } else {
                            console.log('RESULTS_V5: Using existing database score:', userAssessmentData.score);
                            finalScore = userAssessmentData.score;
                        }
                    }
                    
                    // Update score state (Percentage)
                    setScore(finalScore);

                    // Construct the full report data object including user_id
                    const completeReportData = {
                        id: userAssessmentData?.id || 999,
                        created_at: userAssessmentData?.created_at || Date.now(),
                        specialized_sessions_id: 0,
                        specialized_session_user_bundle_id: bundleId,
                        specialized_session_quiz_data_id: 888,
                        user_id: userAssessmentData?.user_id || null, // ✨ CRITICAL: Include user_id
                        assessment_score: finalScore, // ✨ Required by AssessmentReportData
                        score: finalScore,
                        total_questions: totalQuestions,
                        correct_answers: correctCount,
                        time_taken_in_seconds: timeTaken,
                        score_breakdown: scoreBreakdown,
                        answer_sheet: answerSheet,
                        ai_summary: userAssessmentData?.ai_summary || ''
                    } as unknown as AssessmentReportData & { user_id?: number };

                    console.log('✅ RESULTS_V5: Setting complete report data with user_id:', completeReportData.user_id);
                    setReportData(completeReportData);
                    
                    setIsLoading(false);

                    // Save assessment if needed (same logic as V4)
                    if (sessionId) {
                        console.log('ASSESSMENT_SAVE_V5: Starting to save assessment for session:', sessionId);
                        const calculatedScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
                        const isPassed = calculatedScore >= 50;
                        
                        // Always save assessment data (like V3 does)
                        console.log('ASSESSMENT_SAVE_V5: Calculated score:', calculatedScore, 'Passed:', isPassed);

                        // First, get session details to find user_id
                        const { data: sessionData, error: sessionError } = await supabase
                            .from('sessions')
                            .select('user_id, role')
                            .eq('id', sessionId)
                            .single();

                        console.log('ASSESSMENT_SAVE_V5: Session data:', sessionData, 'Error:', sessionError);

                        if (sessionData?.user_id) {
                            // Get role_id from role name
                            const { data: roleData, error: roleError } = await supabase
                                .from('roles')
                                .select('id')
                                .eq('role_name', sessionData.role || 'HR Manager')
                                .single();

                            console.log('ASSESSMENT_SAVE_V5: Role data:', roleData, 'Error:', roleError);

                            // Get assessment_id
                            const { data: assessmentData, error: assessmentError } = await supabase
                                .from('assessments')
                                .select('id')
                                .eq('role_id', roleData?.id || 37)
                                .single();

                            console.log('ASSESSMENT_SAVE_V5: Assessment data:', assessmentData, 'Error:', assessmentError);

                            // Convert answersMap to a simple object for storage
                            const userAnswersObj: any = {};
                            answersMap.forEach((phaseAnswers, phaseId) => {
                                userAnswersObj[phaseId] = {};
                                phaseAnswers.forEach((answer, questionId) => {
                                    userAnswersObj[phaseId][questionId] = answer;
                                });
                            });

                            console.log('ASSESSMENT_SAVE_V5: User answers object:', userAnswersObj);

                            // Create or update user assessment
                            const assessmentRecord = {
                                session_id: parseInt(sessionId),
                                user_id: sessionData.user_id,
                                role_id: roleData?.id || 37,
                                assessment_id: assessmentData?.id || 22,
                                score: calculatedScore,
                                is_passed: isPassed,
                                is_complete: true,
                                user_answers: userAnswersObj,
                                time_taken: timeTaken || 300
                            };

                            console.log('ASSESSMENT_SAVE_V5: Assessment record to save:', assessmentRecord);

                            // Check if assessment already exists for this session
                            const { data: existingAssessment } = await supabase
                                .from('user_assessments')
                                .select('id')
                                .eq('session_id', parseInt(sessionId))
                                .single();

                            console.log('ASSESSMENT_SAVE_V5: Existing assessment:', existingAssessment);

                            let error;
                            if (existingAssessment) {
                                // Update existing assessment
                                console.log('ASSESSMENT_SAVE_V5: Updating existing assessment');
                                ({ error } = await supabase
                                    .from('user_assessments')
                                    .update(assessmentRecord)
                                    .eq('id', existingAssessment.id));
                            } else {
                                // Insert new assessment
                                console.log('ASSESSMENT_SAVE_V5: Inserting new assessment');
                                ({ error } = await supabase
                                    .from('user_assessments')
                                    .insert(assessmentRecord));
                            }

                            if (error) {
                                console.error('ASSESSMENT_SAVE_V5: Failed to save assessment:', error);
                            } else {
                                console.log('ASSESSMENT_SAVE_V5: Assessment saved successfully!', calculatedScore, isPassed);
                            }
                        } else {
                            console.warn('ASSESSMENT_SAVE_V5: No user_id found in session data');
                        }
                    } else {
                        console.warn('ASSESSMENT_SAVE_V5: No sessionId available');
                    }
                }

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

    // Fetch Certificates by Role (same logic as V4)
    useEffect(() => {
        const loadCertificates = async () => {
            console.log('RESULTS_V5: Starting certificate loading...');
            try {
                // Get role information from the session
                const currentSessionId = sessionId || getStoredSessionId();
                if (!currentSessionId) {
                    console.warn('No session ID found for certificates, using fallback.');
                    // Use fallback bundle loading
                    if (bundleId) {
                        const response = await fetchBundleProducts(bundleId);
                        setBundleData(response.data);
                        console.log('RESULTS_V5: Using fallback bundle data');
                    }
                    return;
                }

                console.log('RESULTS_V5: Using session ID:', currentSessionId);

                // Get role information from session
                const { data: sessionData, error: sessionError } = await supabase
                    .from('sessions')
                    .select('role')
                    .eq('id', currentSessionId)
                    .single();

                if (sessionError) {
                    console.warn('RESULTS_V5: Session query error:', sessionError);
                }

                const roleName = sessionData?.role || derivedRole || 'HR Manager';
                console.log('RESULTS_V5: Loading certificates for role:', roleName);

                // Get role ID from role name
                const { data: roleData, error: roleError } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('role_name', roleName)
                    .single();

                if (roleError) {
                    console.warn('RESULTS_V5: Role query error:', roleError);
                }

                const roleId = roleData?.id || 37; // fallback to known HR Manager role ID
                console.log('RESULTS_V5: Using role ID:', roleId);

                // Fetch certificates for this role
                const response = await getCertificatesByRole(roleId);
                console.log('RESULTS_V5: getCertificatesByRole response:', response);
                
                if (response.result === 'success' && response.data && response.data.length > 0) {
                    const certificates = response.data;
                    console.log('RESULTS_V5: Fetched certificates from DB:', certificates);
                    console.log('RESULTS_V5: Certificate IDs:', certificates.map(c => c.id));
                    console.log('RESULTS_V5: Certificate types:', certificates.map(c => `${c.id}:${c.type}`));

                    // Transform database certificates to match the expected format
                    const transformedCertifications = certificates.map((cert: any) => {
                        return {
                            skill_id: cert.id,
                            role_id: roleId, // Include role_id for order tracking
                            certification_name: cert.certificate_name || cert.name,
                            certification_name_short: cert.short_name,
                            cert_id_prefix: cert.cert_id_prefix,
                            skill_description: cert.description || '', // Required field
                            type: cert.type,
                            order_index: cert.order_index,
                            certificate_preview_url: cert.preview_image,
                            description: cert.description,
                            price: parseFloat(cert.price) || 0,
                            original_price: parseFloat(cert.original_price) || 0,
                            badge: cert.badge,
                            skill_frameworks: cert.skill_frameworks || []
                        };
                    });

                    console.log('RESULTS_V5: Transformed certificates:', transformedCertifications);

                    // Create bundle data structure
                    const bundleData = {
                        bundle_name: `Executive ${roleName} Bundle`,
                        certifications: transformedCertifications,
                        bundle_price: transformedCertifications.reduce((sum: number, cert: any) => sum + (cert.price || 0), 0),
                        bundle_original_price: transformedCertifications.reduce((sum: number, cert: any) => sum + (cert.original_price || 0), 0),
                        product_cost: transformedCertifications.reduce((sum: number, cert: any) => sum + (cert.price || 0), 0) // Required field
                    };

                    console.log('RESULTS_V5: Final bundle data structure:', bundleData);
                    setBundleData(bundleData);
                    console.log('RESULTS_V5: Bundle data set successfully:', bundleData);
                } else {
                    console.warn('RESULTS_V5: No certificates found for role:', roleName, 'roleId:', roleId);
                    console.warn('RESULTS_V5: Response was:', response);
                    throw new Error(`No certificates found for role: ${roleName} (ID: ${roleId})`);
                }

            } catch (err) {
                console.error('RESULTS_V5: Failed to load certificates:', err);
                console.log('RESULTS_V5: Error details:', (err as Error).message || err);
                
                // Fallback to the original bundle loading if role-based loading fails
                try {
                    console.log('RESULTS_V5: Attempting fallback to bundle loading...');
                    if (bundleId) {
                        console.log('RESULTS_V5: Using bundle ID:', bundleId);
                        const response = await fetchBundleProducts(bundleId);
                        console.log('RESULTS_V5: Fallback bundle response:', response);
                        setBundleData(response.data);
                        console.log('RESULTS_V5: Fallback bundle data loaded:', response.data);
                    } else {
                        console.warn('RESULTS_V5: No bundle ID available for fallback');
                    }
                } catch (fallbackErr) {
                    console.error('RESULTS_V5: Fallback bundle loading also failed:', fallbackErr);
                }
            }
        };

        loadCertificates();
    }, [sessionId, derivedRole, bundleId]);

    // Track purchase area visibility for sticky CTA
    useEffect(() => {
        const purchaseSection = document.getElementById('purchase-certificates-section');
        if (!purchaseSection) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsPurchaseAreaVisible(entry.isIntersecting);
            },
            { threshold: 0.1, rootMargin: '-100px 0px' }
        );

        observer.observe(purchaseSection);
        return () => observer.disconnect();
    }, [bundleData]);

    // Scroll to purchase section
    const scrollToPurchaseSection = () => {
        const purchaseSection = document.getElementById('purchase-certificates-section');
        if (purchaseSection) {
            purchaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Calculate total questions and correct answers for overall stats
    const totalQuestions = reportData?.score_breakdown?.reduce((sum, phase) => sum + (phase.phase_total_questions || 0), 0) || 20;
    const totalCorrectAnswers = reportData?.score_breakdown?.reduce((sum, phase) => sum + (phase.phase_correct_answers || 0), 0) || 20;

    // Get the first primary certificate for display
    const primaryCertificate = bundleData?.certifications?.find(cert => cert.type === 'default') || bundleData?.certifications?.[0];
    return (
            <div className="min-h-screen text-white font-sans pt-4 pb-32 lg:pb-24 overflow-x-hidden flex flex-col" style={{ 
                background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)'
            }}>
            <style>{`
                    @keyframes progressFill {
                        0% {
                            stroke-dashoffset: ${2 * Math.PI * 44};
                        }
                        100% {
                            stroke-dashoffset: ${2 * Math.PI * 44 * (1 - (score / 100))};
                        }
                    }
                    
                    @keyframes shine {
                        0% {
                            transform: translateX(-100%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }
                    
                    .shine-effect {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .shine-effect::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(
                            90deg,
                            transparent,
                            rgba(255, 255, 255, 0.2),
                            transparent
                        );
                        transform: translateX(-100%);
                        animation: shine 3s ease-in-out infinite;
                        pointer-events: none;
                    }
                    
                    @keyframes slide-up {
                        0% {
                            transform: translateY(100%);
                            opacity: 0;
                        }
                        100% {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    
                    .animate-slide-up {
                        animation: slide-up 0.3s ease-out forwards;
                    }
                `}</style>
            {/* Top Bar with Logos */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Main Content Area */}
            <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-2 md:pt-8 lg:pt-10 pb-12">
                <div className="w-full max-w-6xl mx-auto">
                    <main className="flex flex-col items-center space-y-4 mt-2 md:mt-4 lg:mt-6">
                        {/* Assessment Complete Section */}
                        <div className="text-center py-2 px-4 md:px-8 lg:px-12 animate-fade-in-up">
                            {/* Trophy Icon */}
                            <div className="relative w-14 h-14 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full bg-[#7FC241]/20 animate-pulse" />
                                <div className="relative w-full h-full rounded-full bg-[#7FC241] flex items-center justify-center animate-scale-in">
                                    <FontAwesomeIcon icon={faTrophy} className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Heading */}
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 animate-fade-in-up">
                                Assessment Complete!
                            </h1>
                            
                            {/* Subtitle */}
                            <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                Congratulations! You've successfully completed the assessment and are eligible for certification.
                            </p>
                        </div>

                        {/* Your Performance Card */}
                        {!isLoading && (
                            <div className="w-full max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                {/* Loading State */}
                                {isLoading && (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mx-auto mb-4"></div>
                                        <p className="text-gray-300">Analyzing your performance...</p>
                                    </div>
                                )}

                                {/* Error State */}
                                {apiError && !isLoading && (
                                    <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                        <p className="text-red-400 text-sm">{apiError}</p>
                                    </div>
                                )}

                                {/* Performance Card */}
                                {!isLoading && !apiError && reportData && (
                                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                        {/* Header with Download Button */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#7FC241] flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-white" />
                                                </div>
                                                <h3 className="text-white text-lg font-semibold">Your Performance</h3>
                                            </div>
                                            {/* Small Download Report Button */}
                                            <button 
                                                onClick={handleDownloadReport}
                                                disabled={isLoading || !reportData || isDownloading}
                                                className="bg-[#7FC241] hover:bg-[#68A335] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors duration-200 flex items-center gap-1.5"
                                            >
                                                <FontAwesomeIcon 
                                                    icon={faDownload} 
                                                    className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} 
                                                />
                                                {isDownloading ? 'Generating...' : 'Report'}
                                            </button>
                                        </div>

                                        {/* Score Circle */}
                                        <div className="flex justify-center mb-6">
                                            <div className="relative w-24 h-24">
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 rounded-full bg-[#7FC241]/10 blur-md animate-pulse" />
                                                
                                                <svg className="w-24 h-24 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                                                    {/* Define gradient */}
                                                    <defs>
                                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#98D048" />
                                                            <stop offset="50%" stopColor="#7FC241" />
                                                            <stop offset="100%" stopColor="#68A335" />
                                                        </linearGradient>
                                                        <filter id="glow">
                                                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                                            <feMerge> 
                                                                <feMergeNode in="coloredBlur"/>
                                                                <feMergeNode in="SourceGraphic"/>
                                                            </feMerge>
                                                        </filter>
                                                    </defs>
                                                    
                                                    {/* Background circle */}
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="44"
                                                        stroke="rgba(255, 255, 255, 0.08)"
                                                        strokeWidth="6"
                                                        fill="none"
                                                    />
                                                    
                                                    {/* Progress circle */}
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="44"
                                                        stroke="url(#progressGradient)"
                                                        strokeWidth="6"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 44}`}
                                                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - (score / 100))}`}
                                                        filter="url(#glow)"
                                                        className="transition-all duration-2000 ease-out"
                                                        style={{
                                                            animation: 'progressFill 2s ease-out forwards'
                                                        }}
                                                    />
                                                </svg>
                                                
                                                {/* Center content with enhanced styling */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                                    <span className="text-2xl font-bold text-white drop-shadow-sm">{score}%</span>
                                                    <span className="text-xs text-gray-400 font-medium">Score</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statistics */}
                                        <div className="space-y-3 mb-6">
                                            <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Total Questions</span>
                                                <span className="text-white font-medium">{totalQuestions}</span>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Correct Answers</span>
                                                <span className="text-[#7FC241] font-medium">{totalCorrectAnswers}</span>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Time Taken</span>
                                                <span className="text-white font-medium">{formatTime(reportData.time_taken_in_seconds || 300)}</span>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Status</span>
                                                <span className={`font-medium ${score >= 50 ? 'text-[#7FC241]' : 'text-red-400'}`}>
                                                    {score >= 50 ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Review Questions Button */}
                                        <div className="mb-6">
                                            <button 
                                                onClick={() => setShowQuestionModal(true)}
                                                className="w-full bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 text-gray-300 hover:text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                                                Review detailed questions
                                            </button>
                                        </div>

                                        {/* Phase Performance Section */}
                                        <div className="mb-6">
                                            {/* Phase Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faChartLine} className="w-3 h-3 text-white" />
                                                </div>
                                                <h4 className="text-white text-base font-semibold">Phase Performance</h4>
                                            </div>

                                            {/* Phase Statistics */}
                                            <div className="space-y-2">
                                                {reportData.score_breakdown?.map((phase, index) => (
                                                    <div key={index} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                                        <span className="text-gray-400 text-sm">{phase.phase_name}:</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="bg-white/10 text-white font-medium text-xs px-2 py-1 rounded-full">
                                                                {phase.phase_correct_answers}/{phase.phase_total_questions}
                                                            </span>
                                                            <span className="text-[#7FC241] font-medium text-sm">{phase.phase_score}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Get Your Certificate Card */}
                        {!isLoading && !apiError && score >= 50 && (
                            <div id="purchase-certificates-section" className="w-full max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-[#7FC241] flex items-center justify-center">
                                            <FontAwesomeIcon icon={faCertificate} className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="text-white text-lg font-semibold">Get Your Certificate</h3>
                                    </div>

                                    {/* Certificate Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FontAwesomeIcon icon={faEye} className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-400 text-sm font-medium">Certificate Preview</span>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            {primaryCertificate?.certificate_preview_url ? (
                                                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                                                    <img 
                                                        src={primaryCertificate.certificate_preview_url} 
                                                        alt={`${primaryCertificate.certification_name} Certificate Preview`}
                                                        className="w-full h-full object-cover rounded-lg shadow-lg"
                                                        onError={(e) => {
                                                            console.log('Certificate image failed to load:', primaryCertificate.certificate_preview_url);
                                                            // Fallback to placeholder if image fails to load
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            target.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    {/* Fallback placeholder (hidden by default) */}
                                                    <div className="hidden w-full h-full bg-gradient-to-br from-orange-100 to-blue-100 rounded-lg">
                                                        <div className="text-center text-gray-600 flex flex-col items-center justify-center h-full">
                                                            <FontAwesomeIcon icon={faCertificate} className="w-12 h-12 mb-2" />
                                                            <p className="text-sm">Certificate Preview</p>
                                                            <p className="text-xs">{primaryCertificate.certification_name}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-100 to-blue-100 rounded-lg flex items-center justify-center">
                                                    <div className="text-center text-gray-600">
                                                        <FontAwesomeIcon icon={faCertificate} className="w-12 h-12 mb-2" />
                                                        <p className="text-sm">Certificate Preview</p>
                                                        <p className="text-xs">{primaryCertificate?.certification_name || 'Professional Certificate'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Purchase Options */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-[#00E599]" />
                                            <span className="text-white text-lg font-bold">Purchase Options</span>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            {/* Individual Certificate */}
                                            <div 
                                                onClick={() => setSelectedPurchaseOption('individual')}
                                                className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 ${
                                                    selectedPurchaseOption === 'individual' 
                                                        ? 'bg-[#1C2534] border border-[#00E599]' 
                                                        : 'bg-[#1C2534] border border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Radio Button */}
                                                    <div className="mt-1">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                            selectedPurchaseOption === 'individual' ? 'border-[#00E599]' : 'border-gray-500'
                                                        }`}>
                                                            {selectedPurchaseOption === 'individual' && <div className="w-3 h-3 bg-[#00E599] rounded-full"></div>}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        {/* Header Row - Title and Badge */}
                                                        <div className="flex items-start gap-2 mb-3">
                                                            <h4 className="text-white font-bold text-lg sm:text-xl flex-1">Individual Certificate</h4>
                                                            {selectedPurchaseOption === 'individual' && (
                                                                <span className="bg-[#00E599] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                                                    SELECTED
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Description */}
                                                        <div className="text-gray-400 text-sm mb-3">
                                                            Includes digital certificate, verification badge, and lifetime access
                                                        </div>
                                                        
                                                        {/* Price Section */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-gray-500 text-xs">
                                                                Certificate Cost
                                                            </div>
                                                            <div className="text-xl font-bold text-white">₹1,999</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* HR Excellence Power Pack */}
                                            {bundleData?.certifications && bundleData.certifications.length > 1 && (
                                                <div 
                                                    onClick={() => setSelectedPurchaseOption('bundle')}
                                                    className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 shine-effect ${
                                                        selectedPurchaseOption === 'bundle' 
                                                            ? 'bg-gradient-to-br from-purple-400/20 via-purple-500/15 to-blue-500/20 border-2 border-[#B066FF] shadow-lg shadow-purple-500/25' 
                                                            : 'bg-gradient-to-br from-purple-400/10 via-purple-500/8 to-blue-500/10 border border-purple-400/30'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Radio Button */}
                                                        <div className="mt-1">
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                                selectedPurchaseOption === 'bundle' ? 'border-[#B066FF]' : 'border-gray-500'
                                                            }`}>
                                                                {selectedPurchaseOption === 'bundle' && <div className="w-3 h-3 bg-[#B066FF] rounded-full"></div>}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="flex-1">
                                                            {/* Header Row - Title and Badge */}
                                                            <div className="flex items-start gap-2 mb-4">
                                                                <h4 className="text-white font-bold text-lg sm:text-xl flex-1">{derivedRole} Power Pack</h4>
                                                                <span className="bg-gradient-to-r from-[#B066FF] to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm">
                                                                    Power Pack
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Certificate List */}
                                                            <div className="mb-4">
                                                                <div className="text-white text-sm mb-2 font-medium">Includes {bundleData.certifications.length} certificates:</div>
                                                                <div className="space-y-1">
                                                                    {bundleData.certifications.slice(0, 3).map((cert: any) => (
                                                                        <div key={cert.skill_id} className="flex items-start gap-2 text-xs text-gray-300">
                                                                            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-[#00E599] mt-0.5" />
                                                                            <span>{cert.certification_name_short || cert.certification_name}</span>
                                                                        </div>
                                                                    ))}
                                                                    {bundleData.certifications.length > 3 && (
                                                                        <div className="flex items-start gap-2 text-xs text-gray-300">
                                                                            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-[#00E599] mt-0.5" />
                                                                            <span>+{bundleData.certifications.length - 3} more certificates</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Price Section */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="text-gray-400 text-xs">Bundle Price</div>
                                                                <div className="text-xl font-bold text-[#B066FF]">₹4,999</div>
                                                            </div>
                                                            
                                                            {/* Savings Banner */}
                                                            {bundleData.bundle_original_price && bundleData.bundle_price && (
                                                                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-2 text-center text-[#00E599] text-xs font-bold border border-green-700/30">
                                                                    You save ₹{(bundleData.bundle_original_price - bundleData.bundle_price).toLocaleString("en-IN")} 
                                                                    ({Math.round(((bundleData.bundle_original_price - bundleData.bundle_price) / bundleData.bundle_original_price) * 100)}% off)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Placement Support Addon */}
                                            <div 
                                                onClick={() => setSelectedAddon(!selectedAddon)}
                                                className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 ${
                                                    selectedAddon 
                                                        ? 'bg-[#1C2534] border border-[#FF9500]' 
                                                        : 'bg-[#1C2534] border border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Checkbox */}
                                                    <div className="mt-1">
                                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                                            selectedAddon ? 'bg-[#FF9500] border-[#FF9500]' : 'border-gray-500'
                                                        }`}>
                                                            {selectedAddon && <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        {/* Header Row - Title and Badge */}
                                                        <div className="flex items-start gap-2 mb-3">
                                                            <h4 className="text-white font-bold text-lg sm:text-xl flex-1">Placement Support Addon</h4>
                                                            <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                                                OPTIONAL
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Description */}
                                                        <div className="text-gray-400 text-sm mb-3">
                                                            Get personalized career guidance, resume review, and interview preparation
                                                        </div>
                                                        
                                                        {/* Price Section */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-gray-500 text-xs">
                                                                Add-on Cost
                                                            </div>
                                                            <div className="text-xl font-bold text-white">+₹999</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handlePurchase}
                                            disabled={isPurchasing}
                                            className="w-full bg-[#00E599] hover:bg-[#00D48A] disabled:bg-[#00E599]/50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faCreditCard} className={`w-5 h-5 ${isPurchasing ? 'animate-spin' : ''}`} />
                                            <span className="text-base">
                                                {isPurchasing 
                                                    ? 'Processing...'
                                                    : selectedPurchaseOption === 'bundle'
                                                        ? `Purchase Bundle${selectedAddon ? ' + Addon' : ''}`
                                                        : `Purchase Certificate${selectedAddon ? ' + Addon' : ''}`
                                                }
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FAQ Section - Accordion Style */}
                        <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in-up">
                            {/* Section Header */}
                            <div className="text-center mb-10 sm:mb-12 px-4">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                                    Frequently Asked Questions
                                </h2>
                                <div className="h-1 w-20 bg-gradient-to-r from-[#00E599] to-[#4285F4] rounded-full mx-auto mb-4"></div>
                                <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
                                    Find answers to common questions about our certification process
                                </p>
                            </div>

                            {/* FAQ Items - Accordion */}
                            <div className="space-y-4 px-2 sm:px-4 mb-16">
                                {faqData.map((item, index) => {
                                    const isOpen = openFAQItems.includes(index);

                                    return (
                                        <div
                                            key={index}
                                            className={`
                                                group relative overflow-hidden rounded-xl border transition-all duration-300
                                                ${isOpen
                                                    ? 'bg-[#0B2A3D]/80 border-[#00E599]/50 shadow-[0_0_15px_rgba(0,229,153,0.1)]'
                                                    : 'bg-[#0B2A3D]/40 border-white/5 hover:border-white/20 hover:bg-[#0B2A3D]/60'
                                                }
                                            `}
                                        >
                                            {/* Question Button */}
                                            <button
                                                onClick={() => toggleFAQItem(index)}
                                                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 outline-none"
                                            >
                                                <h3 className={`font-semibold text-base sm:text-lg transition-colors duration-200 ${isOpen ? 'text-[#00E599]' : 'text-white group-hover:text-gray-100'}`}>
                                                    {item.question}
                                                </h3>

                                                {/* Expand/Collapse Icon */}
                                                <div className={`
                                                    flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300
                                                    ${isOpen
                                                        ? 'border-[#00E599] bg-[#00E599]/10 rotate-180'
                                                        : 'border-white/10 bg-white/5 group-hover:border-white/30 rotate-0'
                                                    }
                                                `}>
                                                    <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 transition-colors ${isOpen ? 'text-[#00E599]' : 'text-gray-400'}`}>
                                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {/* Answer Content */}
                                            <div className={`
                                                overflow-hidden transition-all duration-300 ease-in-out
                                                ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                                            `}>
                                                <div className="px-6 pb-6 pt-0">
                                                    <div className="h-px w-full bg-white/5 mb-4"></div>
                                                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                                        {index === 7 ? (
                                                            <div>
                                                                <p className="mb-3">{item.answer}</p>
                                                                <div className="bg-[#0b273d] rounded-lg p-3 border border-[#00E599]/20">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[#00E599] text-xs font-bold">👉</span>
                                                                        <a 
                                                                            href="https://certifications.learntube.ai/verify-certificate" 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="text-[#00E599] hover:text-[#00D48A] text-sm font-medium underline transition-colors"
                                                                        >
                                                                            https://certifications.learntube.ai/verify-certificate
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p>{item.answer}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Support Card */}
                            <div className="px-2 sm:px-4">
                                <div className="relative overflow-hidden rounded-2xl p-8 sm:p-10 text-center">
                                    {/* Background Gradients */}
                                    <div className="absolute inset-0 bg-[#0B2A3D] border border-white/10 rounded-2xl"></div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4285F4]/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-[#00E599]/20 to-[#4285F4]/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-lg">
                                            <svg className="w-8 h-8 text-[#00E599]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>

                                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                            Still have questions?
                                        </h3>
                                        <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
                                            Can't find the answer you're looking for? Our friendly team is here to help you with any queries.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <a
                                                href="mailto:hello@careerninja.in"
                                                className="group inline-flex items-center justify-center gap-2 bg-[#00E599] text-[#001C2C] px-8 py-3 rounded-xl font-bold text-base hover:bg-[#00D48A] transition-all duration-200 hover:shadow-lg hover:shadow-[#00E599]/20 hover:-translate-y-0.5"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>Email Support</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Sticky CTA Bar */}
            {!isLoading && score >= 50 && !isPurchaseAreaVisible && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#001C2C] border-t border-white/10 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-slide-up backdrop-blur-md bg-opacity-95">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#7FC241] flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faCertificate} className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm sm:text-base">Your Certifications are Ready!</span>
                                <span className="text-gray-400 text-xs sm:text-sm">
                                    <span className="text-[#00E599] font-bold">{bundleData?.certifications?.length || 1} Certificate{(bundleData?.certifications?.length || 0) > 1 ? 's' : ''}</span> unlocked based on your {score}% score
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={scrollToPurchaseSection}
                            className="bg-[#00E599] hover:bg-[#00D48A] text-black font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            )}

            {/* Question Review Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1C2534] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Detailed Question Review</h2>
                            <button
                                onClick={() => setShowQuestionModal(false)}
                                className="text-gray-400 hover:text-white transition-colors p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {reportData?.answer_sheet && reportData.answer_sheet.length > 0 ? (
                                <div className="space-y-4">
                                    {reportData.answer_sheet.map((question, index) => (
                                        <div key={index} className="bg-[#0b273d] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            {/* Question Header */}
                                            <div className="flex gap-3 mb-3">
                                                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                                    question.is_correct ? 'bg-[#7FC241]/20 text-[#7FC241]' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-white text-sm font-medium mb-2 leading-relaxed">
                                                        {question.question}
                                                    </div>
                                                    
                                                    {/* Answer Display - Simplified since options array doesn't exist in AnswerSheetItem */}
                                                    <div className="space-y-1.5 mb-3">
                                                        {question.users_answer && (
                                                            <div className={`p-2.5 rounded-lg border ${
                                                                question.is_correct 
                                                                    ? 'bg-[#7FC241]/10 border-[#7FC241]/30 text-[#7FC241]' 
                                                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                                            }`}>
                                                                <div className="flex items-start gap-2">
                                                                    <span className="font-medium">Your Answer:</span>
                                                                    <span className="text-xs leading-relaxed flex-1">{question.users_answer}</span>
                                                                    {question.is_correct && (
                                                                        <span className="text-[10px] bg-[#7FC241] text-black px-1.5 py-0.5 rounded font-bold">CORRECT</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!question.is_correct && question.correct_answer && (
                                                            <div className="p-2.5 rounded-lg border bg-[#7FC241]/10 border-[#7FC241]/30 text-[#7FC241]">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="font-medium">Correct Answer:</span>
                                                                    <span className="text-xs leading-relaxed flex-1">{question.correct_answer}</span>
                                                                    <span className="text-[10px] bg-[#7FC241] text-black px-1.5 py-0.5 rounded font-bold">CORRECT</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Result Summary */}
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className={`px-2 py-1 rounded-full font-bold ${
                                                            question.is_correct ? 'bg-[#7FC241]/20 text-[#7FC241]' : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {question.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                                        </div>
                                                        {question.rationale && (
                                                            <div className="text-gray-400 text-xs italic">
                                                                Rationale: {question.rationale}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-12">
                                    <FontAwesomeIcon icon={faEye} className="w-12 h-12 mb-4 opacity-50" />
                                    <p>No detailed question data available.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="border-t border-white/10 p-4 bg-[#151B24]">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-400">
                                    {reportData?.answer_sheet?.length || 0} questions reviewed
                                </div>
                                <button
                                    onClick={() => setShowQuestionModal(false)}
                                    className="bg-[#7FC241] hover:bg-[#68A335] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Success Overlay */}
            {showPaymentSuccess && (
                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0A1628] border border-[#00E599]/20 rounded-2xl p-8 w-full max-w-lg text-center shadow-2xl">
                        <div className="w-20 h-20 bg-[#00E599]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-[#00E599] text-3xl" />
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
                            <p className="text-white/70 text-lg">
                                Your payment has been processed successfully.
                            </p>
                            {paymentId && (
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
                                    <p className="text-white/60 text-sm mb-1">Payment ID</p>
                                    <p className="text-[#00E599] font-mono text-sm break-all">{paymentId}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                                <div className="w-2 h-2 bg-[#00E599] rounded-full animate-pulse"></div>
                                <span>Processing your certificates...</span>
                            </div>
                            <p className="text-white/50 text-xs">
                                You will be redirected automatically in a few seconds
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Information Modal */}
            {showUserInfoModal && (
                <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-[#00E599]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FontAwesomeIcon icon={faCreditCard} className="text-[#00E599] text-xl" />
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">Complete Your Purchase</h2>
                            <p className="text-white/70 text-sm">Please provide your details to continue</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/70 text-sm mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={userInfo.name}
                                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]/50"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    value={userInfo.email}
                                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]/50"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm mb-2">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    value={userInfo.phone}
                                    onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00E599]/50 focus:border-[#00E599]/50"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUserInfoModal(false)}
                                className="flex-1 px-4 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveUserInfo}
                                disabled={!userInfo.name || !userInfo.email}
                                className="flex-1 px-4 py-3 bg-[#00E599] text-black font-medium rounded-lg hover:bg-[#00E599]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsPageV5;