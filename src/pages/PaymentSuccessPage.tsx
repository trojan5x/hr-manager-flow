import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { fetchDeliverables, createCertificateDownload, generateCertificateImages, getUserCertificates } from '../services/api';
import type { DeliverableItem } from '../types';
import { analytics } from '../services/analytics';
import { getUserEmail, getUserName, getStoredSessionId } from '../utils/localStorage';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingCertificates, setIsGeneratingCertificates] = useState(false);
    const [certificateGenerationStatus, setCertificateGenerationStatus] = useState<string>('');
    const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
    const [_error, setError] = useState<string | null>(null);
    const [purchasedItems, setPurchasedItems] = useState<DeliverableItem[]>([]);

    // Prefetching State
    const [preparedData, setPreparedData] = useState<Record<string, string>>({});
    const [preparingIds, setPreparingIds] = useState<Set<string>>(new Set());

    // Get params
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');
    const sessionId = searchParams.get('session_id');

    // Certificate image generation effect
    useEffect(() => {
        if (!sessionId) return;

        const loadAndGenerateImages = async () => {
            console.log('PaymentSuccess: Loading certificate records...');
            setIsGeneratingCertificates(true);
            setCertificateGenerationStatus('Loading your certificates...');
            
            try {
                // Step 1: Load existing certificate records (should exist from webhook processing)
                const userCertificates = await getUserCertificates(sessionId);
                
                if (!userCertificates || userCertificates.length === 0) {
                    console.log('PaymentSuccess: No certificate records found, using fallback...');
                    setCertificateGenerationStatus('Setting up certificates...');
                    loadFallbackDeliverables();
                    return;
                }

                console.log(`PaymentSuccess: Found ${userCertificates.length} certificate records`);

                // Step 2: Display certificates immediately (even if images aren't ready yet)
                displayCertificates(userCertificates);

                // Step 3: Check which certificates need image generation
                const certificatesNeedingImages = userCertificates.filter((cert: any) => cert.needs_generation);
                
                if (certificatesNeedingImages.length > 0) {
                    console.log(`PaymentSuccess: ${certificatesNeedingImages.length} certificates need image generation`);
                    setCertificateGenerationStatus(`Generating ${certificatesNeedingImages.length} certificate images...`);
                    
                    // Step 4: Generate images for certificates that need them
                    const imageGenResult = await generateCertificateImages(sessionId);
                    
                    if (imageGenResult.success) {
                        setCertificateGenerationStatus(
                            `Generated ${imageGenResult.certificates_generated} new images, ${imageGenResult.certificates_up_to_date} already ready!`
                        );
                        console.log('PaymentSuccess: Image generation completed:', imageGenResult);
                    } else {
                        setCertificateGenerationStatus('Some certificate images may not be ready. Please try refreshing.');
                        console.warn('PaymentSuccess: Image generation had issues:', imageGenResult);
                    }

                    // Step 5: Reload certificates with updated images
                    setTimeout(async () => {
                        const updatedCertificates = await getUserCertificates(sessionId);
                        displayCertificates(updatedCertificates);
                    }, 1000);
                } else {
                    setCertificateGenerationStatus('All certificate images are ready!');
                    console.log('PaymentSuccess: All certificates already have valid images');
                }
                
            } catch (error) {
                console.error('PaymentSuccess: Certificate loading/generation failed:', error);
                setCertificateGenerationStatus('Certificate processing failed. Please contact support.');
                // Fall back to the old system
                loadFallbackDeliverables();
            } finally {
                setIsGeneratingCertificates(false);
            }
        };

        // Start the process
        loadAndGenerateImages();
    }, [sessionId]);

    const displayCertificates = (userCertificates: any[]) => {
        const mappedItems: DeliverableItem[] = userCertificates.map((cert: any) => ({
            id: cert.id,
            created_at: new Date(cert.issued_at).getTime(),
            skill_name: cert.role_certificates?.name || 'Professional Certification',
            certification_name: cert.role_certificates?.certificate_name || cert.role_certificates?.name,
            certification_name_short: cert.role_certificates?.short_name || 'CERT',
            unique_certificate_id: cert.certificate_id,
            certificate_image_url: cert.certificate_image_url,
            certificate_expires_at: cert.certificate_image_expires_at,
            status: cert.status,
            needs_generation: cert.needs_generation,
            image_expired: cert.image_expired
        }));

        setPurchasedItems(mappedItems);
        console.log('PaymentSuccess: Displaying certificates:', mappedItems.length);
    };

    const loadFallbackDeliverables = async () => {
        // Fallback to the existing deliverables system
        try {
            const userName = getUserName() || 'Valued Professional';
            const response = await fetchDeliverables(orderId || '', sessionId || undefined, userName);

            if (response.result === 'success') {
                setPurchasedItems(response.data);
                console.log('PaymentSuccess: Loaded fallback deliverables:', response.data.length);
            } else {
                setError('Unable to fetch deliverables details.');
            }
        } catch (err) {
            console.error('PaymentSuccess: Fallback deliverables failed:', err);
            setError('Failed to load certificate details.');
        }
    };

    // Load deliverables list
    useEffect(() => {
        // Register session if available
        const currentSessionId = getStoredSessionId();
        if (currentSessionId) {
            analytics.register({ session_id: currentSessionId });
            analytics.setSessionId(currentSessionId);
            
            if (import.meta.env.DEV) {
                console.log('[PaymentSuccessPage] 📝 Registered session with analytics:', currentSessionId.slice(0, 8) + '...');
            }
        }
        
        if (orderId) {
            analytics.track('view_payment_success', {
                payment_id: paymentId,
                order_id: orderId
            });
        }

        // Set loading to false once certificate generation starts
        // The certificate generation effect will handle the actual loading
        setIsLoading(false);
    }, [orderId, paymentId]);

    // Background pre-fetch of certificates
    useEffect(() => {
        if (purchasedItems.length === 0) return;

        const prepareAllDownloads = async () => {
            const itemsToFetch = purchasedItems.filter(
                item => !preparedData[item.unique_certificate_id] && !preparingIds.has(item.unique_certificate_id)
            );

            if (itemsToFetch.length === 0) return;

            // Mark as preparing
            setPreparingIds(prev => {
                const update = new Set(prev);
                itemsToFetch.forEach(item => update.add(item.unique_certificate_id));
                return update;
            });

            // Process sequentially or parallel? Parallel for speed.
            await Promise.all(itemsToFetch.map(async (item) => {
                try {
                    // 1. Call API to generate/get link
                    const response = await createCertificateDownload(item.unique_certificate_id, item);

                    if (response.result === 'success' && response.data.certificate_image_link) {
                        try {
                            // 2. Fetch the image blob
                            const imageResponse = await fetch(response.data.certificate_image_link);
                            const blob = await imageResponse.blob();
                            const blobUrl = window.URL.createObjectURL(blob);

                            // 3. Store in state
                            setPreparedData(prev => ({
                                ...prev,
                                [item.unique_certificate_id]: blobUrl
                            }));
                        } catch (blobErr) {
                            console.warn(`Failed to pre-fetch blob for ${item.unique_certificate_id}`, blobErr);
                            // Even if blob fails, we might still store the link? 
                            // Current design relies on blobUrl. If blob fails, we just don't store as prepared,
                            // so button will fall back to normal flow (which might retry or use direct link).
                        }
                    }
                } catch (err) {
                    console.error(`Failed to pre-prepare download for ${item.unique_certificate_id}`, err);
                } finally {
                    // Remove from preparing set
                    setPreparingIds(prev => {
                        const update = new Set(prev);
                        update.delete(item.unique_certificate_id);
                        return update;
                    });
                }
            }));
        };

        prepareAllDownloads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchasedItems]); // run when items are loaded

    const handleDownload = async (item: DeliverableItem) => {
        if (downloadingCertId) return; // Prevent multiple downloads at once

        // If certificate has direct image URL and is already generated, use it
        if ((item as any).certificate_image_url && (item as any).status === 'generated') {
            try {
                const imageResponse = await fetch((item as any).certificate_image_url);
                const blob = await imageResponse.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${item.certification_name.replace(/\s+/g, '_')}_Certificate.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                analytics.track('certificate_downloaded', {
                    certification_name: item.certification_name,
                    unique_certificate_id: item.unique_certificate_id,
                    download_method: 'direct_url'
                });
                return;
            } catch (error) {
                console.warn('Failed to download via direct URL, falling back to API:', error);
                // Fall through to existing logic
            }
        }

        // If already prepared, use it instantly!
        if (preparedData[item.unique_certificate_id]) {
            const url = preparedData[item.unique_certificate_id];
            const link = document.createElement('a');
            link.href = url;
            link.download = `${item.certification_name.replace(/\s+/g, '_')}_Certificate.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            analytics.track('certificate_downloaded', {
                certification_name: item.certification_name,
                unique_certificate_id: item.unique_certificate_id,
                download_method: 'prefetch'
            });
            return;
        }

        // Fallback: Standard flow if not ready
        setDownloadingCertId(item.unique_certificate_id);
        try {
            const response = await createCertificateDownload(item.unique_certificate_id, item);
            if (response.result === 'success' && response.data.certificate_image_link) {
                try {
                    // Fetch the image as a blob to force download (works better for cross-origin URLs)
                    const imageResponse = await fetch(response.data.certificate_image_link);
                    const blob = await imageResponse.blob();
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    // Ensure the filename ends with .png or appropriate extension
                    link.download = `${item.certification_name.replace(/\s+/g, '_')}_Certificate.png`;
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);

                    analytics.track('certificate_downloaded', {
                        certification_name: item.certification_name,
                        unique_certificate_id: item.unique_certificate_id,
                        download_method: 'on_demand'
                    });
                } catch (fetchError) {
                    console.warn('Failed to fetch image blob, falling back to new tab:', fetchError);
                    // Fallback to simple link click if fetch fails (e.g. CORS)
                    const link = document.createElement('a');
                    link.href = response.data.certificate_image_link;
                    link.download = `${item.certification_name}.png`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                alert('Could not generate certificate download link.');
            }
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download certificate. Please try again.');
        } finally {
            setDownloadingCertId(null);
        }
    };

    if (isLoading || isGeneratingCertificates) {
        return (
            <div className="min-h-screen text-white font-sans flex items-center justify-center" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#98D048] mx-auto mb-4"></div>
                    <p className="text-gray-300">
                        {isGeneratingCertificates ? certificateGenerationStatus || 'Generating your certificates...' : 'Verifying payment...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans pt-4 pb-8 overflow-x-hidden flex flex-col" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            {/* Top Bar with Logos */}
            <TopBar className="pt-2 lg:pt-4 xl:pt-6">
                <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 animate-fade-in-up w-full">
                    <img src="/assets/learntube-logo.svg" alt="LearnTube.ai" className="h-10 md:h-14 lg:h-16 xl:h-18 max-w-[45%] object-contain" />
                    <div className="h-10 md:h-14 lg:h-16 xl:h-18 w-px bg-gray-600/50 flex-shrink-0"></div>
                    <img src="/assets/backed-by-google.svg" alt="Google for Startups" className="h-8 md:h-12 lg:h-14 xl:h-16 max-w-[45%] object-contain" />
                </div>
            </TopBar>

            {/* Main Content */}
            <div className="flex-1 px-4 md:px-6 lg:px-8 xl:px-12 py-8">
                <div className="w-full max-w-4xl mx-auto">

                    {/* Payment Received Card */}
                    <div className="mb-12 animate-fade-in-up">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
                            {/* Success Icon */}
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-[#98D048] rounded-full flex items-center justify-center animate-fade-in-scale animation-delay-200">
                                    <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#021019]">
                                        <path
                                            d="M20 52l16 16 32-32"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Main Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#98D048] to-white bg-clip-text text-transparent animate-fade-in-up animation-delay-300">
                                Payment Received
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg md:text-xl text-gray-300 animate-fade-in-up animation-delay-400">
                                We have received the payment, your certificates are on the way!
                            </p>
                            {paymentId && (
                                <p className="text-sm text-gray-500 mt-2 animate-fade-in-up animation-delay-500">
                                    Ref: {paymentId}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Certificates Section */}
                    {purchasedItems.length > 0 && (
                        <div className="animate-fade-in-up animation-delay-600">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                                    Your Certificates are Ready!
                                </h2>
                                <p className="text-gray-300 text-lg">
                                    {purchasedItems.length === 1
                                        ? 'Your certificate is now available for download and sharing.'
                                        : `All ${purchasedItems.length} certificates are now available for download and sharing.`
                                    }
                                </p>
                            </div>

                            {/* Certificates Grid */}
                            <div className="grid gap-4 md:gap-6">
                                {purchasedItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`relative z-10 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-300 animate-fade-in-up`}
                                        style={{ animationDelay: `${800 + (index * 100)}ms` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex items-center gap-4 flex-1 w-full">
                                                {/* Smaller Certificate Thumbnail */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-[#98D048] rounded-lg flex items-center justify-center">
                                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#021019]">
                                                            <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                            <path fill="currentColor" d="M8,12V14H16V12H8M8,16V18H13V16H8Z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Certificate Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-white mb-1">{item.certification_name}</h3>
                                                    <p className="text-[#98D048] font-medium text-sm">{item.skill_name}</p>
                                                    {/* Show certificate status if available */}
                                                    {(item as any).status && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Status: {(item as any).status === 'generated' ? 'Ready' : 
                                                                    (item as any).status === 'pending' ? 'Processing' : 'Failed'}
                                                            {/* Show expiry info for generated certificates */}
                                                            {(item as any).status === 'generated' && (item as any).certificate_expires_at && (
                                                                <span className="ml-2">
                                                                    • Expires {new Date((item as any).certificate_expires_at).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {/* Show if image expired */}
                                                            {(item as any).image_expired && (
                                                                <span className="ml-2 text-yellow-400">• Image expired, regenerating...</span>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Download Button */}
                                            <div className="flex-shrink-0 w-full sm:w-auto">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Prevent click if preparing
                                                        if (preparingIds.has(item.unique_certificate_id)) return;
                                                        handleDownload(item);
                                                    }}
                                                    disabled={downloadingCertId === item.unique_certificate_id || preparingIds.has(item.unique_certificate_id)}
                                                    style={{ pointerEvents: 'auto' }}
                                                    className={`w-full sm:w-auto relative z-30 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-[#98D048] text-[#021019] rounded-lg font-medium hover:bg-[#98D048]/90 transition-colors text-sm ${(downloadingCertId === item.unique_certificate_id || preparingIds.has(item.unique_certificate_id))
                                                        ? 'opacity-75 cursor-not-allowed'
                                                        : ''
                                                        }`}
                                                >
                                                    {(downloadingCertId === item.unique_certificate_id || preparingIds.has(item.unique_certificate_id)) ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#021019]"></div>
                                                    ) : (
                                                        <svg viewBox="0 0 24 24" className="w-4 h-4">
                                                            <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                                            <path fill="currentColor" d="M12,15L9,12H11V8H13V12H15L12,15Z" />
                                                        </svg>
                                                    )}
                                                    {(downloadingCertId === item.unique_certificate_id || preparingIds.has(item.unique_certificate_id)) ? 'Preparing...' : 'Download'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* What Next Section */}
                    <div className="mt-16 animate-fade-in-up animation-delay-1000">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">What next?</h2>
                            <p className="text-lg text-gray-300 mb-8">
                                Now that you got certified, let's start sharing them around to showcase your proficiency.
                            </p>

                            {/* Action Items List */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#98D048] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#021019]">
                                            <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                        </svg>
                                    </div>
                                    <p className="text-white">
                                        You will receive certificates on <span className="text-[#98D048] font-medium">{getUserEmail() || 'your email'}</span> in next 10 minutes.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#98D048] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-[#98D048]"></div>
                                    </div>
                                    <p className="text-white">
                                        Share you certificates on LinkedIn and add them to your resume. Don't forget to tag us.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#98D048] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-[#98D048]"></div>
                                    </div>
                                    <p className="text-white">
                                        You will receive details about your Career Advancement Toolkit soon on your email.
                                    </p>
                                </div>
                            </div>

                            {/* Recommended Bundles Section - Hidden for now
                            <div className="border-t border-white/20 pt-8">
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Build More Credibility</h3>
                                <p className="text-gray-300 mb-6">
                                    Complete these additional certification bundles to enhance your professional profile and stand out in your field.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="text-xl font-bold text-white mb-2">HR Leadership Bundle</h4>
                                                <p className="text-[#98D048] text-sm font-medium mb-3">3 Premium Certifications</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        SHRM-CP
                                                    </span>
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        CIPD Level 7
                                                    </span>
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        PHRi
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="text-sm text-gray-400 line-through">₹5,997</div>
                                                <div className="text-2xl font-bold text-[#98D048]">₹4,797</div>
                                                <div className="text-xs text-[#98D048]">20% OFF</div>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                                            Master strategic HR leadership with comprehensive certifications covering global practices, organizational development, and business partnership.
                                        </p>
                                        <button className="w-full bg-[#406AFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#406AFF]/90 transition-colors text-sm">
                                            Explore Bundle
                                        </button>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="text-xl font-bold text-white mb-2">Strategic Management Bundle</h4>
                                                <p className="text-[#98D048] text-sm font-medium mb-3">3 Executive Certifications</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        PMPx
                                                    </span>
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        SPHR
                                                    </span>
                                                    <span className="px-2 py-1 bg-[#98D048]/10 text-[#98D048] text-xs rounded-md border border-[#98D048]/20">
                                                        CPHRx
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="text-sm text-gray-400 line-through">₹5,997</div>
                                                <div className="text-2xl font-bold text-[#98D048]">₹4,797</div>
                                                <div className="text-xs text-[#98D048]">20% OFF</div>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                                            Advance your career with strategic management expertise, covering project leadership, senior HR strategy, and succession planning.
                                        </p>
                                        <button className="w-full bg-[#406AFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#406AFF]/90 transition-colors text-sm">
                                            Explore Bundle
                                        </button>
                                    </div>
                                </div>
                            </div>
                            */}
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="mt-16 md:mt-32 animate-fade-in-up animation-delay-1200">
                        <div className="bg-gradient-to-r from-[#00385C] to-[#001C2C] border border-white/20 rounded-2xl p-4 md:p-6 relative overflow-visible">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 pr-4 py-2">
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
                                        Facing issues with downloading certificates?
                                    </h3>
                                    <p className="text-base text-gray-300">
                                        Send a mail to <a href="mailto:hello@careerninja.in" className="text-[#98D048] font-medium hover:underline">hello@careerninja.in</a>
                                    </p>
                                </div>
                                <div className="flex-shrink-0 -mr-4 md:-mr-8 -mt-4 md:-mt-8 -mb-3 md:-mb-6">
                                    {/* Ninja Character - Popping out */}
                                    <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center -mt-8 md:-mt-24">
                                        <img
                                            src="/assets/ninja-support.png"
                                            alt="Career Ninja Support"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2398D048' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
