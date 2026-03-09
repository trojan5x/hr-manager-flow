import { useState, useEffect } from 'react';
import { getAllCertificates, createCertificateRecord, createCertificateDownload, getPaymentAnalytics, type PaymentAnalytics, type DateFilter } from '../services/api';
import type { CertificateRecord } from '../types';
import TopBar from '../components/TopBar';

const AdminDashboard = () => {
    const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics>({
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        successfulPayments: 0
    });

    // Date filter state
    const [dateFilter, setDateFilter] = useState<DateFilter>({});
    const [showDateFilters, setShowDateFilters] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        recipientName: '',
        certificateName: 'Project Management Professional',
        certificateNameShort: 'PMPx',
        skillName: 'Project Management',
        sessionId: '', // ✨ NEW: Manual Session ID
        skillId: '101' // ✨ NEW: For ID generation
    });

    const loadCertificates = async () => {
        setIsLoading(true);
        const data = await getAllCertificates();
        setCertificates(data);
        setIsLoading(false);
    };

    const loadPaymentAnalytics = async () => {
        const analytics = await getPaymentAnalytics(dateFilter);
        setPaymentAnalytics(analytics);
    };

    useEffect(() => {
        loadCertificates();
        loadPaymentAnalytics();
    }, []);

    // Reload analytics when date filter changes
    useEffect(() => {
        loadPaymentAnalytics();
    }, [dateFilter]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({
            ...prev,
            [name]: value || undefined
        }));
    };

    const clearDateFilter = () => {
        setDateFilter({});
    };

    const setCommonDateFilter = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        setDateFilter({
            startDate: startDate.toISOString().slice(0, 16), // Format for datetime-local
            endDate: endDate.toISOString().slice(0, 16)
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sessionId) {
            alert('Session ID is required');
            return;
        }

        setIsGenerating(true);

        // 1. Generate Unique ID in standard format: CERT-{SKILL_ID}-{TIMESTAMP}
        const uniqueId = `CERT-${formData.skillId}-${Date.now()}`;

        try {
            // 2. Create DB Record
            const record = await createCertificateRecord(
                formData.sessionId,
                formData.recipientName,
                formData.certificateName,
                uniqueId,
                { // Metadata
                    skill_name: formData.skillName,
                    certification_name_short: formData.certificateNameShort,
                    manual_entry: true
                }
            );

            if (record) {
                // 3. Trigger Generation (which will update DB with URL)
                const response = await createCertificateDownload(uniqueId, {
                    certification_name: formData.certificateName,
                    certification_name_short: formData.certificateNameShort,
                    recipient_name: formData.recipientName // ✨ NEW: Pass name explicitely
                });

                if (response.result === 'success') {
                    alert('Certificate Created Successfully!');
                    // Reset form (keep session/skill IDs for convenience)
                    setFormData(prev => ({
                        ...prev,
                        recipientName: ''
                    }));
                    loadCertificates();
                } else {
                    alert('Record created but generation failed. Check logs.');
                }
            } else {
                alert('Failed to create database record. Check Session ID validity.');
            }
        } catch (error) {
            console.error('Error in manual creation:', error);
            alert('An error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-white" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            <TopBar>
                <div className="text-xl font-bold flex items-center gap-2">
                    <span className="text-[#98D048]">Admin</span> Dashboard
                </div>
            </TopBar>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex space-x-8">
                        <a
                            href="/admin/certificates"
                            className="py-4 px-1 border-b-2 border-[#98D048] font-medium text-sm text-[#98D048]"
                        >
                            Certificates
                        </a>
                        <a
                            href="/admin/role-generator"
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
                        >
                            Role Generator
                        </a>
                        <a
                            href="/admin/dashboard"
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
                        >
                            Analytics
                        </a>
                        <a
                            href="/admin/user-lookup"
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
                        >
                            User Lookup
                        </a>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Date Filter Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Analytics Filters</h3>
                            <p className="text-sm text-gray-400">Filter analytics data by date and time</p>
                        </div>
                        <button
                            onClick={() => setShowDateFilters(!showDateFilters)}
                            className="px-4 py-2 bg-[#98D048] text-[#021019] rounded-lg font-medium hover:bg-[#98D048]/90 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showDateFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {showDateFilters && (
                        <div className="mt-6 border-t border-white/10 pt-6">
                            {/* Quick Filter Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => setCommonDateFilter(7)}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                                >
                                    Last 7 days
                                </button>
                                <button
                                    onClick={() => setCommonDateFilter(30)}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                                >
                                    Last 30 days
                                </button>
                                <button
                                    onClick={() => setCommonDateFilter(90)}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                                >
                                    Last 3 months
                                </button>
                                <button
                                    onClick={clearDateFilter}
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
                                >
                                    Clear Filter
                                </button>
                            </div>

                            {/* Custom Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={dateFilter.startDate || ''}
                                        onChange={handleDateFilterChange}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={dateFilter.endDate || ''}
                                        onChange={handleDateFilterChange}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                    />
                                </div>
                            </div>

                            {/* Active Filter Indicator */}
                            {(dateFilter.startDate || dateFilter.endDate) && (
                                <div className="mt-4 p-3 bg-[#98D048]/10 border border-[#98D048]/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#98D048]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-[#98D048] font-medium">Active Filter:</span>
                                        {dateFilter.startDate && (
                                            <span className="text-sm text-gray-300">
                                                From {new Date(dateFilter.startDate).toLocaleString()}
                                            </span>
                                        )}
                                        {dateFilter.startDate && dateFilter.endDate && (
                                            <span className="text-sm text-gray-400">to</span>
                                        )}
                                        {dateFilter.endDate && (
                                            <span className="text-sm text-gray-300">
                                                {dateFilter.startDate ? '' : 'Until '}{new Date(dateFilter.endDate).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Payment Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {/* Total Revenue Card */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold text-white">₹{paymentAnalytics.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#98D048]/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#98D048]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Average Order Value Card */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Average Order Value</p>
                                <p className="text-3xl font-bold text-white">₹{paymentAnalytics.averageOrderValue.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Orders Card */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Total Orders</p>
                                <p className="text-3xl font-bold text-white">{paymentAnalytics.totalOrders}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Successful Payments Card */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Successful Payments</p>
                                <p className="text-3xl font-bold text-white">{paymentAnalytics.successfulPayments}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Assessments Card */}
                    {paymentAnalytics.totalAssessments !== undefined && (
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Total Assessments</p>
                                    <p className="text-3xl font-bold text-white">{paymentAnalytics.totalAssessments}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total Certificates Card */}
                    {paymentAnalytics.totalCertificates !== undefined && (
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Total Certificates</p>
                                    <p className="text-3xl font-bold text-white">{paymentAnalytics.totalCertificates}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Conversion Rate Card */}
                    {paymentAnalytics.conversionRate !== undefined && (
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Conversion Rate</p>
                                    <p className="text-3xl font-bold text-white">{paymentAnalytics.conversionRate}%</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Create Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 sticky top-24">
                            <h2 className="text-2xl font-bold mb-6 text-white">Issue Certificate</h2>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Session ID (UUID)</label>
                                    <input
                                        type="text"
                                        name="sessionId"
                                        value={formData.sessionId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white font-mono text-sm"
                                        placeholder="Paste valid Session UUID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Recipient Name</label>
                                    <input
                                        type="text"
                                        name="recipientName"
                                        value={formData.recipientName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Certificate Name</label>
                                    <input
                                        type="text"
                                        name="certificateName"
                                        value={formData.certificateName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Short Code</label>
                                        <input
                                            type="text"
                                            name="certificateNameShort"
                                            value={formData.certificateNameShort}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                            placeholder="e.g. PMPx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Skill ID</label>
                                        <input
                                            type="number"
                                            name="skillId"
                                            value={formData.skillId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                            placeholder="e.g. 101"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className={`w-full py-3 px-4 bg-[#98D048] text-[#021019] rounded-lg font-bold hover:bg-[#98D048]/90 transition-colors ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isGenerating ? 'Generating...' : 'Generate Certificate'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Issued Certificates</h2>
                                <button
                                    onClick={() => {
                                        loadCertificates();
                                        loadPaymentAnalytics();
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    title="Refresh"
                                >
                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#98D048] mx-auto"></div>
                                </div>
                            ) : certificates.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    No certificates issued yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {certificates.map((cert) => (
                                        <div key={cert.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4">
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {cert.status === 'generated' ? (
                                                    <div className="w-10 h-10 rounded-full bg-[#98D048]/20 text-[#98D048] flex items-center justify-center">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                <h3 className="font-bold text-white truncate">{cert.recipient_name}</h3>
                                                <p className="text-sm text-gray-400">{cert.certificate_name}</p>
                                                <p className="text-xs text-gray-500 mt-1 font-mono">{cert.unique_certificate_id}</p>
                                                <p className="text-xs text-gray-500">{new Date(cert.created_at).toLocaleDateString()}</p>
                                            </div>

                                            {/* Actions */}
                                            {(cert.image_url && cert.status === 'generated') && (
                                                <div className="flex gap-2">
                                                    <a
                                                        href={cert.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-sm text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                                                        title="Open in new tab"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        View
                                                    </a>
                                                    <button
                                                        onClick={async () => {
                                                            if (!cert.image_url) return;
                                                            try {
                                                                const response = await fetch(cert.image_url);
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                // Use recipient name and cert type for filename
                                                                const cleanName = cert.recipient_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                                                const cleanCert = cert.certificate_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                                                link.download = `${cleanName}-${cleanCert}.png`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (e) {
                                                                console.error('Download failed', e);
                                                                window.open(cert.image_url, '_blank');
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-[#98D048] hover:bg-[#98D048]/90 text-sm text-[#021019] font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                                                        title="Download Image"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
