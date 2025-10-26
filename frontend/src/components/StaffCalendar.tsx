import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronBack, chevronForward, people } from 'ionicons/icons';

interface Shift {
  id: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  siteName: string;
  siteColor: string;
  duration: number;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  isBank: boolean;
}

interface AllShift {
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
  duration: number;
  clockedIn: boolean;
  clockedOut: boolean;
}

interface StaffCalendarProps {
  staffId: string;
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
}

const StaffCalendar: React.FC<StaffCalendarProps> = ({ staffId, shifts, onShiftClick }) => {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [allShifts, setAllShifts] = useState<AllShift[]>([]);

  // Fetch all shifts to see coworkers
  useEffect(() => {
    fetchAllShifts();
  }, []);

  const fetchAllShifts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts`);
      if (response.ok) {
        const data = await response.json();
        setAllShifts(data);
      }
    } catch (error) {
      console.error('Error fetching all shifts:', error);
    }
  };

  // Get month dates
  const getMonthDates = (monthOffset: number = 0) => {
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    // Get first day of month and adjust to Monday
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    
    // Add previous month days to fill the week
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({ date, isCurrentMonth: false });
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(year, month, i);
      dates.push({ date, isCurrentMonth: true });
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - dates.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      dates.push({ date, isCurrentMonth: false });
    }
    
    return { dates, month: targetMonth };
  };

  const { dates: monthDates, month } = getMonthDates(selectedMonth);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get my shifts for a specific date
  const getMyShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr && !s.isBank);
  };

  // Get coworkers for a specific shift
  const getCoworkers = (myShift: Shift) => {
    return allShifts.filter(s => 
      s.date === myShift.date && 
      s.siteName === myShift.siteName && 
      s.type === myShift.type &&
      s.staffId !== staffId &&
      !s.staffName.includes('BANK')
    );
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '16px' }}>
      {/* Month Navigator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px',
        background: '#2a2a2a',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setSelectedMonth(selectedMonth - 1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9333ea',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <IonIcon icon={chevronBack} />
        </button>
        
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {formatMonth(month)}
        </div>
        
        <button
          onClick={() => setSelectedMonth(selectedMonth + 1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9333ea',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <IonIcon icon={chevronForward} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Week Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                color: '#999',
                fontSize: '12px',
                fontWeight: '600',
                padding: '8px 0'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {monthDates.map(({ date, isCurrentMonth }, index) => {
            const myShifts = getMyShiftsForDate(date);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const hasShifts = myShifts.length > 0;

            return (
              <div
                key={index}
                onClick={() => {
                  if (isToday && hasShifts && onShiftClick) {
                    // Click on today's shift opens scanner
                    const todayShift = myShifts.find(s => !s.clockedIn);
                    if (todayShift) onShiftClick(todayShift);
                  }
                }}
                style={{
                  background: isToday && hasShifts ? '#9333ea' : isCurrentMonth ? '#2a2a2a' : '#1a1a1a',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  minHeight: '80px',
                  border: isToday ? '2px solid #9333ea' : '1px solid #3a3a3a',
                  cursor: isToday && hasShifts ? 'pointer' : 'default',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (isToday && hasShifts) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {/* Date Number */}
                <div style={{ 
                  color: isToday && hasShifts ? 'white' : isCurrentMonth ? 'white' : '#666',
                  fontSize: '14px',
                  fontWeight: isToday ? 'bold' : '500',
                  marginBottom: '4px',
                  textAlign: 'center'
                }}>
                  {date.getDate()}
                </div>

                {/* Shift Indicators */}
                {hasShifts && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    alignItems: 'center'
                  }}>
                    {myShifts.map((shift, idx) => {
                      const coworkers = getCoworkers(shift);
                      return (
                        <div
                          key={idx}
                          style={{
                            background: isToday ? 'rgba(255,255,255,0.2)' : shift.siteColor || '#9333ea',
                            borderRadius: '4px',
                            padding: '4px',
                            width: '100%',
                            fontSize: '9px',
                            color: 'white',
                            textAlign: 'center'
                          }}
                          title={`${shift.type} shift at ${shift.siteName}\n${shift.startTime} - ${shift.endTime}${coworkers.length > 0 ? `\nWith: ${coworkers.map(c => c.staffName).join(', ')}` : ''}`}
                        >
                          <div style={{ fontWeight: '600' }}>
                            {shift.type === 'Day' ? '☀️' : '🌙'}
                          </div>
                          {coworkers.length > 0 && (
                            <div style={{ 
                              fontSize: '8px', 
                              marginTop: '2px',
                              opacity: 0.9
                            }}>
                              <IonIcon icon={people} style={{ fontSize: '8px', verticalAlign: 'middle' }} /> {coworkers.length}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Today indicator for shifts */}
                {isToday && hasShifts && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '8px',
                    color: 'white',
                    fontWeight: '600',
                    opacity: 0.8
                  }}>
                    TAP TO CLOCK IN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#2a2a2a',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#999'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#9333ea', fontWeight: '600' }}>●</span> Today's shift (tap to clock in)
        </div>
        <div>
          <IonIcon icon={people} style={{ fontSize: '10px', verticalAlign: 'middle' }} /> Number of coworkers on shift
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;

