import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WorkerLeave from '../components/WorkerLeave';

const WorkerDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'leave'>('dashboard');

  const handleClockIn = () => {
    console.log('Clock In clicked');
    setClockedIn(true);
    alert('Clocked In Successfully!\nTime: ' + new Date().toLocaleTimeString());
  };

  const handleClockOut = () => {
    console.log('Clock Out clicked');
    if (window.confirm('Are you sure you want to clock out?')) {
      setClockedIn(false);
      alert('Clocked Out Successfully!\nTime: ' + new Date().toLocaleTimeString());
    }
  };

  const handleQuickLink = (link: string) => {
    console.log('Quick link clicked:', link);
    alert(`${link} clicked - Would navigate here`);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Show Annual Leave view
  if (currentView === 'leave') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{
          backgroundColor: '#3880ff',
          color: 'white',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Annual Leave</h1>
        </div>
        <WorkerLeave staffId={user?.id || ''} staffName={user?.name || ''} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#3880ff',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 5px 0'
        }}>
          Worker Dashboard
        </h1>
        <p style={{
          fontSize: '14px',
          margin: 0,
          opacity: 0.9
        }}>
          Welcome, {user?.name || 'Worker'}
        </p>
      </div>

      {/* Status Card */}
      <div style={{
        margin: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333'
        }}>
          Today's Shift
        </h2>
        
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            <strong>Time:</strong> 08:00 - 16:00
          </div>
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            <strong>Room:</strong> A-103
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Status:</strong> {clockedIn ? 
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Clocked In</span> : 
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Not Clocked In</span>
            }
          </div>
        </div>

        {/* Clock In/Out Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <button
            onClick={handleClockIn}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClockIn();
            }}
            disabled={clockedIn}
            style={{
              padding: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: clockedIn ? '#ccc' : '#10b981',
              border: 'none',
              borderRadius: '12px',
              cursor: clockedIn ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '70px'
            }}
          >
            {clockedIn ? '✓ CLOCKED IN' : 'CLOCK IN'}
          </button>

          <button
            onClick={handleClockOut}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClockOut();
            }}
            disabled={!clockedIn}
            style={{
              padding: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: !clockedIn ? '#ccc' : '#ef4444',
              border: 'none',
              borderRadius: '12px',
              cursor: !clockedIn ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '70px'
            }}
          >
            CLOCK OUT
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        margin: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333'
        }}>
          Quick Links
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px'
        }}>
          {[
            { label: 'Attendance', color: '#3880ff', action: () => handleQuickLink('Attendance') },
            { label: 'Annual Leave', color: '#ec4899', action: () => setCurrentView('leave') },
            { label: 'Queries', color: '#f59e0b', action: () => handleQuickLink('Queries') },
            { label: 'My Shifts', color: '#8b5cf6', action: () => handleQuickLink('My Shifts') }
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              onTouchEnd={(e) => {
                e.preventDefault();
                item.action();
              }}
              style={{
                padding: '25px 15px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: item.color,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div style={{
        padding: '20px',
        paddingBottom: '40px'
      }}>
        <button
          onClick={handleLogout}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          style={{
            width: '100%',
            padding: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '60px'
          }}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default WorkerDashboard;

