
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { PaymentAnalytics, DateFilter } from '../../services/api';
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

    // Sidebar State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarData, setSidebarData] = useState<any>(null);
    const [sidebarTitle, setSidebarTitle] = useState('');
    const [sidebarLoading, setSidebarLoading] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        utmSource: '',
        utmMedium: '',
        role: ''
    });

    // Date filter state
    const [dateFilter, setDateFilter] = useState<DateFilter>({});
    const [showDateFilters, setShowDateFilters] = useState(false);

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

    const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (value) {
            // When user inputs a local datetime, we need to convert it to UTC for the database
            // The input gives us the local datetime, we convert it to UTC ISO string
            const localDate = new Date(value);
            const utcISOString = localDate.toISOString();
            
            setDateFilter(prev => ({
                ...prev,
                [name]: utcISOString
            }));
            
            console.log(`${name}: Local input ${value} -> Local Date ${localDate.toLocaleString()} -> UTC ${utcISOString}`);
        } else {
            setDateFilter(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const clearDateFilter = () => {
        setDateFilter({});
    };

    // Fetch detailed data for sidebar
    const fetchSidebarData = async (type: string) => {
        setSidebarLoading(true);
        try {
            console.log('🔍 SIDEBAR DEBUG: fetchSidebarData called with type:', type);
            console.log('🔍 SIDEBAR DEBUG: Current dateFilter:', dateFilter);
            console.log('🔍 SIDEBAR DEBUG: Current filters:', filters);
            
            let query;
            let title = '';

            // First, get the matching session IDs (same logic as main dashboard)
            let sessionQuery = supabase.from('sessions').select('id, created_at', { count: 'exact' });

            if (filters.utmSource) {
                sessionQuery = sessionQuery.ilike('utm_source', `%${filters.utmSource}%`);
            }
            if (filters.utmMedium) {
                sessionQuery = sessionQuery.ilike('utm_medium', `%${filters.utmMedium}%`);
            }
            if (filters.role) {
                sessionQuery = sessionQuery.eq('role', filters.role);
            }
            
            // Apply date filters
            if (dateFilter.startDate) {
                sessionQuery = sessionQuery.gte('created_at', dateFilter.startDate);
            }
            if (dateFilter.endDate) {
                sessionQuery = sessionQuery.lte('created_at', dateFilter.endDate);
            }

            const { data: sessionData, error: sessionError } = await sessionQuery.limit(10000);
            
            if (sessionError) throw sessionError;

            // Extract matching Session IDs
            const matchingSessionIds = sessionData?.map(s => s.id.toString()) || [];
            
            console.log('🔍 SIDEBAR DEBUG: Found sessions matching filters:', sessionData?.length);
            console.log('🔍 SIDEBAR DEBUG: matchingSessionIds:', matchingSessionIds.slice(0, 10), '... (showing first 10)');
            
            if (matchingSessionIds.length === 0) {
                setSidebarData([]);
                setSidebarTitle(title);
                setSidebarOpen(true);
                return;
            }

            switch (type) {
                case 'revenue':
                    title = 'Revenue Details';
                    query = supabase
                        .from('orders')
                        .select(`
                            id, amount, currency, created_at, status, razorpay_payment_id,
                            users!inner(id, name, email, phone_number)
                        `)
                        .eq('status', 'paid')
                        .in('session_id', matchingSessionIds.map(id => parseInt(id, 10)))
                        .order('created_at', { ascending: false });
                    break;

                case 'payments':
                    title = 'Successful Payments';
                    query = supabase
                        .from('orders')
                        .select(`
                            id, amount, currency, created_at, status, razorpay_payment_id,
                            users!inner(id, name, email, phone_number)
                        `)
                        .eq('status', 'paid')
                        .in('session_id', matchingSessionIds.map(id => parseInt(id, 10)))
                        .order('created_at', { ascending: false });
                    break;

                case 'completed':
                    title = 'Completed Assessments';
                    // Query tracking_events for 'assessment_completed' events (same as main dashboard)
                    query = supabase
                        .from('tracking_events')
                        .select(`
                            id, created_at, session_id,
                            sessions!inner(id, created_at, utm_source, utm_medium, role,
                                users(id, name, email, phone_number)
                            )
                        `)
                        .eq('event_name', 'assessment_completed')
                        .in('session_id', matchingSessionIds)
                        .order('created_at', { ascending: false })
                        .limit(200);
                    break;

                case 'passed':
                    title = 'Passed Assessments';
                    // For passed, we need to check user_assessments with is_passed = true
                    query = supabase
                        .from('user_assessments')
                        .select(`
                            id, score, created_at, is_complete, is_passed, time_taken,
                            users!inner(id, name, email, phone_number),
                            roles!inner(id, role_name)
                        `)
                        .eq('is_passed', true)
                        .in('session_id', matchingSessionIds.map(id => parseInt(id, 10)))
                        .order('created_at', { ascending: false })
                        .limit(200);
                    break;

                case 'assessments':
                    title = 'All Assessment Details';
                    query = supabase
                        .from('user_assessments')
                        .select(`
                            id, score, created_at, is_complete, is_passed, time_taken,
                            users!inner(id, name, email, phone_number),
                            roles!inner(id, role_name)
                        `)
                        .in('session_id', matchingSessionIds.map(id => parseInt(id, 10)))
                        .order('created_at', { ascending: false })
                        .limit(100);
                    break;

                case 'clicked_begin':
                    title = 'Users Who Clicked Begin';
                    // Get tracking events for 'begin' that match our session IDs
                    query = supabase
                        .from('tracking_events')
                        .select(`
                            id, created_at, session_id,
                            sessions!inner(id, created_at, utm_source, utm_medium, role,
                                users(id, name, email, phone_number)
                            )
                        `)
                        .eq('event_name', 'click_begin_assessment')
                        .in('session_id', matchingSessionIds)
                        .order('created_at', { ascending: false })
                        .limit(100);
                    break;

                case 'payment_init':
                    title = 'Users Who Initiated Payment';
                    // Get tracking events for 'payment_initiated' that match our session IDs
                    query = supabase
                        .from('tracking_events')
                        .select(`
                            id, created_at, session_id,
                            sessions!inner(id, created_at, utm_source, utm_medium, role,
                                users(id, name, email, phone_number)
                            )
                        `)
                        .eq('event_name', 'payment_initiated')
                        .in('session_id', matchingSessionIds)
                        .order('created_at', { ascending: false })
                        .limit(100);
                    break;

                case 'sessions':
                    title = 'Session Details';
                    // Show ALL sessions (no limit) - use left join to include sessions without users
                    query = supabase
                        .from('sessions')
                        .select(`
                            id, created_at, utm_source, utm_medium, utm_campaign, role, ip_address,
                            users(id, name, email, phone_number)
                        `)
                        .in('id', matchingSessionIds.map(id => parseInt(id, 10)))
                        .order('created_at', { ascending: false });
                        // No limit - show all matching sessions
                    break;

                default:
                    return;
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching sidebar data:', error);
                return;
            }

            console.log('🔍 SIDEBAR DEBUG: Final query result count:', data?.length);
            console.log('🔍 SIDEBAR DEBUG: Sample data:', data?.slice(0, 2));

            setSidebarData(data);
            setSidebarTitle(title);
            setSidebarOpen(true);
        } catch (error) {
            console.error('Exception fetching sidebar data:', error);
        } finally {
            setSidebarLoading(false);
        }
    };

    const setCommonDateFilter = (days: number) => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Convert to UTC ISO strings for database queries
        const startDateUTC = startDate.toISOString();
        const endDateUTC = now.toISOString();
        
        setDateFilter({
            startDate: startDateUTC,
            endDate: endDateUTC
        });
        
        console.log(`Set ${days} day rolling filter:`);
        console.log(`Local time range: ${startDate.toLocaleString()} to ${now.toLocaleString()}`);
        console.log(`UTC range: ${startDateUTC} to ${endDateUTC}`);
    };

    // Effect to fetch role breakdown data when view changes
    useEffect(() => {
        if (showRoleBreakdown && availableRoles.length > 0) {
            fetchRoleBreakdownData();
        }
    }, [showRoleBreakdown, availableRoles, filters.utmSource, filters.utmMedium]);

    // Effect to reload data when date filter changes
    useEffect(() => {
        fetchData();
        if (showRoleBreakdown) {
            fetchRoleBreakdownData();
        }
    }, [dateFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Sessions (Base for filtering) - Get IDs and count
            let sessionQuery = supabase.from('sessions').select('id, created_at', { count: 'exact' });

            if (filters.utmSource) {
                sessionQuery = sessionQuery.ilike('utm_source', `%${filters.utmSource}%`);
            }
            if (filters.utmMedium) {
                sessionQuery = sessionQuery.ilike('utm_medium', `%${filters.utmMedium}%`);
            }
            if (filters.role) {
                sessionQuery = sessionQuery.eq('role', filters.role);
            }
            
            // Apply date filters
            if (dateFilter.startDate) {
                sessionQuery = sessionQuery.gte('created_at', dateFilter.startDate);
            }
            if (dateFilter.endDate) {
                sessionQuery = sessionQuery.lte('created_at', dateFilter.endDate);
            }

            // Get ALL sessions (no limit) to ensure we capture all paid orders
            const { data: sessionData, count: sessionCount, error: sessionError } = await sessionQuery.limit(10000);

            if (sessionError) throw sessionError;

            // Extract matching Session IDs and convert to strings (since tracking_events.session_id is text)
            const matchingSessionIds = sessionData?.map(s => s.id.toString()) || [];
            const totalSessions = sessionCount || 0;

            console.log(`Found ${totalSessions} sessions matching filters, tracking ${matchingSessionIds.length} session IDs`);
            console.log('Session ID list:', matchingSessionIds);
            console.log('Date filter being used:', dateFilter);

            // If no sessions found, everything is 0
            if (totalSessions === 0 || matchingSessionIds.length === 0) {
                setFunnelData([
                    { id: 'sessions', label: 'Total Sessions', count: 0 },
                    { id: 'begin', label: 'Clicked Begin Assessment', count: 0 },
                    { id: 'started', label: 'Started Assessment', count: 0 },
                    { id: 'phase1', label: 'Completed Phase 1', count: 0 },
                    { id: 'phase2', label: 'Completed Phase 2', count: 0 },
                    { id: 'phase3', label: 'Completed Phase 3', count: 0 },
                    { id: 'phase4', label: 'Completed Phase 4', count: 0 },
                    { id: 'completed', label: 'Assessment Complete', count: 0 },
                    { id: 'contact', label: 'Submitted Contact', count: 0 },
                    { id: 'passed', label: 'Passed (>50%)', count: 0 },
                    { id: 'pay_click', label: 'Initiated Payment', count: 0 },
                    { id: 'paid', label: 'Payment Success', count: 0 }
                ]);
                setPaymentAnalytics({
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    totalOrders: 0,
                    successfulPayments: 0
                });
                setLoading(false);
                return;
            }

            // 2. For ALL subsequent metrics, we ONLY look at these specific session IDs
            // Helper function to get unique session counts for specific events, scoped to our filtered sessions
            const getUniqueSessionCount = async (eventName: string, filterFn?: (evt: any) => boolean) => {
                const { data } = await supabase
                    .from('tracking_events')
                    .select('session_id, event_data')
                    .eq('event_name', eventName)
                    .in('session_id', matchingSessionIds) // ONLY look at our filtered sessions
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

            // Helper to get UNIQUE Phase completion counts from our filtered sessions
            const getPhaseUniqueCounts = async () => {
                const { data } = await supabase
                    .from('tracking_events')
                    .select('event_data, session_id')
                    .eq('event_name', 'phase_completed')
                    .in('session_id', matchingSessionIds) // ONLY look at our filtered sessions
                    .limit(5000);

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

            // Get "Contact Submitted" from our filtered sessions
            const getContactCount = async () => {
                const { count } = await supabase
                    .from('sessions')
                    .select('*', { count: 'exact', head: true })
                    .not('user_id', 'is', null)
                    .in('id', matchingSessionIds.map(id => parseInt(id, 10))); // Convert back to numbers for session IDs

                return count || 0;
            };

            // Get Passed Count from our filtered sessions
            const getPassedCount = async () => {
                const { count } = await supabase
                    .from('user_assessments')
                    .select('session_id', { count: 'exact', head: true })
                    .eq('is_passed', true)
                    .in('session_id', matchingSessionIds.map(id => parseInt(id, 10))); // Convert to numbers for user_assessments

                return count || 0;
            };

            // Execute all funnel queries in parallel, scoped to our filtered sessions
            // Get paid order count from orders table (more reliable than tracking events)
            const getPaidOrderCount = async () => {
                const { count } = await supabase
                    .from('orders')
                    .select('session_id', { count: 'exact', head: true })
                    .eq('status', 'paid')
                    .in('session_id', matchingSessionIds.map(id => parseInt(id, 10)));

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
                getUniqueSessionCount('click_begin_assessment'),
                getUniqueSessionCount('phase_started', (e) => e.event_data?.phase_number === 1),
                getPhaseUniqueCounts(),
                getUniqueSessionCount('assessment_completed'),
                getPassedCount(),
                getContactCount(),
                getUniqueSessionCount('payment_initiated'),
                getPaidOrderCount() // Use orders table instead of payment_success events
            ]);

            const steps: FunnelStep[] = [
                { id: 'sessions', label: 'Total Sessions', count: totalSessions },
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

            // Calculate conversion percentages based on total sessions
            const processedSteps = steps.map((step, index) => {
                if (index === 0) return { ...step, conversion: 100 };
                
                // Calculate conversion from total sessions for consistency
                const conversionFromTotal = totalSessions > 0 ? ((step.count / totalSessions) * 100).toFixed(1) : '0';
                return { ...step, conversion: Number(conversionFromTotal) };
            });

            setFunnelData(processedSteps);

            // Fetch recent raw events for debugging - also scoped to our sessions
            const { data: events } = await supabase
                .from('tracking_events')
                .select('*')
                .in('session_id', matchingSessionIds)
                .order('created_at', { ascending: false })
                .limit(50);

            setRecentEvents(events || []);

            // Calculate Payment Analytics ONLY from our filtered sessions
            const { data: paymentData, error: paymentError } = await supabase
                .from('orders')
                .select('amount, status, razorpay_payment_id, created_at')
                .eq('status', 'paid')
                .not('amount', 'is', null)
                .in('session_id', matchingSessionIds.map(id => parseInt(id, 10))); // Convert to numbers for orders table

            if (!paymentError && paymentData) {
                const successfulPayments = paymentData.length;
                // Fix: Calculate revenue from ORDERS, not purchases
                const totalRevenue = paymentData.reduce((sum, order) => sum + parseFloat(order.amount || '0'), 0);
                const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

                console.log('Payment Analytics Debug:', {
                    filteredSessions: matchingSessionIds.length,
                    paidOrders: paymentData,
                    calculatedRevenue: totalRevenue,
                    calculatedAOV: averageOrderValue
                });

                setPaymentAnalytics({
                    totalRevenue,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                    totalOrders: successfulPayments,
                    successfulPayments
                });
            } else {
                console.error('Payment analytics error:', paymentError);
                setPaymentAnalytics({
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    totalOrders: 0,
                    successfulPayments: 0
                });
            }

            console.log('Funnel Summary:', {
                totalSessions,
                beginCount,
                completedCount,
                passedCount,
                paidCount,
                totalRevenue: paymentData?.reduce((sum, order) => sum + parseFloat(order.amount || '0'), 0) || 0
            });

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
                        <a
                            href="/admin/user-lookup"
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
                        >
                            User Lookup
                        </a>
                    </nav>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Date Filter Section */}
                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Date & Time Filters</h3>
                            <p className="text-sm text-gray-400">Filter all analytics data by date and time range</p>
                        </div>
                        <button
                            onClick={() => setShowDateFilters(!showDateFilters)}
                            className="px-4 py-2 bg-[#98D048] text-[#021019] rounded-lg font-medium hover:bg-[#98D048]/90 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showDateFilters ? 'Hide Date Filters' : 'Show Date Filters'}
                        </button>
                    </div>

                    {showDateFilters && (
                        <div className="mt-6 border-t border-white/10 pt-6">
                            {/* Quick Filter Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => setCommonDateFilter(1)}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                                >
                                    Last 24 hours
                                </button>
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
                                    Clear Date Filter
                                </button>
                            </div>

                            {/* Custom Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Start Date & Time <span className="text-xs text-gray-400">(Your Local Time)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={dateFilter.startDate ? (() => {
                                            const date = new Date(dateFilter.startDate);
                                            const offset = date.getTimezoneOffset();
                                            const localDate = new Date(date.getTime() - offset * 60000);
                                            return localDate.toISOString().slice(0, 16);
                                        })() : ''}
                                        onChange={handleDateFilterChange}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        End Date & Time <span className="text-xs text-gray-400">(Your Local Time)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={dateFilter.endDate ? (() => {
                                            const date = new Date(dateFilter.endDate);
                                            const offset = date.getTimezoneOffset();
                                            const localDate = new Date(date.getTime() - offset * 60000);
                                            return localDate.toISOString().slice(0, 16);
                                        })() : ''}
                                        onChange={handleDateFilterChange}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white"
                                    />
                                </div>
                            </div>

                            {/* Timezone Info */}
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-blue-400 font-medium">Timezone Info:</span>
                                    <span className="text-sm text-gray-300">
                                        Filters use your local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}), automatically converted to UTC for database queries
                                    </span>
                                </div>
                            </div>

                            {/* Active Filter Indicator */}
                            {(dateFilter.startDate || dateFilter.endDate) && (
                                <div className="mt-4 p-3 bg-[#98D048]/10 border border-[#98D048]/20 rounded-lg">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#98D048]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm text-[#98D048] font-medium">Active Date Filter:</span>
                                        </div>
                                        <div className="pl-6 text-sm">
                                            {dateFilter.startDate && (
                                                <div className="text-gray-300">
                                                    <span className="font-medium">From:</span> {new Date(dateFilter.startDate).toLocaleString()} (Local)
                                                    <br />
                                                    <span className="text-xs text-gray-400">UTC: {new Date(dateFilter.startDate).toUTCString()}</span>
                                                </div>
                                            )}
                                            {dateFilter.startDate && dateFilter.endDate && <div className="my-1" />}
                                            {dateFilter.endDate && (
                                                <div className="text-gray-300">
                                                    <span className="font-medium">{dateFilter.startDate ? 'To:' : 'Until:'}</span> {new Date(dateFilter.endDate).toLocaleString()} (Local)
                                                    <br />
                                                    <span className="text-xs text-gray-400">UTC: {new Date(dateFilter.endDate).toUTCString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                                        <div 
                                            key={i} 
                                            className={`bg-[#0B2A3D] rounded-xl p-4 border ${stat.highlight ? 'border-[#98D048]/50 bg-[#98D048]/10' : 'border-gray-700'} cursor-pointer hover:bg-white/5 transition-colors`}
                                            onClick={() => {
                                                if (stat.label === 'Paid Success') {
                                                    fetchSidebarData('payments');
                                                } else if (stat.label === 'Total Revenue') {
                                                    fetchSidebarData('revenue');
                                                } else if (stat.label === 'Total Sessions') {
                                                    fetchSidebarData('sessions');
                                                } else if (stat.label === 'Completed') {
                                                    fetchSidebarData('completed');
                                                } else if (stat.label === 'Passed') {
                                                    fetchSidebarData('passed');
                                                } else if (stat.label === 'Clicked Begin') {
                                                    fetchSidebarData('clicked_begin');
                                                } else if (stat.label === 'Payment Init') {
                                                    fetchSidebarData('payment_init');
                                                } else if (stat.label === 'Avg Order Value') {
                                                    fetchSidebarData('revenue'); // Same as revenue for AOV
                                                }
                                            }}
                                        >
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

            {/* Detail Sidebar */}
            {sidebarOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    
                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 z-50 w-full max-w-2xl bg-[#021019] border-l border-white/20 flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-white/20 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{sidebarTitle}</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {sidebarLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#98D048]"></div>
                                </div>
                            ) : sidebarData && sidebarData.length > 0 ? (
                                <div className="space-y-4">
                                    {sidebarData.map((item: any, index: number) => (
                                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 relative">
                                            {/* Serial Number Badge */}
                                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#98D048] text-[#021019] rounded-full flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            {/* Revenue/Payments Data */}
                                            {(sidebarTitle.includes('Revenue') || sidebarTitle.includes('Payment')) && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#98D048]/20 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-[#98D048]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-white">{item.users?.name || 'Unknown'}</h3>
                                                                <p className="text-sm text-gray-400">{item.users?.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-[#98D048]">₹{Number(item.amount).toLocaleString('en-IN')}</p>
                                                            <p className="text-xs text-gray-500">{item.currency}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Phone:</span>
                                                            <p className="text-white font-mono">{item.users?.phone_number || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Date:</span>
                                                            <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Payment ID:</span>
                                                            <p className="text-white font-mono text-xs">{item.razorpay_payment_id || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Status:</span>
                                                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Assessment Data */}
                                            {(sidebarTitle.includes('Assessment') || sidebarTitle.includes('Passed')) && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-white">{item.users?.name || 'Unknown'}</h3>
                                                                <p className="text-sm text-gray-400">{item.users?.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-orange-400">{item.score}%</p>
                                                            <p className="text-xs text-gray-500">{item.is_passed ? 'Passed' : 'Failed'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Role:</span>
                                                            <p className="text-white">{item.roles?.role_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Time Taken:</span>
                                                            <p className="text-white">{item.time_taken || 0} mins</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Date:</span>
                                                            <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Complete:</span>
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                item.is_complete 
                                                                    ? 'bg-green-500/20 text-green-400' 
                                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                                {item.is_complete ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Completed Assessments from Tracking Events */}
                                            {sidebarTitle.includes('Completed') && item.sessions && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-white">{item.sessions.users?.name || 'Anonymous'}</h3>
                                                                <p className="text-sm text-gray-400">{item.sessions.users?.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-green-400">Session #{item.sessions.id}</p>
                                                            <p className="text-xs text-gray-500">{item.sessions.role || 'No role'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">UTM Source:</span>
                                                            <p className="text-white">{item.sessions.utm_source || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">UTM Medium:</span>
                                                            <p className="text-white">{item.sessions.utm_medium || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Completed Date:</span>
                                                            <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Session Date:</span>
                                                            <p className="text-white">{new Date(item.sessions.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Session Data */}
                                            {sidebarTitle.includes('Session') && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-white">{item.users?.name || 'Anonymous'}</h3>
                                                                <p className="text-sm text-gray-400">{item.users?.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-blue-400">Session #{item.id}</p>
                                                            <p className="text-xs text-gray-500">{item.role || 'No role'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">UTM Source:</span>
                                                            <p className="text-white">{item.utm_source || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">UTM Medium:</span>
                                                            <p className="text-white">{item.utm_medium || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Date:</span>
                                                            <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">IP Address:</span>
                                                            <p className="text-white font-mono text-xs">{item.ip_address || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Tracking Event Data (Begin/Payment Init) */}
                                            {(sidebarTitle.includes('Clicked Begin') || sidebarTitle.includes('Payment')) && item.sessions && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                sidebarTitle.includes('Payment') 
                                                                    ? 'bg-green-500/20' 
                                                                    : 'bg-purple-500/20'
                                                            }`}>
                                                                <svg className={`w-5 h-5 ${
                                                                    sidebarTitle.includes('Payment') 
                                                                        ? 'text-green-400' 
                                                                        : 'text-purple-400'
                                                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    {sidebarTitle.includes('Payment') ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                    ) : (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293L12 11l.707-.707A1 1 0 0113.414 10H15M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-white">{item.sessions.users?.name || 'Anonymous'}</h3>
                                                                <p className="text-sm text-gray-400">{item.sessions.users?.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-sm font-bold ${
                                                                sidebarTitle.includes('Payment') 
                                                                    ? 'text-green-400' 
                                                                    : 'text-purple-400'
                                                            }`}>
                                                                Session #{item.sessions.id}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{item.sessions.role || 'No role'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">UTM Source:</span>
                                                            <p className="text-white">{item.sessions.utm_source || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">UTM Medium:</span>
                                                            <p className="text-white">{item.sessions.utm_medium || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Event Date:</span>
                                                            <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Session Date:</span>
                                                            <p className="text-white">{new Date(item.sessions.created_at).toLocaleDateString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                                    </svg>
                                    <p className="text-gray-400">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FunnelDashboard;
