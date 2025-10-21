import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  const handleLogout = () => {
    console.log('Logout clicked');
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleMenuClick = (section: string) => {
    console.log('Menu clicked:', section);
    setActiveSection(section);
    alert(`${section} section clicked - Would navigate here`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#16213e',
        padding: '20px',
        borderBottom: '2px solid #0f3460'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 5px 0'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#aaa',
          margin: 0
        }}>
          Welcome, {user?.name || 'Admin'}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#16213e',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3880ff' }}>4</div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>Total Staff</div>
        </div>
        <div style={{
          backgroundColor: '#16213e',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd700' }}>0</div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>Clocked In</div>
        </div>
        <div style={{
          backgroundColor: '#16213e',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff00' }}>0</div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>Today's Shifts</div>
        </div>
      </div>

      {/* Menu Buttons */}
      <div style={{
        padding: '0 20px 20px 20px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px'
        }}>
          Quick Actions
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '15px'
        }}>
          {[
            { label: 'Rota', color: '#3880ff' },
            { label: 'Attendance', color: '#10b981' },
            { label: 'Payroll', color: '#f59e0b' },
            { label: 'Reports', color: '#8b5cf6' },
            { label: 'Directory', color: '#ec4899' },
            { label: 'Sites', color: '#06b6d4' },
            { label: 'Settings', color: '#6b7280' },
            { label: 'Queries', color: '#ef4444' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuClick(item.label)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleMenuClick(item.label);
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

      {/* Care Homes */}
      <div style={{
        padding: '0 20px 20px 20px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '15px'
        }}>
          Care Homes
        </h2>
        
        {['Kent Care Home', 'London Care Home', 'Essex Care Home'].map((home, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#16213e',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '15px'
            }}
          >
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: '#ffd700'
            }}>
              {home}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '14px',
              color: '#aaa'
            }}>
              <div>Staff: 0</div>
              <div>Shifts: 0</div>
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div style={{
        padding: '20px',
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#1a1a2e',
        borderTop: '2px solid #0f3460'
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

export default AdminDashboard;

