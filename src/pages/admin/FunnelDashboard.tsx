
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
        utmMedium: ''
    });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Initial load only

    const handleRefresh = () => {
        fetchData();
    };

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

            // We need session IDs if filtering, otherwise we can just count
            // Fetching IDs for event filtering
            const { data: sessionData, count: sessionCount, error: sessionError } = await sessionQuery.select('session_id');

            if (sessionError) throw sessionError;

            // Extract matching Session IDs
            const matchingSessionIds = sessionData?.map(s => s.session_id) || [];

            // If filters are active but no sessions found, everything is 0
            const hasActiveFilters = filters.utmSource || filters.utmMedium;
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
                    .select('session_id, properties') // properties useful for filtering
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
                    .select('properties, session_id')
                    .eq('event_name', 'phase_completed');

                if (hasActiveFilters) {
                    query = query.in('session_id', matchingSessionIds);
                }

                const { data } = await query.limit(5000);

                const phaseSets = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };

                data?.forEach((evt: any) => {
                    const p = evt.properties?.phase_number;
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

                const { count } = await query;
                return count || 0;
            };

            // Get Passed Count
            const getPassedCount = async () => {
                let query = supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('passed', true);

                if (filters.utmSource) query = query.ilike('utm_source', `%${filters.utmSource}%`);
                if (filters.utmMedium) query = query.ilike('utm_medium', `%${filters.utmMedium}%`);

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
                getUniqueSessionCount('phase_started', (e) => e.properties?.phase_number === 1), // Only count Phase 1 as "Started Assessment"
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

            // Calculate Payment Analytics with UTM Filters
            let paymentQuery = supabase
                .from('sessions')
                .select('amount_paid, is_paid, payment_id')
                .eq('is_paid', true)
                .not('amount_paid', 'is', null);

            // Apply UTM filters to payment data
            if (filters.utmSource) {
                paymentQuery = paymentQuery.ilike('utm_source', `%${filters.utmSource}%`);
            }
            if (filters.utmMedium) {
                paymentQuery = paymentQuery.ilike('utm_medium', `%${filters.utmMedium}%`);
            }

            const { data: paymentData, error: paymentError } = await paymentQuery;

            if (!paymentError && paymentData) {
                const successfulPayments = paymentData.length;
                const totalRevenue = paymentData.reduce((sum, session) => sum + (session.amount_paid || 0), 0);
                const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

                setPaymentAnalytics({
                    totalRevenue,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                    totalOrders: successfulPayments,
                    successfulPayments
                });
            } else {
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
        <div className="min-h-screen bg-[#001C2C] text-white p-8">
            <TopBar />
            <TopBar />
            <div className="max-w-6xl mx-auto mt-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-bold flex-shrink-0">User Funnel Dashboard</h1>

                    {/* Filters & Refresh */}
                    <div className="flex flex-col md:flex-row gap-3 bg-[#0B2A3D] p-3 rounded-lg border border-gray-700">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default FunnelDashboard;
