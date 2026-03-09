import { useState } from 'react';
import type { UserLookupData, UserLookupResponse } from '../../services/api';
import { getUserByEmail } from '../../services/api';
import TopBar from '../../components/TopBar';

const UserLookupDashboard = () => {
    // User Lookup State
    const [userLookupEmail, setUserLookupEmail] = useState('');
    const [userLookupData, setUserLookupData] = useState<UserLookupData | null>(null);
    const [userLookupLoading, setUserLookupLoading] = useState(false);
    const [userLookupError, setUserLookupError] = useState<string | null>(null);

    // User Lookup Function
    const handleUserLookup = async () => {
        if (!userLookupEmail.trim()) {
            setUserLookupError('Please enter an email address');
            return;
        }

        setUserLookupLoading(true);
        setUserLookupError(null);
        setUserLookupData(null);

        try {
            const response: UserLookupResponse = await getUserByEmail(userLookupEmail.trim());
            
            if (response.result === 'success' && response.data) {
                setUserLookupData(response.data);
            } else if (response.result === 'not_found') {
                setUserLookupError('User not found with this email address');
            } else {
                setUserLookupError(response.message || 'Failed to lookup user');
            }
        } catch (error) {
            console.error('User lookup error:', error);
            setUserLookupError('An error occurred while looking up the user');
        } finally {
            setUserLookupLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
        });
    };

    return (
        <div className="min-h-screen font-sans text-white" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
            <TopBar>
                <div className="text-xl font-bold flex items-center gap-2">
                    <span className="text-[#98D048]">User Lookup</span> - Call Research
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
                            className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
                        >
                            Analytics
                        </a>
                        <a
                            href="/admin/user-lookup"
                            className="py-4 px-1 border-b-2 border-[#98D048] font-medium text-sm text-[#98D048]"
                        >
                            User Lookup
                        </a>
                    </nav>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold flex-shrink-0">User Lookup - Conversion Call Research</h1>
                        <p className="text-gray-400 text-sm">
                            Search by email to get complete user journey data for conversion research calls
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="flex flex-col md:flex-row gap-3 bg-[#0B2A3D] p-3 rounded-lg border border-gray-700">
                        <input
                            type="email"
                            placeholder="Enter user email..."
                            value={userLookupEmail}
                            onChange={(e) => setUserLookupEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUserLookup()}
                            className="bg-black/20 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#98D048] min-w-[250px]"
                        />
                        <button
                            onClick={handleUserLookup}
                            disabled={userLookupLoading}
                            className="bg-[#98D048] hover:bg-[#7AB93D] disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${userLookupLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            {userLookupLoading ? 'Searching...' : 'Lookup User'}
                        </button>
                    </div>
                </div>

                {/* User Lookup Content */}
                <div className="space-y-6">
                    {userLookupError && (
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                            <div className="text-red-300">{userLookupError}</div>
                        </div>
                    )}

                    {userLookupData && (
                        <div className="space-y-6">
                            {/* User Profile Card */}
                            <div className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-[#98D048]">User Profile</h2>
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(userLookupData, null, 2))}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                                    >
                                        Copy All Data
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Name</div>
                                        <div className="text-white font-medium">{userLookupData.profile.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</div>
                                        <div className="text-white font-medium">{userLookupData.profile.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Phone</div>
                                        <div className="text-white font-medium">{userLookupData.profile.phone_number || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">User ID</div>
                                        <div className="text-white font-medium">#{userLookupData.profile.id}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Status Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { label: 'Assessment Taken', value: userLookupData.conversionStatus.hasAssessment, color: userLookupData.conversionStatus.hasAssessment ? 'text-green-400' : 'text-red-400' },
                                    { label: 'Assessment Passed', value: userLookupData.conversionStatus.hasPassedAssessment, color: userLookupData.conversionStatus.hasPassedAssessment ? 'text-green-400' : 'text-red-400' },
                                    { label: 'Order Created', value: userLookupData.conversionStatus.hasOrder, color: userLookupData.conversionStatus.hasOrder ? 'text-green-400' : 'text-red-400' },
                                    { label: 'Payment Made', value: userLookupData.conversionStatus.hasPaidOrder, color: userLookupData.conversionStatus.hasPaidOrder ? 'text-green-400' : 'text-red-400' },
                                    { label: 'Certificate Purchased', value: userLookupData.conversionStatus.hasPurchase, color: userLookupData.conversionStatus.hasPurchase ? 'text-green-400' : 'text-red-400' },
                                ].map((status, i) => (
                                    <div key={i} className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-3 text-center">
                                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">{status.label}</div>
                                        <div className={`text-lg font-bold ${status.color}`}>
                                            {status.value ? '✓' : '✗'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Assessment Results */}
                            {userLookupData.assessments.length > 0 && (
                                <div className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-[#98D048] mb-4">Assessment Results</h3>
                                    <div className="space-y-4">
                                        {userLookupData.assessments.map((assessment: any, i: number) => (
                                            <div key={i} className="border border-gray-600 rounded p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Score</div>
                                                        <div className="text-white font-medium">{assessment.score || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Status</div>
                                                        <div className={`font-medium ${assessment.is_passed ? 'text-green-400' : 'text-red-400'}`}>
                                                            {assessment.is_passed ? 'PASSED' : 'FAILED'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Time Taken</div>
                                                        <div className="text-white font-medium">
                                                            {assessment.time_taken ? `${Math.round(assessment.time_taken / 60)} min` : 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Date</div>
                                                        <div className="text-white font-medium">
                                                            {new Date(assessment.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sessions & UTM Data */}
                            {userLookupData.sessions.length > 0 && (
                                <div className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-[#98D048] mb-4">User Sessions & UTM Data</h3>
                                    <div className="space-y-4">
                                        {userLookupData.sessions.map((session: any, i: number) => (
                                            <div key={i} className="border border-gray-600 rounded p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Session ID</div>
                                                        <div className="text-white font-medium">#{session.id}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Role</div>
                                                        <div className="text-white font-medium">{session.role || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">UTM Source</div>
                                                        <div className="text-white font-medium">{session.utm_source || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">UTM Medium</div>
                                                        <div className="text-white font-medium">{session.utm_medium || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Date</div>
                                                        <div className="text-white font-medium">
                                                            {new Date(session.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Orders & Payment Data */}
                            {userLookupData.orders.length > 0 && (
                                <div className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-[#98D048] mb-4">Orders & Payment History</h3>
                                    <div className="space-y-4">
                                        {userLookupData.orders.map((order: any, i: number) => (
                                            <div key={i} className="border border-gray-600 rounded p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Order ID</div>
                                                        <div className="text-white font-medium text-xs">{order.id.slice(0, 8)}...</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Amount</div>
                                                        <div className="text-white font-medium">₹{order.amount}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Status</div>
                                                        <div className={`font-medium ${order.status === 'paid' ? 'text-green-400' : order.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                            {order.status.toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-400 mb-1">Date</div>
                                                        <div className="text-white font-medium">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity Timeline */}
                            {userLookupData.timeline.length > 0 && (
                                <div className="bg-[#0B2A3D] rounded-lg border border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-[#98D048] mb-4">Recent Activity Timeline (Last 50 Events)</h3>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {userLookupData.timeline.map((event: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-700 pb-2">
                                                <div className="text-gray-400 text-xs w-20">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </div>
                                                <div className="text-white font-medium flex-1">
                                                    {event.event}
                                                </div>
                                                <div className="text-gray-400 text-xs">
                                                    Session #{event.session_id}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Call Research Notes */}
                            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-yellow-400 mb-4">📞 Call Research Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div><strong>Conversion Blocker:</strong> {
                                        !userLookupData.conversionStatus.hasAssessment ? 'Never took assessment' :
                                        !userLookupData.conversionStatus.hasPassedAssessment ? 'Failed assessment' :
                                        !userLookupData.conversionStatus.hasOrder ? 'Passed but never created order' :
                                        !userLookupData.conversionStatus.hasPaidOrder ? 'Created order but payment failed/abandoned' :
                                        !userLookupData.conversionStatus.hasPurchase ? 'Payment successful but purchase not recorded' :
                                        'Fully converted - investigate upsell opportunities'
                                    }</div>
                                    <div><strong>UTM Source:</strong> {userLookupData.sessions[0]?.utm_source || 'Unknown'}</div>
                                    <div><strong>Latest Session Role:</strong> {userLookupData.sessions[0]?.role || 'Unknown'}</div>
                                    <div><strong>Assessment Score:</strong> {
                                        userLookupData.assessments.length > 0 ? 
                                        `${userLookupData.assessments[0].score || 'N/A'} (${userLookupData.assessments[0].is_passed ? 'Passed' : 'Failed'})` : 
                                        'No assessment taken'
                                    }</div>
                                    <div><strong>Total Order Value:</strong> ₹{userLookupData.orders.reduce((sum: number, order: any) => sum + order.amount, 0)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!userLookupLoading && !userLookupData && !userLookupError && (
                        <div className="text-center py-20 text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p>Enter a user email above to lookup their complete journey data for conversion calls.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserLookupDashboard;