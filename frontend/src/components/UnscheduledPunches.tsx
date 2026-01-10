import React, { useState, useEffect } from 'react';

interface UnscheduledShift {
    id: string;
    staffId: string;
    staffName: string;
    siteId: string;
    siteName: string;
    siteColor: string;
    date: string;
    type: string;
    startTime: string;
    endTime: string;
    clockedIn: boolean;
    clockInTime: string | null;
    clockedOut: boolean;
    clockOutTime: string | null;
    notes: string;
}

const UnscheduledPunches: React.FC = () => {
    const [shifts, setShifts] = useState<UnscheduledShift[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all shifts and filter for UNSCHED_ prefixed IDs
            const response = await fetch('https://social-care-backend.onrender.com/api/shifts');
            if (!response.ok) throw new Error('Failed to fetch shifts');
            const allShifts = await response.json();
            const unscheduledShifts = allShifts.filter((s: any) => s.id && s.id.startsWith('UNSCHED_'));
            setShifts(unscheduledShifts);
            setError(null);
        } catch (error) {
            console.error('Failed to load unscheduled shifts:', error);
            setError('Failed to load shifts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const handleDataChange = () => loadData();
        window.addEventListener('dataChanged', handleDataChange);
        return () => window.removeEventListener('dataChanged', handleDataChange);
    }, []);

    const handleDelete = async (shift: UnscheduledShift) => {
        if (window.confirm(`Delete unscheduled shift for ${shift.staffName} at ${shift.siteName}?`)) {
            try {
                const response = await fetch(`https://social-care-backend.onrender.com/api/shifts/${shift.id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete shift');
                alert('Shift deleted successfully.');
                loadData();
            } catch (error) {
                console.error('Failed to delete shift:', error);
                alert('Failed to delete shift');
            }
        }
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '--:--';
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
                    These are shifts created automatically when staff clocked in without a scheduled shift.
                </p>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#ef444420',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>⚠️ {error}</span>
                    <button
                        onClick={loadData}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    onClick={loadData}
                    disabled={loading}
                    style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        border: '1px solid #4b5563',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}
                >
                    {loading ? '↻ Refreshing...' : '↻ Refresh List'}
                </button>
            </div>

            {loading ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Loading shifts...</div>
            ) : shifts.length === 0 ? (
                <div style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    border: '2px dashed #374151'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>All Clear!</h3>
                    <p style={{ color: '#9ca3af' }}>No unscheduled shifts found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                    {shifts.map(shift => (
                        <div key={shift.id} style={{
                            backgroundColor: '#111827',
                            borderRadius: '12px',
                            padding: '20px',
                            border: `2px solid ${shift.siteColor || '#374151'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ color: shift.siteColor || '#9333ea', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {shift.siteName}
                                    </div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{shift.staffName}</div>
                                </div>
                                <div style={{ backgroundColor: '#1f2937', padding: '4px 10px', borderRadius: '6px', color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>
                                    {formatDate(shift.date)}
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
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Clock In</div>
                                    <div style={{ color: '#22c55e', fontWeight: '600' }}>{formatTime(shift.clockInTime)}</div>
                                </div>
                                <div style={{ color: '#374151', fontSize: '20px' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Clock Out</div>
                                    <div style={{ color: shift.clockedOut ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>
                                        {shift.clockedOut ? formatTime(shift.clockOutTime) : 'Active'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Type</div>
                                    <div style={{ color: shift.type === 'Night' ? '#8b5cf6' : '#f59e0b', fontWeight: '600' }}>{shift.type}</div>
                                </div>
                            </div>

                            {shift.notes && (
                                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                                    📝 {shift.notes}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => handleDelete(shift)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑️ Delete Shift
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
