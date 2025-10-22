import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { sharedSites, getStaff, subscribeToDataChange, StaffMember, getAgencyWorkers, getShifts } from '../data/sharedData';

const Overview: React.FC = () => {

  const [sites] = sharedSites; // Use shared sites
  const [staff, setStaff] = useState<StaffMember[]>(getStaff());
  const [agencyWorkers, setAgencyWorkers] = useState(getAgencyWorkers());
  const [shifts, setShifts] = useState<any[]>([]);
  
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

      {/* Upcoming Shifts */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #3a3a3a'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: 0 }}>
            Upcoming Shifts
          </h3>
        </div>
        {upcomingShifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <p style={{ color: '#9ca3af', marginBottom: '14px', fontSize: '13px' }}>No upcoming shifts scheduled</p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {upcomingShifts.map((shift) => {
              // Check if staff member is agency worker (check both staff and agencyWorkers arrays)
              const isAgency = agencyWorkers.find(w => w.name === shift.staffName) || 
                               staff.find(s => s.name === shift.staffName && 'agencyName' in s);
              const shiftTypeColor = shift.type === 'Day' ? '#fbbf24' : '#8b5cf6';
              const shiftTypeBg = shift.type === 'Day' ? '#fbbf2420' : '#8b5cf620';
              
              return (
                <div key={shift.id} style={{
                  backgroundColor: '#1a1a1a',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  {/* Date Badge */}
                  <div style={{
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '8px',
                    backgroundColor: `${shift.siteColor}20`,
                    borderRadius: '8px',
                    border: `2px solid ${shift.siteColor}`
                  }}>
                    <div style={{ color: shift.siteColor, fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                      {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {new Date(shift.date).getDate()}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                      {new Date(shift.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </div>
                  </div>
                  
                  {/* Shift Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ 
                        color: isAgency ? '#10b981' : 'white', 
                        fontSize: '15px', 
                        fontWeight: '600' 
                      }}>
                        {shift.staffName}
                      </span>
                      {isAgency && (
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: '#10b98120',
                          color: '#10b981',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          AGENCY
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: shift.siteColor,
                          borderRadius: '50%'
                        }}></div>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{shift.siteName}</span>
                      </div>
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>•</span>
                      <span style={{ color: '#9ca3af', fontSize: '13px' }}>{shift.startTime} - {shift.endTime}</span>
                    </div>
                  </div>
                  
                  {/* Shift Type Badge */}
                  <div style={{
                    padding: '6px 12px',
                    backgroundColor: shiftTypeBg,
                    border: `1px solid ${shiftTypeColor}40`,
                    borderRadius: '6px',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: shiftTypeColor, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                      {shift.type === 'Day' ? '☀️ DAY' : '🌙 NIGHT'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};

export default Overview;

