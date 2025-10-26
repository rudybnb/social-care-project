import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonBadge } from '@ionic/react';
import { chevronBack, chevronForward, people } from 'ionicons/icons';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  siteColor: string;
  date: string;
  type: 'Day' | 'Night';
  startTime: string;
  endTime: string;
  duration: number;
  clockedIn: boolean;
  clockedOut: boolean;
}

interface StaffCalendarProps {
  staffId: string;
  shifts: Shift[];
}

const StaffCalendar: React.FC<StaffCalendarProps> = ({ staffId, shifts }) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);

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

  // Get current week dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get my shifts for a specific date
  const getMyShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr);
  };

  // Get coworkers for a specific shift
  const getCoworkers = (myShift: Shift) => {
    return allShifts.filter(s => 
      s.date === myShift.date && 
      s.siteId === myShift.siteId && 
      s.type === myShift.type &&
      s.staffId !== staffId &&
      !s.staffName.includes('BANK')
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Week Navigator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px',
        background: '#2a2a2a',
        borderRadius: '12px'
      }}>
        <IonButton
          fill="clear"
          onClick={() => setSelectedWeek(selectedWeek - 1)}
          style={{ color: '#9333ea' }}
        >
          <IonIcon icon={chevronBack} />
        </IonButton>
        
        <div style={{ 
          color: 'white', 
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </div>
        
        <IonButton
          fill="clear"
          onClick={() => setSelectedWeek(selectedWeek + 1)}
          style={{ color: '#9333ea' }}
        >
          <IonIcon icon={chevronForward} />
        </IonButton>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {weekDates.map((date, index) => {
          const myShifts = getMyShiftsForDate(date);
          const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

          return (
            <div
              key={index}
              style={{
                background: isToday ? '#3a2a5a' : '#2a2a2a',
                borderRadius: '12px',
                padding: '12px 8px',
                border: isToday ? '2px solid #9333ea' : 'none',
                minHeight: '200px'
              }}
            >
              {/* Day Header */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #444'
              }}>
                <div style={{ 
                  color: '#999', 
                  fontSize: '11px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {weekDays[index]}
                </div>
                <div style={{ 
                  color: isToday ? '#9333ea' : 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {date.getDate()}
                </div>
              </div>

              {/* Shifts */}
              {myShifts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {myShifts.map(shift => {
                    const coworkers = getCoworkers(shift);
                    return (
                      <div
                        key={shift.id}
                        style={{
                          background: shift.siteColor || '#9333ea',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ 
                          color: 'white',
                          fontWeight: '600',
                          marginBottom: '4px',
                          fontSize: '10px'
                        }}>
                          {shift.type === 'Day' ? '☀️' : '🌙'} {shift.type}
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '9px',
                          marginBottom: '6px'
                        }}>
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div style={{ 
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '9px',
                          marginBottom: '6px',
                          fontWeight: '500'
                        }}>
                          {shift.siteName}
                        </div>
                        {coworkers.length > 0 && (
                          <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            padding: '4px',
                            marginTop: '6px'
                          }}>
                            <div style={{
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '8px',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <IonIcon icon={people} style={{ fontSize: '10px' }} />
                              <span>With:</span>
                            </div>
                            {coworkers.map((coworker, idx) => (
                              <div
                                key={idx}
                                style={{
                                  color: 'white',
                                  fontSize: '9px',
                                  fontWeight: '500',
                                  marginTop: '2px'
                                }}
                              >
                                • {coworker.staffName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  color: '#666', 
                  fontSize: '10px',
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  No shifts
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffCalendar;

