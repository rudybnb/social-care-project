import React, { useState, useEffect } from 'react';
import { getShifts, subscribeToDataChange, getStaff, getAgencyWorkers } from '../data/sharedData';

interface StaffPayrollProps {
  staffId: string;
  staffName: string;
  onBack: () => void;
}

const StaffPayroll: React.FC<StaffPayrollProps> = ({ staffId, staffName, onBack }) => {
  const [shifts, setShifts] = useState(getShifts());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Subscribe to shift changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setShifts(getShifts());
    });
    return unsubscribe;
  }, []);

  // Get staff member details
  const allStaff = [...getStaff(), ...getAgencyWorkers()];
  const staffMember = allStaff.find(s => s.id === staffId);
  const isAgency = staffMember && 'agencyName' in staffMember;

  // Get week dates
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday,
      end: sunday,
      label: `${monday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    };
  };

  const currentWeek = getWeekDates(selectedWeek);

  // Get month dates (14th to 14th)
  const getMonthDates = (monthOffset: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    // Determine the current pay period
    let periodStart: Date;
    if (currentDay >= 14) {
      // We're in the period that started on the 14th of this month
      periodStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 14);
    } else {
      // We're in the period that started on the 14th of last month
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1 + monthOffset, 14);
    }
    
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(13); // Ends on 13th of next month
    
    return {
      start: periodStart,
      end: periodEnd,
      label: `${periodStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    };
  };

  const currentMonth = getMonthDates(selectedMonth);
  const currentPeriod = viewMode === 'weekly' ? currentWeek : currentMonth;

  // Calculate payroll for this staff member
  const calculatePayroll = () => {
    const staffShifts = shifts.filter(shift => 
      shift.staffId === staffId &&
      new Date(shift.date) >= currentPeriod.start &&
      new Date(shift.date) <= currentPeriod.end
    );

    let totalHours = 0;
    let dayHours = 0;
    let nightHours = 0;

    staffShifts.forEach(shift => {
      const hours = shift.extended ? shift.duration + (shift.extensionHours || 0) : shift.duration;
      totalHours += hours;
      if (shift.type === 'Day') {
        dayHours += hours;
      } else {
        nightHours += hours;
      }
    });

    let standardPay = 0;
    let enhancedPay = 0;
    let nightPay = 0;
    let totalPay = 0;
    let first20Hours = 0;
    let remainingHours = 0;

    if (isAgency && staffMember) {
      // AGENCY WORKERS: Flat hourly rate
      const agencyRate = parseFloat(staffMember.hourlyRate) || 0;
      totalPay = totalHours * agencyRate;
      standardPay = dayHours * agencyRate;
      nightPay = nightHours * agencyRate;
    } else if (staffMember) {
      // PERMANENT STAFF: Two-tier rate calculation
      const standardRate = parseFloat(staffMember.standardRate) || 12.50;
      const enhancedRate = parseFloat(staffMember.enhancedRate) || 14.00;
      const nightRate = parseFloat(staffMember.nightRate) || 15.00;

      // Calculate day shift pay with two-tier system
      if (dayHours <= 20) {
        first20Hours = dayHours;
        standardPay = dayHours * standardRate;
      } else {
        first20Hours = 20;
        remainingHours = dayHours - 20;
        standardPay = 20 * standardRate;
        enhancedPay = (dayHours - 20) * enhancedRate;
      }

      // Calculate night shift pay
      nightPay = nightHours * nightRate;
      totalPay = standardPay + enhancedPay + nightPay;
    }

    return {
      shifts: staffShifts,
      totalHours,
      dayHours,
      nightHours,
      first20Hours,
      remainingHours,
      standardPay,
      enhancedPay,
      nightPay,
      totalPay
    };
  };

  const payroll = calculatePayroll();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f0f',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid #8b5cf6'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Back to Calendar
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          💰 My Payroll
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          {staffName}
          {isAgency && staffMember && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: '#10b98120',
              color: '#10b981',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              AGENCY
            </span>
          )}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        backgroundColor: '#1a1a1a',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setViewMode('weekly')}
          style={{
            padding: '10px 24px',
            backgroundColor: viewMode === 'weekly' ? '#8b5cf6' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📅 Weekly
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          style={{
            padding: '10px 24px',
            backgroundColor: viewMode === 'monthly' ? '#8b5cf6' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📊 Monthly (14th-14th)
        </button>
      </div>

      {/* Period Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => viewMode === 'weekly' ? setSelectedWeek(selectedWeek - 1) : setSelectedMonth(selectedMonth - 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Previous {viewMode === 'weekly' ? 'Week' : 'Month'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
            {currentPeriod.label}
          </div>
          {((viewMode === 'weekly' && selectedWeek === 0) || (viewMode === 'monthly' && selectedMonth === 0)) && (
            <div style={{ color: '#8b5cf6', fontSize: '12px', marginTop: '4px' }}>
              Current {viewMode === 'weekly' ? 'Week' : 'Period'}
            </div>
          )}
        </div>

        <button
          onClick={() => viewMode === 'weekly' ? setSelectedWeek(selectedWeek + 1) : setSelectedMonth(selectedMonth + 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Next {viewMode === 'weekly' ? 'Week' : 'Month'} →
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Pay
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            £{payroll.totalPay.toFixed(2)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Hours
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payroll.totalHours.toFixed(1)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Shifts Worked
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payroll.shifts.length}
          </div>
        </div>
      </div>

      {/* Rate Information */}
      {!isAgency && (
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          marginBottom: '24px'
        }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            💡 Your Pay Rates
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#10b981', fontWeight: '600' }}>Standard Rate:</span>
              <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                £{staffMember ? parseFloat(staffMember.standardRate).toFixed(2) : '12.50'}/h (First 20 hours/week)
              </span>
            </div>
            <div>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>Enhanced Rate:</span>
              <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                £{staffMember ? parseFloat(staffMember.enhancedRate).toFixed(2) : '14.00'}/h (After 20 hours/week)
              </span>
            </div>
            <div>
              <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Night Rate:</span>
              <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                £{staffMember ? parseFloat(staffMember.nightRate).toFixed(2) : '15.00'}/h (All night shifts)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hours Breakdown */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#252525',
          borderBottom: '1px solid #3a3a3a',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Hours Breakdown
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px'
          }}>
            {!isAgency && payroll.first20Hours > 0 && (
              <div>
                <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '4px' }}>
                  First 20 Hours
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                  {payroll.first20Hours.toFixed(1)}h
                </div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>
                  @ standard rate
                </div>
              </div>
            )}

            {!isAgency && payroll.remainingHours > 0 && (
              <div>
                <div style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '4px' }}>
                  After 20 Hours
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                  {payroll.remainingHours.toFixed(1)}h
                </div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>
                  @ enhanced rate
                </div>
              </div>
            )}

            {payroll.nightHours > 0 && (
              <div>
                <div style={{ color: '#8b5cf6', fontSize: '12px', marginBottom: '4px' }}>
                  Night Hours
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                  {payroll.nightHours.toFixed(1)}h
                </div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>
                  @ night rate
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Breakdown */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#252525',
          borderBottom: '1px solid #3a3a3a',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Pay Breakdown
        </div>

        <div style={{ padding: '20px' }}>
          {payroll.standardPay > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#10b981' }}>Standard Pay</span>
              <span style={{ color: 'white', fontWeight: '600' }}>£{payroll.standardPay.toFixed(2)}</span>
            </div>
          )}

          {payroll.enhancedPay > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#f59e0b' }}>Enhanced Pay</span>
              <span style={{ color: 'white', fontWeight: '600' }}>£{payroll.enhancedPay.toFixed(2)}</span>
            </div>
          )}

          {payroll.nightPay > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#8b5cf6' }}>Night Pay</span>
              <span style={{ color: 'white', fontWeight: '600' }}>£{payroll.nightPay.toFixed(2)}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 0',
            fontSize: '18px'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>Total Pay</span>
            <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>£{payroll.totalPay.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shift List */}
      {payroll.shifts.length > 0 && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#252525',
            borderBottom: '1px solid #3a3a3a',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Shifts This Week ({payroll.shifts.length})
          </div>

          <div style={{ padding: '12px' }}>
            {payroll.shifts.map((shift, index) => (
              <div
                key={shift.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#252525',
                  borderRadius: '8px',
                  marginBottom: index < payroll.shifts.length - 1 ? '8px' : '0',
                  border: '1px solid #3a3a3a'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                      {new Date(shift.date).toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {shift.siteName} • {shift.type} Shift • {shift.startTime}-{shift.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'white', fontWeight: '600' }}>
                      {shift.duration}h
                    </div>
                    {shift.extended && (
                      <div style={{ color: '#f59e0b', fontSize: '11px' }}>
                        +{shift.extensionHours}h extended
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payroll.shifts.length === 0 && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>
            No Shifts This Week
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            You don't have any shifts assigned for this week
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPayroll;

