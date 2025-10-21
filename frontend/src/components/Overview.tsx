import React from 'react';

const Overview: React.FC = () => {
  const careHomes = [
    { name: 'Kent Care Home', location: 'Kent', staff: 'Test Worker', shifts: 0 },
    { name: 'London Care Home', location: 'London', staff: 'Site Manager', shifts: 0 },
    { name: 'Essex Care Home', location: 'Essex', staff: '', shifts: 0 }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px'
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
            padding: '12px 24px',
            backgroundColor: '#9333ea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Create Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Total Staff
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
                4
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                Across all sites
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#9333ea',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👥
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Clocked In
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
                0
              </div>
              <div style={{ color: '#fbbf24', fontSize: '12px' }}>
                🟡 Live now
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#fbbf24',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⏰
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Pending
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
                0
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                Require approval
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#f59e0b',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⏳
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Today's Shifts
              </div>
              <div style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
                0
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                0 in progress
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#6b7280',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📅
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {careHomes.map((home, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#2a2a3a',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #3a3a4a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#fbbf24',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginRight: '12px'
                }}>
                  🏢
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                    {home.name}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                    {home.location}
                  </p>
                </div>
                <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600' }}>
                  {home.shifts} shifts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>Staff assigned</span>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>Today's shifts</span>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>0</span>
                </div>
                {home.staff && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>{home.staff}</span>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>0</span>
                  </div>
                )}
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
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
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
              touchAction: 'manipulation'
            }}>
              View All →
            </button>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
            Next scheduled shifts across all sites
          </p>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>No upcoming shifts scheduled</p>
            <button
              onClick={() => alert('Create First Shift')}
              onTouchEnd={(e) => {
                e.preventDefault();
                alert('Create First Shift');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#9333ea',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              ➕ Create First Shift
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: '#2a2a3a',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a3a4a'
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
              touchAction: 'manipulation'
            }}>
              View All →
            </button>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
            Latest attendance records
          </p>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
            <p style={{ color: '#9ca3af' }}>No recent attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

