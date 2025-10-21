import React, { useState } from 'react';
import Modal from './Modal';

const Overview: React.FC = () => {
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftForm, setShiftForm] = useState({
    site: 'Kent Care Home',
    staff: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'Day'
  });

  const careHomes = [
    { name: 'Kent Care Home', location: 'Kent', staff: 'Test Worker', shifts: shifts.filter(s => s.site === 'Kent Care Home').length, color: '#9333ea' },
    { name: 'London Care Home', location: 'London', staff: 'Site Manager', shifts: shifts.filter(s => s.site === 'London Care Home').length, color: '#6366f1' },
    { name: 'Essex Care Home', location: 'Essex', staff: '', shifts: shifts.filter(s => s.site === 'Essex Care Home').length, color: '#8b5cf6' }
  ];

  const handleCreateShift = () => {
    if (!shiftForm.staff || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Please fill in all fields');
      return;
    }

    const newShift = {
      id: Date.now(),
      ...shiftForm
    };

    setShifts([...shifts, newShift]);
    setShowCreateShift(false);
    setShiftForm({
      site: 'Kent Care Home',
      staff: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'Day'
    });
    alert('Shift created successfully!');
  };

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

        <button
          onClick={() => setShowCreateShift(true)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setShowCreateShift(true);
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
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
            width: '100%',
            maxWidth: '200px'
          }}
        >
          + Create Shift
        </button>
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
            Total Staff
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            4
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            Across all sites
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
              backgroundColor: '#fbbf24',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
            Clocked In
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
            0
          </div>
          <div style={{ color: '#fbbf24', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', backgroundColor: '#fbbf24', borderRadius: '50%', display: 'inline-block' }}></span>
            Live now
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
            {shifts.length}
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            {shifts.length} in progress
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
                  <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>{home.shifts}</div>
                </div>
              </div>
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
        {shifts.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shifts.map((shift) => (
              <div key={shift.id} style={{
                backgroundColor: '#1a1a1a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #2a2a2a'
              }}>
                <div style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                  {shift.staff} - {shift.site}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                  {shift.date} • {shift.startTime} - {shift.endTime} • {shift.type} Shift
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Shift Modal */}
      <Modal isOpen={showCreateShift} onClose={() => setShowCreateShift(false)} title="Create New Shift">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Site
            </label>
            <select
              value={shiftForm.site}
              onChange={(e) => setShiftForm({ ...shiftForm, site: e.target.value })}
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
              <option>Kent Care Home</option>
              <option>London Care Home</option>
              <option>Essex Care Home</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Staff Member
            </label>
            <input
              type="text"
              placeholder="Enter staff name"
              value={shiftForm.staff}
              onChange={(e) => setShiftForm({ ...shiftForm, staff: e.target.value })}
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
              Date
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
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
                End Time
              </label>
              <input
                type="time"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
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
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Shift Type
            </label>
            <select
              value={shiftForm.type}
              onChange={(e) => setShiftForm({ ...shiftForm, type: e.target.value })}
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
              <option>Day</option>
              <option>Night</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => setShowCreateShift(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowCreateShift(false);
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
              onClick={handleCreateShift}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleCreateShift();
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
              Create Shift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Overview;

