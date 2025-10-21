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
    { id: 'overview', label: 'Overview' },
    { id: 'rota', label: 'Rota' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'room-scans', label: 'Room Scans' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'reports', label: 'Reports' },
    { id: 'queries', label: 'Queries' }
  ];

  const adminItems = [
    { id: 'directory', label: 'Directory' },
    { id: 'sites', label: 'Sites' },
    { id: 'settings', label: 'Settings' }
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
        return <div style={{ padding: '30px', color: 'white' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ')}
          </h2>
          <p style={{ color: '#9ca3af' }}>This page is under construction.</p>
        </div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '220px',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
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
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              touchAction: 'manipulation',
              lineHeight: 1
            }}
          >
            {sidebarCollapsed ? '☰' : '×'}
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
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
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: currentPage === item.id ? '#9333ea' : 'transparent',
                color: currentPage === item.id ? 'white' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: currentPage === item.id ? '600' : '500',
                textAlign: 'left',
                touchAction: 'manipulation',
                transition: 'all 0.2s',
                borderLeft: currentPage === item.id ? '3px solid #9333ea' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }
              }}
            >
              {!sidebarCollapsed && <span>{item.label}</span>}
              {sidebarCollapsed && <span style={{ fontSize: '12px' }}>{item.label.substring(0, 2).toUpperCase()}</span>}
            </button>
          ))}

          {/* Administration Section */}
          {!sidebarCollapsed && (
            <div style={{
              padding: '20px 20px 12px',
              marginTop: '20px',
              borderTop: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Administration
              </span>
            </div>
          )}

          {sidebarCollapsed && (
            <div style={{
              height: '1px',
              backgroundColor: '#2a2a2a',
              margin: '20px 10px'
            }}></div>
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
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: currentPage === item.id ? '#9333ea' : 'transparent',
                color: currentPage === item.id ? 'white' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: currentPage === item.id ? '600' : '500',
                textAlign: 'left',
                touchAction: 'manipulation',
                transition: 'all 0.2s',
                borderLeft: currentPage === item.id ? '3px solid #9333ea' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }
              }}
            >
              {!sidebarCollapsed && <span>{item.label}</span>}
              {sidebarCollapsed && <span style={{ fontSize: '12px' }}>{item.label.substring(0, 2).toUpperCase()}</span>}
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
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {(user?.name || 'Admin')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Admin User'}
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  Site Manager
                </div>
              </div>
            </>
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
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
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              Admin
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
              Manager
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
              Worker
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
              Sample ZIP
            </button>
          </div>
          <button
            onClick={handleLogout}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{
              padding: '8px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Logout
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

