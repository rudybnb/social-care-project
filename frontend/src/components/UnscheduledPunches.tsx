import React, { useState, useEffect } from 'react';
import { approvalAPI } from '../services/approvalAPI';
import { ApprovalRequest } from '../types/approvalTypes';

const UnscheduledPunches: React.FC = () => {
    // We now use ApprovalRequest[] instead of Shift[]
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch pending requests from the dedicated API
            const pendingRequests = await approvalAPI.getPendingRequests();
            setRequests(pendingRequests);
        } catch (error) {
            console.error('Failed to load approval requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Listen for data changes if we have a global event system, 
        // but explicit reload is safer for now.
        const handleDataChange = () => loadData();
        window.addEventListener('dataChanged', handleDataChange);
        return () => window.removeEventListener('dataChanged', handleDataChange);
    }, []);

    const handleApprove = async (request: ApprovalRequest) => {
        if (window.confirm(`Approve unscheduled shift for ${request.staffName}?`)) {
            try {
                // "Admin" is hardcoded for now, ideally comes from auth context
                await approvalAPI.approveRequest(request.id, 'Admin');
                alert('Request approved. A new shift has been created.');
                loadData();
            } catch (error) {
                console.error('Failed to approve request:', error);
                alert('Failed to approve request');
            }
        }
    };

    const handleReject = async (request: ApprovalRequest) => {
        const reason = window.prompt(`Reject request from ${request.staffName}? Enter reason (optional):`);
        if (reason !== null) { // If not cancelled
            try {
                await approvalAPI.rejectRequest(request.id, 'Admin', reason);
                loadData();
            } catch (error) {
                console.error('Failed to reject request:', error);
                alert('Failed to reject request');
            }
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    };

    return (
        <div style={{ padding: '24px', color: 'white' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span> Unscheduled Punches
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                    These are requests from staff to clock in without a scheduled shift.
                </p>
            </div>

            {loading ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    border: '2px dashed #374151'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>All Clear!</h3>
                    <p style={{ color: '#9ca3af' }}>No pending approval requests.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                    {requests.map(request => (
                        <div key={request.id} style={{
                            backgroundColor: '#111827',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #374151',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ color: '#9333ea', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {request.siteName}
                                    </div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{request.staffName}</div>
                                </div>
                                <div style={{ backgroundColor: '#1f2937', padding: '4px 10px', borderRadius: '6px', color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>
                                    {formatDate(request.date)}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#1f2937',
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Requested At</div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>{formatTime(request.requestTime)}</div>
                                </div>
                                <div style={{ color: '#374151', fontSize: '20px' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Status</div>
                                    <div style={{ color: '#f59e0b', fontWeight: '600' }}>Pending Approval</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => handleApprove(request)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Approve & Create Shift
                                </button>
                                <button
                                    onClick={() => handleReject(request)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UnscheduledPunches;
