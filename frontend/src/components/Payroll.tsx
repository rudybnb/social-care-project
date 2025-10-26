import React, { useState, useEffect } from 'react';
import { getShifts, getStaff, subscribeToDataChange, getAllWorkers } from '../data/sharedData';
import { calculateWeeklyHours } from '../utils/hoursCalculator';

const Payroll: React.FC = () => {
  const [shifts, setShifts] = useState(getShifts());
  const staff = getAllWorkers(); // Include both permanent staff and agency workers
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Subscribe to shift changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setShifts(getShifts());
    });
    return unsubscribe;
  }, []);

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

  // Calculate payroll for each staff member
  const calculatePayroll = () => {
    return staff.map(staffMember => {
      const staffShifts = shifts.filter(shift => 
        shift.staffName === staffMember.name &&
        new Date(shift.date) >= currentWeek.start &&
        new Date(shift.date) <= currentWeek.end
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

      // Check if this is an agency worker
      const isAgency = 'agencyName' in staffMember;
      
      let standardPay = 0;
      let enhancedPay = 0;
      let nightPay = 0;
      let totalPay = 0;

      if (isAgency) {
        // AGENCY WORKERS: Flat hourly rate (no tier system)
        const agencyRate = parseFloat(staffMember.hourlyRate) || 0;
        console.log(`💰 Agency Worker Pay Calculation:`, {
          name: staffMember.name,
          hourlyRateString: staffMember.hourlyRate,
          hourlyRateParsed: agencyRate,
          totalHours,
          dayHours,
          nightHours,
          calculation: `${totalHours}h × £${agencyRate} = £${totalHours * agencyRate}`
        });
        
        totalPay = totalHours * agencyRate;
        
        // For display purposes, show day hours as "standard" and night hours as "night"
        standardPay = dayHours * agencyRate;
        nightPay = nightHours * agencyRate;
        enhancedPay = 0; // Agency workers don't have enhanced rate
      } else {
        // PERMANENT STAFF: Two-tier rate calculation
        const standardRate = parseFloat(staffMember.standardRate) || 12.50; // First 20 hours
        const enhancedRate = parseFloat(staffMember.enhancedRate) || 14.00; // After 20 hours
        const nightRate = parseFloat(staffMember.nightRate) || 15.00; // Night shift premium

        // Calculate day shift pay with two-tier system
        let first20Hours = 0;
        let remainingHours = 0;
        
        if (dayHours <= 20) {
          first20Hours = dayHours;
          standardPay = dayHours * standardRate;
        } else {
          first20Hours = 20;
          remainingHours = dayHours - 20;
          standardPay = 20 * standardRate;
          enhancedPay = (dayHours - 20) * enhancedRate;
        }

        // Calculate night shift pay (always at night rate)
        nightPay = nightHours * nightRate;

        totalPay = standardPay + enhancedPay + nightPay;
      }
      
      return {
        name: staffMember.name,
        isAgency,
        agencyName: isAgency ? staffMember.agencyName : null,
        totalHours,
        dayHours,
        nightHours,
        first20Hours: isAgency ? 0 : (dayHours <= 20 ? dayHours : 20),
        remainingHours: isAgency ? 0 : (dayHours > 20 ? dayHours - 20 : 0),
        standardPay,
        enhancedPay,
        nightPay,
        totalPay,
        shifts: staffShifts.length
      };
    }).filter(p => p.totalHours > 0); // Only show staff with hours
  };

  const payrollData = calculatePayroll();
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.totalPay, 0);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#0f0f0f',
        paddingBottom: '20px',
        zIndex: 10,
        borderBottom: '2px solid #8b5cf6'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          💰 Payroll Calculator
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          Calculate staff wages using two-tier rate system
        </p>

        {/* Week Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <button
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek - 1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            ← Previous Week
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
              {currentWeek.label}
            </div>
            {selectedWeek === 0 && (
              <div style={{ color: '#8b5cf6', fontSize: '12px', marginTop: '4px' }}>
                Current Week
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek + 1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Payroll
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            £{totalPayroll.toFixed(2)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Staff Working
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payrollData.length}
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
            {payrollData.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Shifts
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payrollData.reduce((sum, p) => sum + p.shifts, 0)}
          </div>
        </div>
      </div>

      {/* Rate Legend */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        marginBottom: '24px'
      }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
          💡 Pay Rate Structure
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#10b981', fontWeight: '600' }}>Standard Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£12.50/h (First 20 hours/week)</span>
          </div>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>Enhanced Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£14.00/h (After 20 hours/week)</span>
          </div>
          <div>
            <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Night Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£15.00/h (All night shifts)</span>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1.2fr',
          padding: '16px',
          backgroundColor: '#252525',
          borderBottom: '1px solid #3a3a3a',
          fontSize: '12px',
          fontWeight: '600',
          color: '#9ca3af'
        }}>
          <div>Staff Name</div>
          <div style={{ textAlign: 'center' }}>Total Hours</div>
          <div style={{ textAlign: 'center' }}>First 20h</div>
          <div style={{ textAlign: 'center' }}>After 20h</div>
          <div style={{ textAlign: 'center' }}>Night Hours</div>
          <div style={{ textAlign: 'right' }}>Standard Pay</div>
          <div style={{ textAlign: 'right' }}>Enhanced Pay</div>
          <div style={{ textAlign: 'right' }}>Night Pay</div>
          <div style={{ textAlign: 'right' }}>Total Pay</div>
        </div>

        {payrollData.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No Payroll Data
            </div>
            <div style={{ fontSize: '14px' }}>
              No shifts assigned for this week
            </div>
          </div>
        ) : (
          payrollData.map((staff, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1.2fr',
                padding: '16px',
                borderBottom: index < payrollData.length - 1 ? '1px solid #2a2a2a' : 'none',
                fontSize: '13px',
                alignItems: 'center'
              }}
            >
              <div style={{ color: 'white', fontWeight: '600' }}>
                {staff.name}
                {staff.isAgency && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}>
                    AGENCY
                  </span>
                )}
                <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                  {staff.shifts} shift{staff.shifts !== 1 ? 's' : ''}
                  {staff.isAgency && staff.agencyName && (
                    <> • {staff.agencyName}</>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center', color: 'white', fontWeight: '600' }}>
                {staff.totalHours.toFixed(1)}h
              </div>
              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                {staff.isAgency ? '—' : `${staff.first20Hours.toFixed(1)}h`}
              </div>
              <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: '600' }}>
                {staff.isAgency || staff.remainingHours === 0 ? '—' : `${staff.remainingHours.toFixed(1)}h`}
              </div>
              <div style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: '600' }}>
                {staff.nightHours > 0 ? `${staff.nightHours.toFixed(1)}h` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: '#10b981' }}>
                £{staff.standardPay.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right', color: '#f59e0b' }}>
                {staff.enhancedPay > 0 ? `£${staff.enhancedPay.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: '#8b5cf6' }}>
                {staff.nightPay > 0 ? `£${staff.nightPay.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                £{staff.totalPay.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Button */}
      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <button
          onClick={() => alert('Export feature coming soon!')}
          onTouchEnd={(e) => {
            e.preventDefault();
            alert('Export feature coming soon!');
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          📄 Export to CSV
        </button>
      </div>
    </div>
  );
};

export default Payroll;

