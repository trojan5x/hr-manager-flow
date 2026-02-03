
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

interface FilterGroup {
    id: string;
    name: string;
    utmSource: string;
    utmMedium: string;
    color: string;
}

interface GroupFunnelData {
    groupId: string;
    funnelData: FunnelStep[];
    paymentAnalytics: PaymentAnalytics;
}

const COLORS = ['#98D048', '#38BDF8', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const FunnelDashboardComparison = () => {
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');
    const [groupsData, setGroupsData] = useState<GroupFunnelData[]>([]);
    
    // Filter Groups State
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
        { id: '1', name: 'All Traffic', utmSource: '', utmMedium: '', color: COLORS[0] }
    ]);
    
    const [selectedGroups, setSelectedGroups] = useState<string[]>(['1']); // IDs of groups to compare
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', utmSource: '', utmMedium: '' });

    useEffect(() => {
        if (viewMode === 'single' && selectedGroups.length > 0) {
            fetchGroupData(selectedGroups[0]);
        } else if (viewMode === 'comparison') {
            fetchComparisonData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Initial load only

    const handleRefresh = () => {
        if (viewMode === 'single' && selectedGroups.length > 0) {
            fetchGroupData(selectedGroups[0]);
        } else if (viewMode === 'comparison') {
            fetchComparisonData();
        }
    };

    const fetchGroupData = async (groupId: string) => {
        const group = filterGroups.find(g => g.id === groupId);
        if (!group) return;

        setLoading(true);
        try {
            const data = await fetchDataForFilters(group.utmSource, group.utmMedium);
            setGroupsData([{ groupId, ...data }]);
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComparisonData = async () => {
        setLoading(true);
        try {
            const groupsToFetch = filterGroups.filter(g => selectedGroups.includes(g.id));
            const results = await Promise.all(
                groupsToFetch.map(async (group) => {
                    const data = await fetchDataForFilters(group.utmSource, group.utmMedium);
                    return { groupId: group.id, ...data };
                })
            );
            setGroupsData(results);
        } catch (error) {
            console.error('Comparison error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForFilters = async (utmSource: string, utmMedium: string) => {
        // 1. Get Sessions (Base for filtering)
        let sessionQuery = supabase.from('sessions').select('*', { count: 'exact', head: false });

        if (utmSource) {
            sessionQuery = sessionQuery.ilike('utm_source', `%${utmSource}%`);
        }
        if (utmMedium) {
            sessionQuery = sessionQuery.ilike('utm_medium', `%${utmMedium}%`);
        }

        const { data: sessionData, count: sessionCount, error: sessionError } = await sessionQuery.select('session_id');

        if (sessionError) throw sessionError;

        const matchingSessionIds = sessionData?.map(s => s.session_id) || [];
        const hasActiveFilters = utmSource || utmMedium;

        if (hasActiveFilters && matchingSessionIds.length === 0) {
            return {
                funnelData: [],
                paymentAnalytics: {
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    totalOrders: 0,
                    successfulPayments: 0
                }
            };
        }

        // Helper functions
        const getUniqueSessionCount = async (eventName: string, filterFn?: (evt: any) => boolean) => {
            let query = supabase
                .from('tracking_events')
                .select('session_id, properties')
                .eq('event_name', eventName);

            if (hasActiveFilters) {
                query = query.in('session_id', matchingSessionIds);
            }

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

        const getContactCount = async () => {
            let query = supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .not('user_id', 'is', null);

            if (utmSource) query = query.ilike('utm_source', `%${utmSource}%`);
            if (utmMedium) query = query.ilike('utm_medium', `%${utmMedium}%`);

            const { count } = await query;
            return count || 0;
        };

        const getPassedCount = async () => {
            let query = supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('passed', true);

            if (utmSource) query = query.ilike('utm_source', `%${utmSource}%`);
            if (utmMedium) query = query.ilike('utm_medium', `%${utmMedium}%`);

            const { count } = await query;
            return count || 0;
        };

        const [
            beginCount,
            startCount,
            completedCount,
            passedCount,
            contactCount,
            paymentCount,
            paidCount
        ] = await Promise.all([
            getUniqueSessionCount('click_begin_assessment'),
            getUniqueSessionCount('phase_started', (e) => e.properties?.phase_number === 1),
            getUniqueSessionCount('assessment_completed'),
            getPassedCount(),
            getContactCount(),
            getUniqueSessionCount('payment_initiated'),
            getUniqueSessionCount('payment_success')
        ]);

        const steps: FunnelStep[] = [
            { id: 'sessions', label: 'Total Sessions', count: sessionCount || 0 },
            { id: 'begin', label: 'Clicked Begin', count: beginCount },
            { id: 'started', label: 'Started', count: startCount },
            { id: 'completed', label: 'Completed', count: completedCount },
            { id: 'passed', label: 'Passed', count: passedCount },
            { id: 'contact', label: 'Contact', count: contactCount },
            { id: 'pay_click', label: 'Pay Init', count: paymentCount },
            { id: 'paid', label: 'Paid', count: paidCount }
        ];

        const processedSteps = steps.map((step, index) => {
            if (index === 0) return { ...step, conversion: 100 };
            const prev = steps[index - 1];
            const conv = prev.count > 0 ? ((step.count / prev.count) * 100).toFixed(1) : '0';
            return { ...step, conversion: Number(conv) };
        });

        // Payment Analytics
        let paymentQuery = supabase
            .from('sessions')
            .select('amount_paid, is_paid, payment_id')
            .eq('is_paid', true)
            .not('amount_paid', 'is', null);

        if (utmSource) paymentQuery = paymentQuery.ilike('utm_source', `%${utmSource}%`);
        if (utmMedium) paymentQuery = paymentQuery.ilike('utm_medium', `%${utmMedium}%`);

        const { data: paymentData } = await paymentQuery;

        let paymentAnalytics: PaymentAnalytics = {
            totalRevenue: 0,
            averageOrderValue: 0,
            totalOrders: 0,
            successfulPayments: 0
        };

        if (paymentData) {
            const successfulPayments = paymentData.length;
            const totalRevenue = paymentData.reduce((sum, session) => sum + (session.amount_paid || 0), 0);
            const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

            paymentAnalytics = {
                totalRevenue,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                totalOrders: successfulPayments,
                successfulPayments
            };
        }

        return { funnelData: processedSteps, paymentAnalytics };
    };

    const addGroup = () => {
        if (!newGroup.name) {
            alert('Please enter a group name');
            return;
        }

        const newId = Date.now().toString();
        const newFilterGroup: FilterGroup = {
            id: newId,
            name: newGroup.name,
            utmSource: newGroup.utmSource,
            utmMedium: newGroup.utmMedium,
            color: COLORS[filterGroups.length % COLORS.length]
        };

        setFilterGroups([...filterGroups, newFilterGroup]);
        setNewGroup({ name: '', utmSource: '', utmMedium: '' });
        setIsAddingGroup(false);
    };

    const removeGroup = (id: string) => {
        if (filterGroups.length === 1) {
            alert('Cannot remove the last group');
            return;
        }
        setFilterGroups(filterGroups.filter(g => g.id !== id));
        setSelectedGroups(selectedGroups.filter(gId => gId !== id));
        setGroupsData(groupsData.filter(g => g.groupId !== id));
    };

    const toggleGroupSelection = (id: string) => {
        if (selectedGroups.includes(id)) {
            if (selectedGroups.length === 1 && viewMode === 'comparison') return; // Keep at least one
            setSelectedGroups(selectedGroups.filter(gId => gId !== id));
        } else {
            setSelectedGroups([...selectedGroups, id]);
        }
    };

    return (
        <div className="min-h-screen bg-[#001C2C] text-white p-8">
            <TopBar />
            <div className="max-w-7xl mx-auto mt-20">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-bold">Funnel Comparison Dashboard</h1>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-[#0B2A3D] p-1 rounded-lg border border-gray-700">
                        <button
                            onClick={() => setViewMode('single')}
                            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                viewMode === 'single' ? 'bg-[#98D048] text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Single View
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('comparison');
                                if (selectedGroups.length < 2) {
                                    setSelectedGroups(filterGroups.slice(0, 2).map(g => g.id));
                                }
                            }}
                            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                                viewMode === 'comparison' ? 'bg-[#98D048] text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Compare Groups
                        </button>
                    </div>
                </div>

                {/* Filter Groups Management */}
                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-[#98D048]">Filter Groups</h2>
                        <button
                            onClick={() => setIsAddingGroup(true)}
                            className="bg-[#98D048] hover:bg-[#7AB93D] text-black px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Group
                        </button>
                    </div>

                    {/* Add Group Form */}
                    {isAddingGroup && (
                        <div className="bg-black/20 rounded-lg p-4 mb-4 border border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Group Name (e.g., Google Ads)"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    className="bg-black/30 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#98D048]"
                                />
                                <input
                                    type="text"
                                    placeholder="UTM Source (optional)"
                                    value={newGroup.utmSource}
                                    onChange={(e) => setNewGroup({ ...newGroup, utmSource: e.target.value })}
                                    className="bg-black/30 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#98D048]"
                                />
                                <input
                                    type="text"
                                    placeholder="UTM Medium (optional)"
                                    value={newGroup.utmMedium}
                                    onChange={(e) => setNewGroup({ ...newGroup, utmMedium: e.target.value })}
                                    className="bg-black/30 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#98D048]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addGroup}
                                    className="bg-[#98D048] hover:bg-[#7AB93D] text-black px-4 py-1.5 rounded text-sm font-semibold"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingGroup(false);
                                        setNewGroup({ name: '', utmSource: '', utmMedium: '' });
                                    }}
                                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1.5 rounded text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Groups List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filterGroups.map((group) => (
                            <div
                                key={group.id}
                                className={`bg-black/20 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                                    selectedGroups.includes(group.id)
                                        ? `border-[${group.color}] bg-[${group.color}]/10`
                                        : 'border-gray-700 hover:border-gray-600'
                                }`}
                                onClick={() => {
                                    if (viewMode === 'comparison') {
                                        toggleGroupSelection(group.id);
                                    } else {
                                        setSelectedGroups([group.id]);
                                        fetchGroupData(group.id);
                                    }
                                }}
                                style={{
                                    borderColor: selectedGroups.includes(group.id) ? group.color : undefined,
                                    backgroundColor: selectedGroups.includes(group.id) ? `${group.color}15` : undefined
                                }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: group.color }}
                                        />
                                        <h3 className="font-semibold text-white">{group.name}</h3>
                                    </div>
                                    {filterGroups.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeGroup(group.id);
                                            }}
                                            className="text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 space-y-1">
                                    {group.utmSource && <div>Source: {group.utmSource}</div>}
                                    {group.utmMedium && <div>Medium: {group.utmMedium}</div>}
                                    {!group.utmSource && !group.utmMedium && <div>All Traffic</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="bg-[#98D048] hover:bg-[#7AB93D] text-black px-6 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-[#98D048] border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-gray-400">Loading Metrics...</span>
                    </div>
                ) : (
                    <>
                        {viewMode === 'comparison' && groupsData.length > 0 ? (
                            <div className="space-y-6">
                                {/* Comparison Table */}
                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700 overflow-x-auto">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Funnel Comparison</h2>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="pb-3 text-left text-gray-400 font-medium">Stage</th>
                                                {groupsData.map((gData) => {
                                                    const group = filterGroups.find(g => g.id === gData.groupId);
                                                    return (
                                                        <th key={gData.groupId} className="pb-3 text-right text-gray-400 font-medium">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: group?.color }}
                                                                />
                                                                {group?.name}
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {groupsData[0]?.funnelData.map((step, idx) => (
                                                <tr key={step.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 font-medium">{step.label}</td>
                                                    {groupsData.map((gData) => {
                                                        const groupStep = gData.funnelData[idx];
                                                        const group = filterGroups.find(g => g.id === gData.groupId);
                                                        return (
                                                            <td key={gData.groupId} className="py-3 text-right">
                                                                <div>
                                                                    <span className="font-semibold" style={{ color: group?.color }}>
                                                                        {groupStep?.count || 0}
                                                                    </span>
                                                                    {idx > 0 && (
                                                                        <span className="text-xs text-gray-500 ml-2">
                                                                            ({groupStep?.conversion || 0}%)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            {/* Revenue Rows */}
                                            <tr className="hover:bg-white/5 transition-colors border-t-2 border-gray-700">
                                                <td className="py-3 font-medium">Total Revenue</td>
                                                {groupsData.map((gData) => {
                                                    const group = filterGroups.find(g => g.id === gData.groupId);
                                                    return (
                                                        <td key={gData.groupId} className="py-3 text-right">
                                                            <span className="font-semibold" style={{ color: group?.color }}>
                                                                ₹{gData.paymentAnalytics.totalRevenue.toLocaleString('en-IN')}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 font-medium">Avg Order Value</td>
                                                {groupsData.map((gData) => {
                                                    const group = filterGroups.find(g => g.id === gData.groupId);
                                                    return (
                                                        <td key={gData.groupId} className="py-3 text-right">
                                                            <span className="font-semibold" style={{ color: group?.color }}>
                                                                ₹{gData.paymentAnalytics.averageOrderValue.toLocaleString('en-IN')}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Visual Comparison Chart */}
                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Conversion Rates Comparison</h2>
                                    <div className="space-y-4">
                                        {groupsData[0]?.funnelData.slice(1).map((step, idx) => (
                                            <div key={step.id}>
                                                <div className="text-sm font-medium mb-2">{step.label}</div>
                                                <div className="space-y-2">
                                                    {groupsData.map((gData) => {
                                                        const groupStep = gData.funnelData[idx + 1];
                                                        const group = filterGroups.find(g => g.id === gData.groupId);
                                                        return (
                                                            <div key={gData.groupId} className="flex items-center gap-3">
                                                                <div className="w-24 text-xs text-gray-400">{group?.name}</div>
                                                                <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full flex items-center justify-end pr-2 text-xs font-semibold"
                                                                        style={{
                                                                            width: `${Math.min(groupStep?.conversion || 0, 100)}%`,
                                                                            backgroundColor: group?.color
                                                                        }}
                                                                    >
                                                                        {groupStep?.conversion || 0}%
                                                                    </div>
                                                                </div>
                                                                <div className="w-16 text-sm text-gray-400 text-right">
                                                                    {groupStep?.count || 0}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : groupsData.length > 0 ? (
                            // Single View (existing dashboard layout)
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {(() => {
                                        const data = groupsData[0];
                                        const totalSessions = data.funnelData.find(s => s.id === 'sessions')?.count || 0;
                                        return [
                                            { label: 'Total Sessions', value: totalSessions },
                                            { label: 'Clicked Begin', value: data.funnelData.find(s => s.id === 'begin')?.count || 0 },
                                            { label: 'Completed', value: data.funnelData.find(s => s.id === 'completed')?.count || 0 },
                                            { label: 'Passed', value: data.funnelData.find(s => s.id === 'passed')?.count || 0 },
                                            { label: 'Payment Init', value: data.funnelData.find(s => s.id === 'pay_click')?.count || 0 },
                                            { label: 'Paid Success', value: data.funnelData.find(s => s.id === 'paid')?.count || 0, highlight: true },
                                            { label: 'Total Revenue', value: `₹${data.paymentAnalytics.totalRevenue.toLocaleString('en-IN')}`, highlight: true },
                                            { label: 'Avg Order Value', value: `₹${data.paymentAnalytics.averageOrderValue.toLocaleString('en-IN')}`, highlight: true }
                                        ].map((stat, i) => (
                                            <div key={i} className={`bg-[#0B2A3D] rounded-xl p-4 border ${stat.highlight ? 'border-[#98D048]/50 bg-[#98D048]/10' : 'border-gray-700'}`}>
                                                <div className="text-gray-400 text-xs uppercase font-semibold mb-1">{stat.label}</div>
                                                <div className={`text-2xl font-bold ${stat.highlight ? 'text-[#98D048]' : 'text-white'}`}>{stat.value}</div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                <div className="bg-[#0B2A3D] rounded-xl p-6 border border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 text-[#98D048]">Conversion Funnel</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="pb-3 text-gray-400 font-medium">Stage</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Count</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Conversion</th>
                                                    <th className="pb-3 text-gray-400 font-medium text-right">Visual</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {groupsData[0].funnelData.map((step) => (
                                                    <tr key={step.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-4 font-medium">{step.label}</td>
                                                        <td className="py-4 text-right">{step.count}</td>
                                                        <td className="py-4 text-right text-[#38BDF8]">
                                                            {step.id === 'sessions' ? '-' : `${step.conversion}%`}
                                                        </td>
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
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                Select a filter group and click Refresh to view data
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FunnelDashboardComparison;
