import React, { useState } from 'react';

const Rota: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('Monday, Oct 13');

  const weekDays = [
    { day: 'Monday', date: 'Oct 13', dayShifts: 0, nightShifts: 0 },
    { day: 'Tuesday', date: 'Oct 14', dayShifts: 0, nightShifts: 0 },
    { day: 'Wednesday', date: 'Oct 15', dayShifts: 0, nightShifts: 0 },
    { day: 'Thursday', date: 'Oct 16', dayShifts: 0, nightShifts: 0 },
    { day: 'Friday', date: 'Oct 17', dayShifts: 0, nightShifts: 0 },
    { day: 'Saturday', date: 'Oct 18', dayShifts: 0, nightShifts: 0 },
    { day: 'Sunday', date: 'Oct 19', dayShifts: 0, nightShifts: 0 }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Rota Management
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Oct 13 - Oct 19, 2025
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a3a',
              color: 'white',
              border: '1px solid #3a3a4a',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            ← 
          </button>
          <button
            style={{
              padding: '8px 20px',
              backgroundColor: '#2a2a3a',
              color: 'white',
              border: '1px solid #3a3a4a',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Today
          </button>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a3a',
              color: 'white',
              border: '1px solid #3a3a4a',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            →
          </button>
          <select
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a3a',
              color: 'white',
              border: '1px solid #3a3a4a',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option>All Sites</option>
            <option>Kent Care Home</option>
            <option>London Care Home</option>
            <option>Essex Care Home</option>
          </select>
          <button
            onClick={() => alert('Create Shift')}
            onTouchEnd={(e) => {
              e.preventDefault();
              alert('Create Shift');
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Create Shift
          </button>
        </div>
      </div>

      {/* Week View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px',
        marginBottom: '30px'
      }}>
        {weekDays.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDate(`${day.day}, ${day.date}`)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedDate(`${day.day}, ${day.date}`);
            }}
            style={{
              padding: '16px',
              backgroundColor: selectedDate === `${day.day}, ${day.date}` ? '#9333ea' : '#2a2a3a',
              border: `1px solid ${selectedDate === `${day.day}, ${day.date}` ? '#9333ea' : '#3a3a4a'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              textAlign: 'center'
            }}
          >
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              {day.day}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              {day.date}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
              <div>
                <div style={{ color: '#9ca3af' }}>DO</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{day.dayShifts}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af' }}>NO</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{day.nightShifts}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Day Content */}
      <div style={{
        backgroundColor: '#2a2a3a',
        borderRadius: '12px',
        padding: '30px',
        border: '1px solid #3a3a4a'
      }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          {selectedDate} - 0 shifts
        </h2>
        
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
          <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '20px' }}>
            No shifts scheduled for this day
          </p>
          <button
            onClick={() => alert('Create shift for ' + selectedDate)}
            onTouchEnd={(e) => {
              e.preventDefault();
              alert('Create shift for ' + selectedDate);
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
      </div>
    </div>
  );
};

export default Rota;

