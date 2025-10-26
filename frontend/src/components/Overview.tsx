import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { sharedSites, getStaff, subscribeToDataChange, StaffMember, getAgencyWorkers, getShifts } from '../data/sharedData';

const Overview: React.FC = () => {

  const [sites] = sharedSites; // Use shared sites
  const [staff, setStaff] = useState<StaffMember[]>(getStaff());
  const [agencyWorkers, setAgencyWorkers] = useState(getAgencyWorkers());
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  
  // Subscribe to all data changes (staff, agency workers, shifts)
  useEffect(() => {
    // Initial load
    setShifts(getShifts());
    
    const unsubscribe = subscribeToDataChange(() => {
      setStaff(getStaff());
      setAgencyWorkers(getAgencyWorkers());
      setShifts(getShifts());
    });
    return unsubscribe;
  }, []);



  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  const todayShifts = shifts.filter(s => s.date === today);
  
  // DEBUG: Log shifts data
  console.log('📊 Overview Debug:');
  console.log('Total shifts:', shifts.length);
  console.log('All shifts:', shifts);
  console.log('Today:', today);
  console.log('Sites:', sites);
  
  // Get upcoming shifts (today and future) - 1 month
  const oneMonthFromNow = new Date(todayDate);
  oneMonthFromNow.setDate(todayDate.getDate() + 30);
  
  const upcomingShifts = shifts.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= todayDate && shiftDate <= oneMonthFromNow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Show all shifts in next 30 days
  
  // DEBUG: Log upcoming shifts
  console.log('📅 Upcoming Shifts:', upcomingShifts.map(s => ({
    date: s.date,
    type: s.type,
    staff: s.staffName,
    site: s.siteName
  })));

  const careHomes = sites.filter(s => s.status === 'Active').map(site => ({
    id: site.id,
    name: site.name,
    location: site.location,
    address: site.address,
    postcode: site.postcode,
    shifts: shifts.filter(s => String(s.siteId) === String(site.id)).length,
    todayShifts: todayShifts.filter(s => String(s.siteId) === String(site.id)).length,
    color: site.color
  }));



  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          borderRadius: '12px',
          padding: '24px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(147, 51, 234, 0.2)'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 6px 0',
            lineHeight: '1.3'
          }}>
            Good afternoon, Admin
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Sunday, October 19, 2025 • Managing 3 locations
          </p>
        </div>
      </div>

      {/* Declined Shifts Alert */}
      {(() => {
        const declinedShifts = shifts.filter(s => s.staffStatus === 'declined');
        if (declinedShifts.length === 0) return null;
        
        return (
          <div style={{
            backgroundColor: '#7f1d1d',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: '#fca5a5',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  ⚠️ {declinedShifts.length} SHIFT{declinedShifts.length > 1 ? 'S' : ''} DECLINED
                </h3>
                <p style={{
                  color: '#fecaca',
                  fontSize: '14px',
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  The following staff members have declined their assigned shifts. Immediate action required to maintain 24-hour coverage.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {declinedShifts.map(shift => (
                    <div key={shift.id} style={{
                      backgroundColor: '#991b1b',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      border: '1px solid #dc2626'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                            {shift.staffName}
                          </div>
                          <div style={{ color: '#fca5a5', fontSize: '13px' }}>
                            {shift.siteName} • {shift.type} Shift • {new Date(shift.date).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#7f1d1d',
                          color: '#fca5a5',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          border: '1px solid #991b1b'
                        }}>
                          DECLINED
                        </div>
                      </div>
                      {shift.declineReason && (
                        <div style={{
                          color: '#fecaca',
                          fontSize: '12px',
                          fontStyle: 'italic',
                          paddingTop: '8px',
                          borderTop: '1px solid #7f1d1d'
                        }}>
                          Reason: {shift.declineReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#7f1d1d',
                  borderRadius: '8px',
                  border: '1px solid #991b1b'
                }}>
                  <div style={{ color: '#fca5a5', fontSize: '13px', fontWeight: '600' }}>
                    ⚠️ WARNING: 24HR COVERAGE AT RISK
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '18px 16px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#9333ea',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
            Permanent Staff
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            {staff.filter(s => s.status === 'Active').length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            Active employees
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '18px 16px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#10b981',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="17" y1="11" x2="23" y2="11"></line>
              </svg>
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
            Agency Workers
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            {agencyWorkers.filter(w => w.status === 'Active').length}
          </div>
          <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            Active contracts
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '18px 16px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f59e0b',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
            Pending
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            0
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            Require approval
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '18px 16px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#6b7280',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
            Today's Shifts
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            {todayShifts.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            {todayShifts.length} in progress
          </div>
        </div>
      </div>

      {/* Care Homes */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Care Homes
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {careHomes.map((home, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #3a3a3a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: home.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {home.name}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                    {home.location}
                  </p>
                </div>
                <span style={{ color: home.color, fontSize: '13px', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>
                  {home.shifts} shifts
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #3a3a3a'
              }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Staff assigned</div>
                  <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>0</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Today's shifts</div>
                  <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>{home.todayShifts}</div>
                </div>
              </div>
              
              {/* Upcoming Shifts for this site */}
              {(() => {
                const siteUpcomingShifts = upcomingShifts.filter(s => String(s.siteId) === String(home.id)).slice(0, 5);
                if (siteUpcomingShifts.length === 0) return null;
                
                return (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #3a3a3a' }}>
                    <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                      Upcoming Shifts (Next 5)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {siteUpcomingShifts.map((shift) => {
                        const isAgency = agencyWorkers.find(w => w.name === shift.staffName) || 
                                         staff.find(s => s.name === shift.staffName && 'agencyName' in s);
                        const shiftTypeColor = shift.type === 'Day' ? '#fbbf24' : '#8b5cf6';
                        const shiftTypeBg = shift.type === 'Day' ? '#fbbf2420' : '#8b5cf620';
                        const isBank = shift.isBank || shift.staffId === 'BANK';
                        
                        return (
                          <div key={shift.id} style={{
                            backgroundColor: '#1a1a1a',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #2a2a2a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            {/* Date */}
                            <div style={{
                              minWidth: '45px',
                              textAlign: 'center',
                              padding: '6px',
                              backgroundColor: `${home.color}20`,
                              borderRadius: '6px',
                              border: `1px solid ${home.color}40`
                            }}>
                              <div style={{ color: home.color, fontSize: '10px', fontWeight: '600' }}>
                                {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
                              </div>
                              <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                {new Date(shift.date).getDate()}
                              </div>
                            </div>
                            
                            {/* Shift Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                color: isBank ? '#f59e0b' : (isAgency ? '#10b981' : 'white'), 
                                fontSize: '13px', 
                                fontWeight: '600',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {isBank ? '🏦 ' : ''}{shift.staffName}
                              </div>
                              <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                                {shift.startTime} - {shift.endTime}
                              </div>
                            </div>
                            
                            {/* Shift Type Badge */}
                            <div style={{
                              padding: '4px 8px',
                              backgroundColor: shiftTypeBg,
                              border: `1px solid ${shiftTypeColor}40`,
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              color: shiftTypeColor,
                              flexShrink: 0
                            }}>
                              {shift.type === 'Day' ? '☀️' : '🌙'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Shifts - Calendar View */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #3a3a3a'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: 0, marginBottom: '4px' }}>
              Upcoming Shifts Calendar
            </h3>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>
            Next 30 Days
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px'
        }}>
          {/* Day labels */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div key={`day-${idx}`} style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '11px',
              fontWeight: '600',
              padding: '8px 0',
              letterSpacing: '0.5px'
            }}>
              {day}
            </div>
          ))}
          
          {/* Calendar dates */}
          {(() => {
            const calendarDates = [];
            const startDate = new Date(todayDate);
            
            // Find the Monday of the current week
            const currentDay = startDate.getDay();
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
            startDate.setDate(startDate.getDate() + mondayOffset);
            
            // Generate 35 days (5 weeks) to show full month view
            for (let i = 0; i < 35; i++) {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const dateNum = date.getDate();
              const isToday = dateStr === today;
              const isPast = date < todayDate;
              const isCurrentMonth = date.getMonth() === todayDate.getMonth();
              
              // Get shifts for this date
              const dateShifts = shifts.filter(s => s.date === dateStr);
              const siteColors = new Set(dateShifts.map(s => s.siteColor));
              const hasShifts = dateShifts.length > 0;
              
              calendarDates.push(
                <div
                  key={dateStr}
                  onClick={() => {
                    if (!isPast) {
                      setSelectedDate(dateStr);
                      setShowDateModal(true);
                    }
                  }}
                  style={{
                    backgroundColor: isPast ? '#1a1a1a' : '#2a2a2a',
                    borderRadius: '8px',
                    padding: '10px 8px',
                    minHeight: '80px',
                    border: isToday ? '2px solid #6366f1' : '1px solid #3a3a3a',
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    opacity: isPast ? 0.4 : (isCurrentMonth ? 1 : 0.6),
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !isPast && (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {/* Date number */}
                  <div style={{
                    color: isToday ? '#6366f1' : (isPast ? '#6b7280' : 'white'),
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    {dateNum}
                  </div>
                  
                  {/* Site color indicators */}
                  {hasShifts ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      alignItems: 'center'
                    }}>
                      {Array.from(siteColors).map((color, idx) => (
                        <div key={idx} style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: color,
                          borderRadius: '3px'
                        }} />
                      ))}
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '10px',
                        fontWeight: '600',
                        marginTop: '2px'
                      }}>
                        {dateShifts.length} shift{dateShifts.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    !isPast && (
                      <div style={{
                        color: '#6b7280',
                        fontSize: '10px',
                        textAlign: 'center',
                        marginTop: '8px'
                      }}>
                        No shifts
                      </div>
                    )
                  )}
                  
                  {/* Today indicator */}
                  {isToday && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: '#6366f1',
                      color: 'white',
                      fontSize: '8px',
                      fontWeight: '700',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      letterSpacing: '0.5px'
                    }}>
                      TODAY
                    </div>
                  )}
                </div>
              );
            }
            return calendarDates;
          })()}
        </div>
        
        {/* Legend */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #3a3a3a',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {sites.filter(s => s.status === 'Active').map(site => (
            <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '20px',
                height: '8px',
                backgroundColor: site.color,
                borderRadius: '4px'
              }} />
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{site.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Date Details Modal */}
      {showDateModal && selectedDate && (
        <Modal
          isOpen={showDateModal}
          title={`Shifts for ${new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
          onClose={() => {
            setShowDateModal(false);
            setSelectedDate(null);
          }}
        >
          {(() => {
            const dateShifts = shifts.filter(s => s.date === selectedDate);
            
            if (dateShifts.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                    No shifts assigned for this date
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    Go to Rota to assign shifts
                  </div>
                </div>
              );
            }
            
            // Group shifts by site
            const shiftsBySite: { [key: string]: any[] } = {};
            dateShifts.forEach(shift => {
              if (!shiftsBySite[shift.siteName]) {
                shiftsBySite[shift.siteName] = [];
              }
              shiftsBySite[shift.siteName].push(shift);
            });
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(shiftsBySite).map(([siteName, siteShifts]) => {
                  const siteColor = siteShifts[0].siteColor;
                  return (
                    <div key={siteName} style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '8px',
                      padding: '16px',
                      border: `1px solid ${siteColor}40`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: siteColor,
                          borderRadius: '50%'
                        }} />
                        <h4 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                          {siteName}
                        </h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {siteShifts.map(shift => {
                          const isAgency = agencyWorkers.find(w => w.name === shift.staffName) || 
                                           staff.find(s => s.name === shift.staffName && 'agencyName' in s);
                          const isBank = shift.isBank || shift.staffId === 'BANK';
                          const shiftTypeColor = shift.type === 'Day' ? '#fbbf24' : '#8b5cf6';
                          
                          return (
                            <div key={shift.id} style={{
                              backgroundColor: '#2a2a2a',
                              padding: '12px',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{
                                  color: isBank ? '#f59e0b' : (isAgency ? '#10b981' : 'white'),
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  marginBottom: '4px'
                                }}>
                                  {isBank ? '🏦 ' : ''}{shift.staffName}
                                  {isAgency && !isBank && (
                                    <span style={{
                                      marginLeft: '6px',
                                      padding: '2px 6px',
                                      backgroundColor: '#10b98120',
                                      color: '#10b981',
                                      borderRadius: '4px',
                                      fontSize: '9px',
                                      fontWeight: '700'
                                    }}>
                                      AGENCY
                                    </span>
                                  )}
                                  {isBank && (
                                    <span style={{
                                      marginLeft: '6px',
                                      padding: '2px 6px',
                                      backgroundColor: '#f59e0b20',
                                      color: '#f59e0b',
                                      borderRadius: '4px',
                                      fontSize: '9px',
                                      fontWeight: '700'
                                    }}>
                                      PENDING
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                                  {shift.startTime} - {shift.endTime}
                                </div>
                              </div>
                              <div style={{
                                padding: '6px 12px',
                                backgroundColor: `${shiftTypeColor}20`,
                                border: `1px solid ${shiftTypeColor}40`,
                                borderRadius: '6px',
                                color: shiftTypeColor,
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {shift.type === 'Day' ? '☀️ DAY' : '🌙 NIGHT'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Modal>
      )}


    </div>
  );
};

export default Overview;

