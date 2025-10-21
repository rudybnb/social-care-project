import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Overview from '../components/Overview';
import Rota from '../components/Rota';
import Sites from '../components/Sites';
import Directory from '../components/Directory';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'rota', label: 'Rota', icon: '📅' },
    { id: 'attendance', label: 'Attendance', icon: '⏰' },
    { id: 'room-scans', label: 'Room Scans', icon: '🏠' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'queries', label: 'Queries', icon: '💬' }
  ];

  const adminItems = [
    { id: 'directory', label: 'Directory', icon: '👥' },
    { id: 'sites', label: 'Sites', icon: '🏢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'rota':
        return <Rota />;
      case 'sites':
        return <Sites />;
      case 'directory':
        return <Directory />;
      default:
        return <div style={{ padding: '20px', color: 'white' }}>
          <h2>{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page</h2>
          <p>This page is under construction.</p>
        </div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '200px',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>
              Main Menu
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSidebarCollapsed(!sidebarCollapsed);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              touchAction: 'manipulation'
            }}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setCurrentPage(item.id);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: currentPage === item.id ? '#9333ea' : 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                touchAction: 'manipulation',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}

          {/* Administration Section */}
          {!sidebarCollapsed && (
            <div style={{
              padding: '16px 16px 8px',
              marginTop: '16px',
              borderTop: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                Administration
              </span>
            </div>
          )}

          {adminItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setCurrentPage(item.id);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: currentPage === item.id ? '#9333ea' : 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                touchAction: 'manipulation',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* User Info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {!sidebarCollapsed ? (
            <>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {(user?.name || 'Admin')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Admin User'}
                </div>
                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                  Site Manager
                </div>
              </div>
            </>
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0 auto'
            }}>
              {(user?.name || 'Admin')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: '#9333ea',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>DEV MODE:</span>
            <button style={{
              padding: '6px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              👤 Admin
            </button>
            <button style={{
              padding: '6px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              💼 Manager
            </button>
            <button style={{
              padding: '6px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              👷 Worker
            </button>
            <button style={{
              padding: '6px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              📥 Sample ZIP
            </button>
          </div>
          <button
            onClick={handleLogout}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{
              padding: '6px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1a1a1a' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

