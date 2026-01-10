import React, { useState, useEffect } from 'react';
import { getShifts, removeShift, Shift } from '../data/sharedData';
import Modal from './Modal';
import { calculateEndTime } from '../utils/calculateDuration';
import { shiftsAPI } from '../services/api';

const UnscheduledPunches: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [selectedShiftForSplit, setSelectedShiftForSplit] = useState<Shift | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [splitForm, setSplitForm] = useState({
        splitTime: '14:00',
        newStaffId: '',
        notes: ''
    });

    const loadData = async () => {
        // In a real app, we might have a dedicated endpoint, 
        // but for now we filter the main shifts array
        const allShifts = getShifts();
        const unscheduled = allShifts.filter((s: Shift) => s.id.startsWith('UNSCHED_'));

        try {
            const staffResponse = await fetch('https://social-care-backend.onrender.com/api/staff');
            const staffData = await staffResponse.json();
            setStaff(staffData);
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    useEffect(() => {
        loadData();
        // Listen for data changes
        const handleDataChange = () => loadData();
        window.addEventListener('dataChanged', handleDataChange);
        return () => window.removeEventListener('dataChanged', handleDataChange);
    }, []);

    const handleApprove = (punch: Shift) => {
        setSelectedShiftForSplit(punch);
        setSplitForm({
            splitTime: punch.startTime, // For unscheduled, maybe we just want to reassign the whole thing
            newStaffId: '',
            notes: punch.notes || ''
        });
        setShowSplitModal(true);
    };

    const handleReject = async (punch: Shift) => {
        if (window.confirm(`Are you sure you want to reject this punch from ${punch.staffName}?`)) {
            try {
                await removeShift(punch.id);
                loadData();
            } catch (error) {
                alert('Failed to reject punch');
            }
        }
    };

    const executeApprove = async () => {
        if (!selectedShiftForSplit || !splitForm.newStaffId) {
            alert('Please select a staff member to assign this punch to');
            return;
        }

        try {
            // "Approving" an unscheduled punch means converting it to a real shift
            // or reassigning it. For now, we'll update the staff info and remove the UNSCHED_ prefix
            const selectedStaff = staff.find(s => s.id === splitForm.newStaffId);

            const updatedShift: Partial<Shift> = {
                staffId: splitForm.newStaffId,
                staffName: selectedStaff?.name || 'Unknown',
                notes: splitForm.notes,
                // Remove prefix by creating a new shift and deleting the old one
                // or just updating it if the backend supports ID changes (usually not).
                // Standard approach: create new, delete old.
            };

            // Remove prefix and create as a new shift
            // Use type assertion to bypass the mandatory ID requirement for shiftsAPI.create
            const { id: oldId, ...shiftDataBase } = selectedShiftForSplit;
            const newShiftData = {
                ...shiftDataBase,
                ...updatedShift
            } as any;

            await shiftsAPI.create(newShiftData);
            await removeShift(selectedShiftForSplit.id);

            setShowSplitModal(false);
            setSelectedShiftForSplit(null);
            loadData();
            alert('Punch approved and assigned successfully');
        } catch (error) {
            console.error('Failed to approve punch:', error);
            alert('Failed to approve punch');
        }
    };

    return (
        <div style={{ padding: '24px', color: 'white' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span> Unscheduled Punches
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                    These punches were recorded via QR codes without a scheduled shift. Review them to ensure they are legitimate before approving for payroll.
                </p>
            </div>

            {shifts.length === 0 ? (
                <div style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    border: '2px dashed #374151'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>All Clear!</h3>
                    <p style={{ color: '#9ca3af' }}>No pending unscheduled punches to review.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                    {shifts.map(punch => (
                        <div key={punch.id} style={{
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
                                        {punch.siteName}
                                    </div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{punch.staffName}</div>
                                </div>
                                <div style={{ backgroundColor: '#1f2937', padding: '4px 10px', borderRadius: '6px', color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>
                                    {punch.date}
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
                                    <div style={{ color: 'white', fontWeight: '600' }}>{punch.startTime}</div>
                                </div>
                                <div style={{ color: '#374151', fontSize: '20px' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Clock Out</div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>{punch.endTime || 'Ongoing'}</div>
                                </div>
                            </div>

                            {punch.notes && (
                                <div style={{
                                    fontSize: '13px',
                                    color: '#f59e0b',
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #f59e0b'
                                }}>
                                    <strong>Note:</strong> {punch.notes}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => handleApprove(punch)}
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
                                    Approve / Reassign
                                </button>
                                <button
                                    onClick={() => handleReject(punch)}
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

            {/* Approval/Reassignment Modal */}
            <Modal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} title="Approve Unscheduled Punch">
                {selectedShiftForSplit && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                                Assign to Staff Member
                            </label>
                            <select
                                value={splitForm.newStaffId}
                                onChange={(e) => setSplitForm({ ...splitForm, newStaffId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            >
                                <option value="">Select Staff...</option>
                                {staff
                                    .filter(s => s.status === 'Active')
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                                Notes / Adjustments
                            </label>
                            <textarea
                                value={splitForm.notes}
                                onChange={(e) => setSplitForm({ ...splitForm, notes: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: 'white',
                                    minHeight: '100px',
                                    resize: 'vertical'
                                }}
                                placeholder="Adjust notes if needed..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowSplitModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeApprove}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UnscheduledPunches;
