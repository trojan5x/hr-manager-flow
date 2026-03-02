
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { PaymentAnalytics } from '../../services/api';
import TopBar from '../../components/TopBar';

interface FunnelStep {
    id: string;
    label: string;
    count: number;
    dropoff?: number;
    conversion?: number;
}

const FunnelDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics>({
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        successfulPayments: 0
    });

    // Filter State
    const [filters, setFilters] = useState({
        utmSource: '',
        utmMedium: '',
        role: ''
    });

    // Available roles state
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [showRoleBreakdown, setShowRoleBreakdown] = useState(false);
    const [roleBreakdownData, setRoleBreakdownData] = useState<any[]>([]);

    useEffect(() => {
        fetchAvailableRoles();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Initial load only

    const fetchAvailableRoles = async () => {
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('role')
                .not('role', 'is', null);

            if (error) {
                console.warn('Error fetching available roles:', error);
                return;
            }

            // Get unique roles
            const uniqueRoles = [...new Set(data?.map(item => item.role).filter(Boolean))];
            setAvailableRoles(uniqueRoles.sort());
        } catch (error) {
            console.warn('Exception fetching roles:', error);
        }
    };

    const fetchRoleBreakdownData = async () => {
        try {
            console.log('Fetching role breakdown data...');
            const roleBreakdown = [];

            for (const role of availableRoles) {
                // Create a fresh query for each role
                let roleSessionQuery = supabase.from('sessions').select('*', { count: 'exact' });
                
                // Apply filters
                if (filters.utmSource) {
                    roleSessionQuery = roleSessionQuery.ilike('utm_source', `%${filters.utmSource}%`);
                }
                if (filters.utmMedium) {
                    roleSessionQuery = roleSessionQuery.ilike('utm_medium', `%${filters.utmMedium}%`);
                }
                
                // Add role filter
                roleSessionQuery = roleSessionQuery.eq('role', role);

                const { data: roleSessions, count: roleSessionCount } = await roleSessionQuery;

                if (!roleSessions) continue;

                const sessionIds = roleSessions.map(s => s.id.toString()); // Convert to strings for tracking_events queries

                // Get role-specific events
                const getUniqueSessionCountForRole = async (eventName: string, filterFn?: (evt: any) => boolean) => {
                    if (sessionIds.length === 0) return 0;

                    const { data } = await supabase
                        .from('tracking_events')
                        .select('session_id, event_data')
                        .eq('event_name', eventName)
                        .in('session_id', sessionIds)
                        .limit(5000);

                    if (!data) return 0;

                    const uniqueSessions = new Set();
                    data.forEach((evt: any) => {
                        if (evt.session_id && (!filterFn || filterFn(evt))) {
                            uniqueSessions.add(evt.session_id);
                        }
                    });
                    return uniqueSessions.size;
                };

                // Calculate role-specific metrics
                const beginCount = await getUniqueSessionCountForRole('click_begin_assessment');
                const completedCount = await getUniqueSessionCountForRole('assessment_completed');
                const paymentCount = await getUniqueSessionCountForRole('payment_success');

                // Get role-specific contact submissions (sessions with user_id)
                const contactCount = roleSessions.filter(s => s.user_id).length;

                // Get role-specific passed sessions from user_assessments
                const { count: passedCount } = await supabase
                    .from('user_assessments')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_passed', true)
                    .in('session_id', sessionIds.map(id => parseInt(id, 10)));

                // Calculate revenue for this role from orders table
                const roleOrdersQuery = await supabase
                    .from('orders')
                    .select('amount, status')
                    .eq('status', 'paid')
                    .in('session_id', sessionIds.map(id => parseInt(id, 10)));

                const { data: roleOrders } = roleOrdersQuery;
                const roleRevenue = (roleOrders || []).reduce((sum, order) => sum + parseFloat(order.amount || '0'), 0);
                const rolePaidCount = (roleOrders || []).length;
                const roleAOV = rolePaidCount > 0 ? roleRevenue / rolePaidCount : 0;

                roleBreakdown.push({
                    role,
                    sessions: roleSessionCount || 0,
                    beginAssessment: beginCount,
                    completed: completedCount,
                    contactSubmitted: contactCount,
                    passed: passedCount || 0,
                    paymentInitiated: paymentCount,
                    revenue: roleRevenue,
                    paidOrders: rolePaidCount,
                    aov: roleAOV,
                    conversionRate: (roleSessionCount || 0) > 0 ? ((completedCount / (roleSessionCount || 1)) * 100).toFixed(1) : '0.0'
                });
            }

            setRoleBreakdownData(roleBreakdown);
            console.log('Role breakdown data fetched:', roleBreakdown);
        } catch (error) {
            console.error('Error fetching role breakdown:', error);
        }
    };

    const handleRefresh = () => {
        fetchData();
        if (showRoleBreakdown) {
            fetchRoleBreakdownData();
        }
    };

    // Effect to fetch role breakdown data when view changes
    useEffect(() => {
        if (showRoleBreakdown && availableRoles.length > 0) {
            fetchRoleBreakdownData();
        }
    }, [showRoleBreakdown, availableRoles, filters.utmSource, filters.utmMedium]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Sessions (Base for filtering)
            let sessionQuery = supabase.from('sessions').select('*', { count: 'exact', head: false });

            if (filters.utmSource) {
                sessionQuery = sessionQuery.ilike('utm_source', `%${filters.utmSource}%`);
            }
            if (filters.utmMedium) {
                sessionQuery = sessionQuery.ilike('utm_medium', `%${filters.utmMedium}%`);
            }
            if (filters.role) {
                sessionQuery = sessionQuery.eq('role', filters.role);
            }

            // We need session IDs if filtering, otherwise we can just count
            // Fetching IDs for event filtering
            const { data: sessionData, count: sessionCount, error: sessionError } = await sessionQuery.select('id');

            if (sessionError) throw sessionError;

            // Extract matching Session IDs and convert to strings (since tracking_events.session_id is text)
            const matchingSessionIds = sessionData?.map(s => s.id.toString()) || [];

            // If filters are active but no sessions found, everything is 0
            const hasActiveFilters = filters.utmSource || filters.utmMedium || filters.role;
            if (hasActiveFilters && matchingSessionIds.length === 0) {
                setFunnelData([]);
                setLoading(false);
                return;
            }

            // 2. Fetch specific events for funnel
            // 2. Fetch specific events for funnel - UNIQUE SESSION COUNTS ONLY
            // We'll use a single helper that always counts unique sessions for a given event name
            const getUniqueSessionCount = async (eventName: string, filterFn?: (evt: any) => boolean) => {
                let query = supabase
                    .from('tracking_events')
                    .select('session_id, event_data') // event_data contains the properties
                    .eq('event_name', eventName);

                if (hasActiveFilters) {
                    query = query.in('session_id', matchingSessionIds);
                }

                // We fetch up to a limit. For high volume, a raw SQL query or DB function is better, but this fits the pattern.
                // 5000 events is a reasonable sample for a dashboard unless scaling >10k sessions.
                const { data } = await query.limit(5000);

                if (!data) return 0;

                const uniqueSessions = new Set();
                data.forEach((evt: any) => {
                    if (evt.session_id && (!filterFn || filterFn(evt))) {
                        uniqueSessions.add(evt.session_id);
                    }
                });
                return uniqueSessions.size;
            };

            // Helper to get UNIQUE Phase completion counts
            const getPhaseUniqueCounts = async () => {
                let query = supabase
                    .from('tracking_events')
                    .select('event_data, session_id')
                    .eq('event_name', 'phase_completed');

                if (hasActiveFilters) {
                    query = query.in('session_id', matchingSessionIds);
                }

                const { data } = await query.limit(5000);

                const phaseSets = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };

                data?.forEach((evt: any) => {
                    const p = evt.event_data?.phase_number;
                    const pid = p as keyof typeof phaseSets;
                    if (p && phaseSets[pid] && evt.session_id) {
                        phaseSets[pid].add(evt.session_id);
                    }
                });

                return {
                    1: phaseSets[1].size,
                    2: phaseSets[2].size,
                    3: phaseSets[3].size,
                    4: phaseSets[4].size,
                    5: phaseSets[5].size
                };
            };

            // Get "Contact Submitted"
            // If sessions table logic, we just check our previously fetched sessionData
            const getContactCount = async () => {
                // Since we already fetched matching sessions (or all) in step 1, we could filter in memory?
                // But efficient data fetching for "count" if ID list is huge is better via DB.
                // However, user_id not null check.

                let query = supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .not('user_id', 'is', null);

                if (filters.utmSource) query = query.ilike('utm_source', `%${filters.utmSource}%`);
                if (filters.utmMedium) query = query.ilike('utm_medium', `%${filters.utmMedium}%`);
                if (filters.role) query = query.eq('role', filters.role);

                const { count } = await query;
                return count || 0;
            };

            // Get Passed Count
            const getPassedCount = async () => {
                // Query user_assessments table for sessions with is_passed = true
                let query = supabase
                    .from('user_assessments')
                    .select('session_id', { count: 'exact', head: true })
                    .eq('is_passed', true);

                // If we have filtered session IDs, only count those
                if (hasActiveFilters) {
                    // Convert matchingSessionIds back to numbers for user_assessments.session_id (bigint)
                    const sessionIdNumbers = matchingSessionIds.map(id => parseInt(id, 10));
                    query = query.in('session_id', sessionIdNumbers);
                }

                const { count } = await query;
                return count || 0;
            };

            const [
                beginCount,
                startCount,
                phaseCounts,
                completedCount,
                passedCount,
                contactCount,
                paymentCount,
                paidCount
            ] = await Promise.all([
                getUniqueSessionCount('click_begin_assessment'), // Correct
                getUniqueSessionCount('phase_started', (e) => e.event_data?.phase_number === 1), // Only count Phase 1 as "Started Assessment"
                getPhaseUniqueCounts(),
                getUniqueSessionCount('assessment_completed'),
                getPassedCount(),
                getContactCount(), // Use sessions.user_id check for historical accuracy
                getUniqueSessionCount('payment_initiated'),
                getUniqueSessionCount('payment_success')
            ]);

            const steps: FunnelStep[] = [
                { id: 'sessions', label: 'Total Sessions', count: sessionCount || 0 },
                { id: 'begin', label: 'Clicked Begin Assessment', count: beginCount },
                { id: 'started', label: 'Started Assessment', count: startCount },
                { id: 'phase1', label: 'Completed Phase 1', count: phaseCounts[1] },
                { id: 'phase2', label: 'Completed Phase 2', count: phaseCounts[2] },
                { id: 'phase3', label: 'Completed Phase 3', count: phaseCounts[3] },
                { id: 'phase4', label: 'Completed Phase 4', count: phaseCounts[4] },
                { id: 'completed', label: 'Assessment Complete', count: completedCount },
                { id: 'contact', label: 'Submitted Contact', count: contactCount },
                { id: 'passed', label: 'Passed (>50%)', count: passedCount },
                { id: 'pay_click', label: 'Initiated Payment', count: paymentCount },
                { id: 'paid', label: 'Payment Success', count: paidCount }
            ];

            // Calculate metrics
            const processedSteps = steps.map((step, index) => {
                if (index === 0) return { ...step, conversion: 100 };
                // Compare to previous step for conversion
                const prev = steps[index - 1];
                // For phases, ideally compare to previous phase, which works in this sequential list.
                // For Assessment Complete, compare to Phase 5.
                // For Contact, compare to Assessment Complete.
                // For Pay, Contact.
                // Logic holds for simple sequential funnel.

                const conv = prev.count > 0 ? ((step.count / prev.count) * 100).toFixed(1) : '0';
                return { ...step, conversion: Number(conv) };
            });

            setFunnelData(processedSteps);

            // Fetch recent raw events for debugging
            const { data: events } = await supabase
                .from('tracking_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setRecentEvents(events || []);

            // Calculate Payment Analytics with UTM and Role Filters
            // Query orders table for actual payment data, joined with sessions for filtering
            let paymentQuery = supabase
                .from('orders')
                .select(`
                    amount, 
                    status,
                    razorpay_payment_id,
                    sessions!inner(
                        id,
                        role,
                        utm_source,
                        utm_medium
                    )
                `)
                .eq('status', 'paid')
                .not('amount', 'is', null);

            // Apply role filter to the joined sessions data
            if (filters.role) {
                paymentQuery = paymentQuery.eq('sessions.role', filters.role);
            }

            // Apply UTM filters to the joined sessions data
            if (filters.utmSource) {
                paymentQuery = paymentQuery.ilike('sessions.utm_source', `%${filters.utmSource}%`);
            }
            if (filters.utmMedium) {
                paymentQuery = paymentQuery.ilike('sessions.utm_medium', `%${filters.utmMedium}%`);
            }

            const { data: paymentData, error: paymentError } = await paymentQuery;

            if (!paymentError && paymentData) {
                const successfulPayments = paymentData.length;
                const totalRevenue = paymentData.reduce((sum, order) => sum + parseFloat(order.amount || '0'), 0);
                const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

                setPaymentAnalytics({
                    totalRevenue,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                    totalOrders: successfulPayments,
                    successfulPayments
                });
            } else {
                console.error('Payment analytics error:', paymentError);
                // Reset to zero if error or no data
                setPaymentAnalytics({
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    totalOrders: 0,
                    successfulPayments: 0
                });
            }

        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-white" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            <TopBar>
                <div className="text-xl font-bold flex items-center gap-2">
                    <span className="text-[#98D048]">Analytics</span> Dashboard
                </div>
            </TopBar>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex space-x-8">
                        <a
                            href="/admin/certificates"
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
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
                            className="py-4 px-1 border-b-2 border-[#98D048] font-medium text-sm text-[#98D048]"
                        >
                            Analytics
                        </a>
                    </nav>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold flex-shrink-0">User Funnel Dashboard</h1>
                        
                        {/* View Toggle */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">View:</span>
                            <button
                                onClick={() => setShowRoleBreakdown(false)}
                                className={`px-3 py-1 rounded transition-colors ${!showRoleBreakdown ? 'bg-[#98D048] text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                Overall
                            </button>
                            <button
                                onClick={() => setShowRoleBreakdown(true)}
                                className={`px-3 py-1 rounded transition-colors ${showRoleBreakdown ? 'bg-[#98D048] text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                Role Breakdown
                            </button>
                        </div>
                    </div>

                    {/* Filters & Refresh */}
                    <div className="flex flex-col md:flex-row gap-3 bg-[#0B2A3D] p-3 rounded-lg border border-gray-700">
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                            className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#98D048] min-w-[120px]"
                        >
                            <option value="">All Roles</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="UTM Source..."
                            value={filters.utmSource}
                            onChange={(e) => setFilters(prev => ({ ...prev, utmSource: e.target.value }))}
                            className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#98D048]"
                        />
                        <input
                            type="text"
                            placeholder="UTM Medium..."
                            value={filters.utmMedium}
                            onChange={(e) => setFilters(prev => ({ ...prev, utmMedium: e.target.value }))}
                            className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#98D048]"
                        />
                        <button
                            onClick={handleRefresh}
                            className="bg-[#98D048] hover:bg-[#7AB93D] text-black px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-[#98D048] border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-gray-400">Loading Funnel Metrics...</span>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {showRoleBreakdown ? (
                            // Role Breakdown View
                            <>
                                {/* Role Breakdown Overview Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {(() => {
                                        const totalSessions = roleBreakdownData.reduce((sum, role) => sum + role.sessions, 0);
                                        const totalRevenue = roleBreakdownData.reduce((sum, role) => sum + role.revenue, 0);
                                        const totalCompleted = roleBreakdownData.reduce((sum, role) => sum + role.completed, 0);
                                        const totalPaid = roleBreakdownData.reduce((sum, role) => sum + role.paidOrders, 0);
                                        const avgConversion = totalSessions > 0 ? ((totalCompleted / totalSessions) * 100).toFixed(1) : '0.0';
                                        const avgAOV = totalPaid > 0 ? (totalRevenue / totalPaid).toFixed(0) : '0';
                                        
                                        return [
                                            { label: 'Total Roles', value: availableRoles.length, sub: 'Active Roles' },
                                            { label: 'Total Sessions', value: totalSessions, sub: 'All Roles Combined' },
                                            { label: 'Avg Conversion', value: `${avgConversion}%`, sub: 'Completion Rate' },
                                            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'All Roles', highlight: true },
                                            { label: 'Total Completed', value: totalCompleted, sub: 'Assessments Done' },
                                            { label: 'Paid Orders', value: totalPaid, sub: 'Successful Payments' },
                                            { label: 'Avg AOV', value: `₹${avgAOV}`, sub: 'Cross-Role Average', highlight: true },
                                            { label: 'Best Performer', value: roleBreakdownData.length > 0 ? roleBreakdownData.sort((a, b) => b.sessions - a.sessions)[0]?.role || 'N/A' : 'N/A', sub: 'By Sessions', highlight: true }
                                        ].map((stat, i) => (
                                            <div key={i} className={`bg-[#0B2A3D] rounded-xl p-4 border ${stat.highlight ? 'border-[#98D048]/50 bg-[#98D048]/10' : 'border-gray-700'}`}>
                                                <div className="text-gray-400 text-xs uppercase font-semibold mb-1">{stat.label}</div>
                                                <div className={`text-2xl font-bold ${stat.highlight ? 'text-[#98D048]' : 'text-white'}`}>{stat.value}</div>
                                                <div className="text-gray-500 text-xs font-medium mt-2">{stat.sub || '-'}</div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Role Performance Chart */}
                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Role Performance Comparison</h2>
                                    <div className="space-y-4">
                                        {roleBreakdownData.map((roleData) => {
                                            const maxSessions = Math.max(...roleBreakdownData.map(r => r.sessions));
                                            const maxRevenue = Math.max(...roleBreakdownData.map(r => r.revenue));
                                            const sessionWidth = maxSessions > 0 ? (roleData.sessions / maxSessions) * 100 : 0;
                                            const revenueWidth = maxRevenue > 0 ? (roleData.revenue / maxRevenue) * 100 : 0;
                                            
                                            return (
                                                <div key={roleData.role} className="bg-black/20 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="font-semibold text-white">{roleData.role}</h3>
                                                        <div className="text-sm text-gray-400">
                                                            {roleData.conversionRate}% conversion
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Sessions Bar */}
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>Sessions</span>
                                                            <span>{roleData.sessions}</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                                                                style={{ width: `${sessionWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Revenue Bar */}
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>Revenue</span>
                                                            <span>₹{roleData.revenue.toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-[#98D048] to-green-400 rounded-full transition-all duration-1000"
                                                                style={{ width: `${revenueWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Completion Rate Indicator */}
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Completed: {roleData.completed}</span>
                                                        <span className={`${parseFloat(roleData.conversionRate) > 10 ? 'text-[#98D048]' : parseFloat(roleData.conversionRate) > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {roleData.paidOrders} paid
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {roleBreakdownData.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            No role performance data available. Try refreshing or check your filters.
                                        </div>
                                    )}
                                </div>

                                {/* Role Funnel Comparison */}
                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Conversion Funnel by Role</h2>
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[800px]">
                                            {/* Funnel Stage Labels */}
                                            <div className="grid grid-cols-7 gap-2 mb-4 text-xs text-gray-400">
                                                <div className="text-center">Sessions</div>
                                                <div className="text-center">Begin</div>
                                                <div className="text-center">Complete</div>
                                                <div className="text-center">Contact</div>
                                                <div className="text-center">Passed</div>
                                                <div className="text-center">Payment</div>
                                                <div className="text-center">Success</div>
                                            </div>
                                            
                                            {/* Funnel for Each Role */}
                                            {roleBreakdownData.map((roleData) => (
                                                <div key={roleData.role} className="mb-6">
                                                    <div className="text-sm font-medium text-white mb-2">{roleData.role}</div>
                                                    <div className="grid grid-cols-7 gap-2 items-center">
                                                        {[
                                                            { value: roleData.sessions, color: 'bg-blue-500' },
                                                            { value: roleData.beginAssessment, color: 'bg-indigo-500' },
                                                            { value: roleData.completed, color: 'bg-purple-500' },
                                                            { value: roleData.contactSubmitted, color: 'bg-pink-500' },
                                                            { value: roleData.passed, color: 'bg-red-500' },
                                                            { value: roleData.paymentInitiated, color: 'bg-orange-500' },
                                                            { value: roleData.paidOrders, color: 'bg-[#98D048]' }
                                                        ].map((stage, stageIndex) => {
                                                            const maxValue = roleData.sessions || 1;
                                                            const percentage = (stage.value / maxValue) * 100;
                                                            const height = Math.max(percentage * 0.6, 4); // Min height of 4px
                                                            
                                                            return (
                                                                <div key={stageIndex} className="flex flex-col items-center">
                                                                    <div 
                                                                        className={`${stage.color} rounded transition-all duration-1000 w-full max-w-[60px] mb-1`}
                                                                        style={{ height: `${height}px` }}
                                                                    />
                                                                    <div className="text-xs text-center text-gray-300">
                                                                        {stage.value}
                                                                    </div>
                                                                    <div className="text-xs text-center text-gray-500">
                                                                        {percentage.toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {roleBreakdownData.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            No funnel data available. Try refreshing or check your filters.
                                        </div>
                                    )}
                                </div>

                                {/* Role Breakdown Table */}
                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Role Performance Breakdown</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="pb-3 text-gray-400 font-medium">Role</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Sessions</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Begin</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Completed</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Contact</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Passed</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Paid</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Revenue</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">AOV</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Conv %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {roleBreakdownData.map((roleData) => (
                                                    <tr key={roleData.role} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-4 font-medium text-[#98D048]">{roleData.role}</td>
                                                        <td className="py-4 text-right">{roleData.sessions}</td>
                                                        <td className="py-4 text-right">{roleData.beginAssessment}</td>
                                                        <td className="py-4 text-right">{roleData.completed}</td>
                                                        <td className="py-4 text-right">{roleData.contactSubmitted}</td>
                                                        <td className="py-4 text-right">{roleData.passed}</td>
                                                        <td className="py-4 text-right">{roleData.paidOrders}</td>
                                                        <td className="py-4 text-right text-[#38BDF8]">₹{roleData.revenue.toLocaleString('en-IN')}</td>
                                                        <td className="py-4 text-right">₹{roleData.aov.toFixed(0)}</td>
                                                        <td className="py-4 text-right">
                                                            <span className={`${parseFloat(roleData.conversionRate) > 10 ? 'text-[#98D048]' : parseFloat(roleData.conversionRate) > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {roleData.conversionRate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {roleBreakdownData.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            No role data available. Try refreshing or check your filters.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Original Overall View
                            <>
                        {/* Overview Stats Card */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(() => {
                                const totalSessions = funnelData.find(s => s.id === 'sessions')?.count || 0;
                                return [
                                    { label: 'Total Sessions', value: totalSessions, sub: 'Top of Funnel' },
                                    { label: 'Clicked Begin', value: funnelData.find(s => s.id === 'begin')?.count || 0, sub: 'Assessment' },
                                    { label: 'Completed', value: funnelData.find(s => s.id === 'completed')?.count || 0, sub: 'Finished Quiz' },
                                    { label: 'Passed', value: funnelData.find(s => s.id === 'passed')?.count || 0, sub: '>50% Score' },
                                    { label: 'Payment Init', value: funnelData.find(s => s.id === 'pay_click')?.count || 0, sub: 'Clicked Buy' },
                                    { label: 'Paid Success', value: funnelData.find(s => s.id === 'paid')?.count || 0, highlight: true },
                                    { label: 'Total Revenue', value: `₹${paymentAnalytics.totalRevenue.toLocaleString('en-IN')}`, sub: 'All Payments', isRevenue: true, highlight: true },
                                    { label: 'Avg Order Value', value: `₹${paymentAnalytics.averageOrderValue.toLocaleString('en-IN')}`, sub: 'AOV', isRevenue: true, highlight: true }
                                ].map((stat, i, arr) => {
                                    // Skip percentage calculations for revenue cards
                                    const isRevenueCard = stat.isRevenue;
                                    
                                    // 1. Top of Funnel Conversion
                                    const percentTotal = !isRevenueCard && totalSessions > 0 && stat.label !== 'Total Sessions' && typeof stat.value === 'number'
                                        ? ((stat.value / totalSessions) * 100).toFixed(1) + '%'
                                        : null;

                                    // 2. Previous Step Conversion
                                    const prevStat = i > 0 ? arr[i - 1] : null;
                                    const percentPrev = !isRevenueCard && prevStat && typeof prevStat.value === 'number' && typeof stat.value === 'number' && prevStat.value > 0
                                        ? ((stat.value / prevStat.value) * 100).toFixed(1) + '%'
                                        : null;

                                    return (
                                        <div key={i} className={`bg-[#0B2A3D] rounded-xl p-4 border ${stat.highlight ? 'border-[#98D048]/50 bg-[#98D048]/10' : 'border-gray-700'}`}>
                                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">{stat.label}</div>
                                            <div className={`text-2xl font-bold ${stat.highlight ? 'text-[#98D048]' : 'text-white'}`}>{stat.value}</div>
                                            <div className="flex flex-col mt-3 gap-2">
                                                <div className="text-gray-500 text-xs font-medium border-b border-white/5 pb-2 min-h-[1.5em]">{stat.sub || '-'}</div>

                                                {/* Stats Row - Only show for non-revenue cards */}
                                                {!isRevenueCard && (percentTotal || percentPrev) && (
                                                    <div className="flex flex-col gap-1 text-[11px] font-mono">
                                                        {percentPrev && (
                                                            <div className="flex justify-between items-center text-gray-300">
                                                                <span className="opacity-50">vs Prev</span>
                                                                <span className={Number(percentPrev.replace('%', '')) > 50 ? 'text-[#98D048]' : 'text-yellow-500'}>{percentPrev}</span>
                                                            </div>
                                                        )}
                                                        {percentTotal && (
                                                            <div className="flex justify-between items-center text-[#38BDF8]">
                                                                <span className="opacity-50">vs Total</span>
                                                                <span>{percentTotal}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Spacer for alignment if no stats */}
                                                {(!percentTotal && !percentPrev) && <div className="h-[34px]"></div>}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Funnel Table */}
                        <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Conversion Funnel</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="pb-3 text-gray-400 font-medium">Stage</th>
                                            <th className="pb-3 text-gray-400 font-medium text-right">Count</th>
                                            <th className="pb-3 text-gray-400 font-medium text-right">Conversion Match</th>
                                            <th className="pb-3 text-gray-400 font-medium text-right">Visual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {funnelData.map((step) => (
                                            <tr key={step.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-medium">{step.label}</td>
                                                <td className="py-4 text-right">{step.count}</td>
                                                <td className="py-4 text-right text-[#38BDF8]">{step.id === 'sessions' ? '-' : `${step.conversion}%`}</td>
                                                <td className="py-4 pl-8">
                                                    <div className="h-2 bg-gray-700 rounded-full w-48 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#98D048] to-[#38BDF8] rounded-full"
                                                            style={{ width: `${Math.min(Number(step.conversion), 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Events Log */}
                        <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-300">Live Event Feed (Last 20)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left opacity-80">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="pb-2">Time</th>
                                            <th className="pb-2">Event</th>
                                            <th className="pb-2">Session ID</th>
                                            <th className="pb-2">Role/Props</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {recentEvents.map((evt) => (
                                            <tr key={evt.id}>
                                                <td className="py-2 text-gray-400">
                                                    {new Date(evt.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="py-2 text-white">{evt.event_name}</td>
                                                <td className="py-2 text-gray-500 font-mono text-xs">
                                                    {evt.session_id.slice(0, 8)}...
                                                </td>
                                                <td className="py-2 text-gray-400 truncate max-w-xs">
                                                    {JSON.stringify(evt.properties)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FunnelDashboard;
