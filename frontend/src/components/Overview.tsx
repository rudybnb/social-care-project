import React from 'react';

const Overview: React.FC = () => {
  const careHomes = [
    { name: 'Kent Care Home', location: 'Kent', staff: 'Test Worker', shifts: 0, color: '#9333ea' },
    { name: 'London Care Home', location: 'London', staff: 'Site Manager', shifts: 0, color: '#6366f1' },
    { name: 'Essex Care Home', location: 'Essex', staff: '', shifts: 0, color: '#8b5cf6' }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(147, 51, 234, 0.2)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            Good afternoon, Admin
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.9)',
            margin: 0
          }}>
            Sunday, October 19, 2025 • Managing 3 locations
          </p>
        </div>

        <button
          onClick={() => alert('Create Shift clicked')}
          onTouchEnd={(e) => {
            e.preventDefault();
            alert('Create Shift clicked');
          }}
          style={{
            padding: '12px 28px',
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
          + Create Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a',
          transition: 'transform 0.2s',
          cursor: 'default'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Total Staff
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                4
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                Across all sites
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#9333ea',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Clocked In
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                0
              </div>
              <div style={{ color: '#fbbf24', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#fbbf24', borderRadius: '50%', display: 'inline-block' }}></span>
                Live now
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#fbbf24',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Pending
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                0
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                Require approval
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f59e0b',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Today's Shifts
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                0
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                0 in progress
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#6b7280',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Care Homes */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Care Homes
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {careHomes.map((home, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #3a3a3a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: home.color,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '14px',
                  flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                    {home.name}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                    {home.location}
                  </p>
                </div>
                <span style={{ color: home.color, fontSize: '14px', fontWeight: '600' }}>
                  {home.shifts} shifts
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #3a3a3a'
              }}>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Staff assigned</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>0</div>
                </div>
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Today's shifts</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>0</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {/* Upcoming Shifts */}
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              Upcoming Shifts
            </h3>
            <button style={{
              color: '#9333ea',
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              fontWeight: '600'
            }}>
              View All →
            </button>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>
            Next scheduled shifts across all sites
          </p>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '14px' }}>No upcoming shifts scheduled</p>
            <button
              onClick={() => alert('Create First Shift')}
              onTouchEnd={(e) => {
                e.preventDefault();
                alert('Create First Shift');
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                color: '#9333ea',
                border: '1px solid #9333ea',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              + Create First Shift
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              Recent Activity
            </h3>
            <button style={{
              color: '#9333ea',
              fontSize: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              fontWeight: '600'
            }}>
              View All →
            </button>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px' }}>
            Latest attendance records
          </p>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No recent attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

