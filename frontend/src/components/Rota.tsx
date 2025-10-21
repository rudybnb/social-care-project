import React, { useState } from 'react';
import Modal from './Modal';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  type: 'Day' | 'Night';
  startTime: string;
  endTime: string;
  duration: number;
  is24Hour: boolean;
  approved24HrBy?: string;
  notes?: string;
}

const Rota: React.FC = () => {
  const sites = [
    { id: 'SITE_A', name: 'Site A' },
    { id: 'SITE_B', name: 'Site B' },
    { id: 'SITE_C', name: 'Site C' }
  ];

  const staff = Array.from({ length: 12 }, (_, i) => ({
    id: `ST${String(i + 1).padStart(3, '0')}`,
    name: `Staff ${i + 1}`
  }));

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showAssignShift, setShowAssignShift] = useState(false);
  const [show24HrApproval, setShow24HrApproval] = useState(false);
  const [pending24HrShift, setPending24HrShift] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const [shiftForm, setShiftForm] = useState({
    staffId: '',
    siteId: '',
    date: '',
    type: 'Day' as 'Day' | 'Night',
    is24Hour: false,
    notes: ''
  });

  const [approvalForm, setApprovalForm] = useState({
    approvedBy: '',
    reason: ''
  });

  // Get current week dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates(selectedWeek);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Rule validation functions
  const validateShift = (newShift: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // R1: No same-shift duplication
    const duplicateShift = shifts.find(s => 
      s.date === newShift.date && 
      s.siteId === newShift.siteId && 
      s.type === newShift.type
    );
    if (duplicateShift) {
      errors.push(`R1 VIOLATION: ${duplicateShift.staffName} is already assigned to ${newShift.type} shift at this site on this date.`);
    }

    // R2: Site exclusivity per day
    const sameDayShift = shifts.find(s => 
      s.date === newShift.date && 
      s.staffId === newShift.staffId &&
      s.siteId !== newShift.siteId
    );
    if (sameDayShift) {
      errors.push(`R2 VIOLATION: ${newShift.staffName} is already assigned to ${sameDayShift.siteName} on this date.`);
    }

    // R3: Shift limit (handled by 24-hour approval)
    if (newShift.is24Hour && !newShift.approved24HrBy) {
      errors.push(`R3 VIOLATION: 24-hour shifts require manager approval.`);
    }

    // R5: Rest period (12 hours minimum)
    const staffShifts = shifts.filter(s => s.staffId === newShift.staffId);
    const newShiftStart = new Date(`${newShift.date}T${newShift.startTime}`);
    
    for (const existingShift of staffShifts) {
      const existingEnd = new Date(`${existingShift.date}T${existingShift.endTime}`);
      const hoursDiff = Math.abs((newShiftStart.getTime() - existingEnd.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff < 12 && hoursDiff > 0) {
        errors.push(`R5 VIOLATION: Only ${hoursDiff.toFixed(1)} hours rest since last shift. Minimum 12 hours required.`);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleAssignShift = () => {
    if (!shiftForm.staffId || !shiftForm.siteId || !shiftForm.date) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedStaff = staff.find(s => s.id === shiftForm.staffId);
    const selectedSite = sites.find(s => s.id === shiftForm.siteId);

    const startTime = shiftForm.type === 'Day' ? '08:00' : '20:00';
    const endTime = shiftForm.type === 'Day' ? '20:00' : '08:00';

    const newShift = {
      id: `SHIFT_${Date.now()}`,
      staffId: shiftForm.staffId,
      staffName: selectedStaff?.name || '',
      siteId: shiftForm.siteId,
      siteName: selectedSite?.name || '',
      date: shiftForm.date,
      type: shiftForm.type,
      startTime,
      endTime,
      duration: 12,
      is24Hour: shiftForm.is24Hour,
      notes: shiftForm.notes
    };

    // If 24-hour shift, require approval
    if (shiftForm.is24Hour) {
      setPending24HrShift(newShift);
      setShow24HrApproval(true);
      return;
    }

    // Validate against rules
    const validation = validateShift(newShift);
    
    if (!validation.valid) {
      alert(`CANNOT ASSIGN SHIFT:\n\n${validation.errors.join('\n\n')}`);
      return;
    }

    setShifts([...shifts, newShift]);
    setShowAssignShift(false);
    setShiftForm({
      staffId: '',
      siteId: '',
      date: '',
      type: 'Day',
      is24Hour: false,
      notes: ''
    });
    alert(`Shift assigned successfully!\n\n${newShift.staffName} → ${newShift.siteName}\n${newShift.date} (${newShift.type} Shift)`);
  };

  const handleApprove24Hr = () => {
    if (!approvalForm.approvedBy || !approvalForm.reason) {
      alert('Please provide approver name and reason');
      return;
    }

    const approvedShift = {
      ...pending24HrShift,
      approved24HrBy: approvalForm.approvedBy,
      notes: `24HR APPROVED: ${approvalForm.reason}. ${pending24HrShift.notes || ''}`
    };

    // Validate with approval
    const validation = validateShift(approvedShift);
    
    if (!validation.valid) {
      alert(`CANNOT APPROVE 24-HOUR SHIFT:\n\n${validation.errors.join('\n\n')}`);
      return;
    }

    setShifts([...shifts, approvedShift]);
    setShow24HrApproval(false);
    setShowAssignShift(false);
    setPending24HrShift(null);
    setApprovalForm({ approvedBy: '', reason: '' });
    setShiftForm({
      staffId: '',
      siteId: '',
      date: '',
      type: 'Day',
      is24Hour: false,
      notes: ''
    });
    alert(`24-hour shift approved and assigned!\n\nApproved by: ${approvalForm.approvedBy}`);
  };

  const getShiftForSlot = (date: string, siteId: string, type: 'Day' | 'Night') => {
    return shifts.find(s => s.date === date && s.siteId === siteId && s.type === type);
  };

  const getStaffRotationBalance = (staffId: string) => {
    const staffShifts = shifts.filter(s => s.staffId === staffId);
    const siteCount = {
      SITE_A: staffShifts.filter(s => s.siteId === 'SITE_A').length,
      SITE_B: staffShifts.filter(s => s.siteId === 'SITE_B').length,
      SITE_C: staffShifts.filter(s => s.siteId === 'SITE_C').length
    };
    const total = staffShifts.length;
    return { siteCount, total, balanced: Math.max(...Object.values(siteCount)) - Math.min(...Object.values(siteCount)) <= 1 };
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
              Rota Management
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
              3 Sites • 12 Staff • 12-hour shifts (Day: 08:00-20:00, Night: 20:00-08:00)
            </p>
          </div>
          <button
            onClick={() => setShowAssignShift(true)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setShowAssignShift(true);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
            }}
          >
            + Assign Shift
          </button>
        </div>

        {/* Week Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek - 1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            ← Previous
          </button>
          <span style={{ color: 'white', fontSize: '15px', fontWeight: '600', flex: 1, textAlign: 'center' }}>
            Week of {new Date(weekDates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek + 1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Next →
          </button>
        </div>

        {/* Rules Summary */}
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '10px',
          padding: '16px',
          border: '1px solid #3a3a3a'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
            Active Rules
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R1:</span> No duplicate shifts
            </div>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R2:</span> One site per day
            </div>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R3:</span> 12hr max (24hr approved)
            </div>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R4:</span> Rotation balance
            </div>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R5:</span> 12hr rest minimum
            </div>
            <div style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>R6:</span> Manager override
            </div>
          </div>
        </div>
      </div>

      {/* Rota Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '1200px' }}>
          {sites.map((site) => (
            <div key={site.id} style={{ marginBottom: '24px' }}>
              <h2 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: site.id === 'SITE_A' ? '#9333ea' : site.id === 'SITE_B' ? '#10b981' : '#6366f1',
                  borderRadius: '50%'
                }}></div>
                {site.name}
              </h2>
              
              <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                border: '1px solid #3a3a3a',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekDates.map((date, index) => (
                    <div
                      key={date}
                      style={{
                        borderRight: index < 6 ? '1px solid #3a3a3a' : 'none'
                      }}
                    >
                      {/* Day Header */}
                      <div style={{
                        padding: '12px 10px',
                        backgroundColor: '#1a1a1a',
                        borderBottom: '1px solid #3a3a3a',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                          {dayNames[index]}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      {/* Day Shift */}
                      <div style={{
                        padding: '10px 8px',
                        borderBottom: '1px solid #3a3a3a',
                        minHeight: '70px'
                      }}>
                        <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                          DAY
                        </div>
                        {(() => {
                          const shift = getShiftForSlot(date, site.id, 'Day');
                          return shift ? (
                            <div style={{
                              backgroundColor: '#9333ea20',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #9333ea40'
                            }}>
                              <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                                {shift.staffName}
                              </div>
                              <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                08:00-20:00
                              </div>
                              {shift.is24Hour && (
                                <div style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                  24HR APPROVED
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: '#6b7280', fontSize: '11px', fontStyle: 'italic' }}>
                              Unassigned
                            </div>
                          );
                        })()}
                      </div>

                      {/* Night Shift */}
                      <div style={{
                        padding: '10px 8px',
                        minHeight: '70px'
                      }}>
                        <div style={{ color: '#6366f1', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                          NIGHT
                        </div>
                        {(() => {
                          const shift = getShiftForSlot(date, site.id, 'Night');
                          return shift ? (
                            <div style={{
                              backgroundColor: '#6366f120',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #6366f140'
                            }}>
                              <div style={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                                {shift.staffName}
                              </div>
                              <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                20:00-08:00
                              </div>
                              {shift.is24Hour && (
                                <div style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                  24HR APPROVED
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: '#6b7280', fontSize: '11px', fontStyle: 'italic' }}>
                              Unassigned
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Rotation Balance */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #3a3a3a',
        marginTop: '24px'
      }}>
        <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', marginBottom: '16px' }}>
          Staff Rotation Balance (R4)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {staff.map((s) => {
            const balance = getStaffRotationBalance(s.id);
            return (
              <div key={s.id} style={{
                backgroundColor: '#1a1a1a',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${balance.balanced ? '#10b98140' : '#f59e0b40'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{s.name}</span>
                  <span style={{
                    padding: '3px 8px',
                    backgroundColor: balance.balanced ? '#10b98120' : '#f59e0b20',
                    color: balance.balanced ? '#10b981' : '#f59e0b',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {balance.balanced ? 'Balanced' : 'Unbalanced'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Site A: {balance.siteCount.SITE_A} • Site B: {balance.siteCount.SITE_B} • Site C: {balance.siteCount.SITE_C}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Total shifts: {balance.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Shift Modal */}
      <Modal isOpen={showAssignShift} onClose={() => setShowAssignShift(false)} title="Assign Shift">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Staff Member *
            </label>
            <select
              value={shiftForm.staffId}
              onChange={(e) => setShiftForm({ ...shiftForm, staffId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select staff...</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Site *
            </label>
            <select
              value={shiftForm.siteId}
              onChange={(e) => setShiftForm({ ...shiftForm, siteId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select site...</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Date *
            </label>
            <input
              type="date"
              value={shiftForm.date}
              onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Shift Type *
            </label>
            <select
              value={shiftForm.type}
              onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value as 'Day' | 'Night' })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="Day">Day Shift (08:00-20:00)</option>
              <option value="Night">Night Shift (20:00-08:00)</option>
            </select>
          </div>

          <div style={{
            backgroundColor: '#f59e0b20',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #f59e0b40'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shiftForm.is24Hour}
                onChange={(e) => setShiftForm({ ...shiftForm, is24Hour: e.target.checked })}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                24-Hour Shift (Requires Manager Approval)
              </span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Notes
            </label>
            <textarea
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              placeholder="Optional notes..."
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => setShowAssignShift(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAssignShift(false);
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignShift}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleAssignShift();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Assign Shift
            </button>
          </div>
        </div>
      </Modal>

      {/* 24-Hour Approval Modal */}
      <Modal isOpen={show24HrApproval} onClose={() => setShow24HrApproval(false)} title="24-Hour Shift Approval Required">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#f59e0b20',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #f59e0b40'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Manager Approval Required (R6)
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              This 24-hour shift requires authorization from an admin or site manager before it can be assigned.
            </div>
          </div>

          {pending24HrShift && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Shift Details
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div>Staff: {pending24HrShift.staffName}</div>
                <div>Site: {pending24HrShift.siteName}</div>
                <div>Date: {pending24HrShift.date}</div>
                <div>Duration: 24 hours (Day + Night)</div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Approved By (Admin/Manager Name) *
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={approvalForm.approvedBy}
              onChange={(e) => setApprovalForm({ ...approvalForm, approvedBy: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Reason for 24-Hour Shift *
            </label>
            <textarea
              placeholder="e.g., Covering absence, Emergency coverage, Staff shortage"
              value={approvalForm.reason}
              onChange={(e) => setApprovalForm({ ...approvalForm, reason: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setShow24HrApproval(false);
                setPending24HrShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShow24HrApproval(false);
                setPending24HrShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Reject
            </button>
            <button
              onClick={handleApprove24Hr}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleApprove24Hr();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Approve & Assign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rota;

