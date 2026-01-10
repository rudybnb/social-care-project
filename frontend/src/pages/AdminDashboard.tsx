import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Overview from '../components/Overview';
import Rota from '../components/Rota';
import Sites from '../components/Sites';
import Directory from '../components/Directory';
import Payroll from '../components/Payroll';
import AnnualLeave from '../components/AnnualLeave';
import Attendance from '../components/Attendance';
import ApprovalRequests from '../components/ApprovalRequests';
import UnscheduledPunches from '../components/UnscheduledPunches';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingUnscheduledCount, setPendingUnscheduledCount] = useState(0);

  // Fetch pending leave count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('https://social-care-backend.onrender.com/api/leave/requests');
        const requests = await response.json();
        const pending = requests.filter((r: any) => r.status === 'pending');
        setPendingLeaveCount(pending.length);
      } catch (error) {
        console.error('Failed to fetch pending leave count:', error);
      }
    };
    fetchPendingCount();

    const fetchUnscheduledCount = async () => {
      try {
        // Use /api/shifts and filter for UNSCHED_ prefixed IDs
        const response = await fetch('https://social-care-backend.onrender.com/api/shifts');
        const shifts = await response.json();
        const unscheduled = Array.isArray(shifts) ? shifts.filter((s: any) => s.id && s.id.startsWith('UNSCHED_')) : [];
        setPendingUnscheduledCount(unscheduled.length);
      } catch (error) {
        console.error('Failed to fetch unscheduled count:', error);
      }
    };
    fetchUnscheduledCount();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchUnscheduledCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleMenuClick = (pageId: string) => {
    setCurrentPage(pageId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const menuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'rota', label: 'Rota' },
    { id: 'unscheduled', label: 'Unscheduled' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'room-scans', label: 'Room Scans' },
    { id: 'annual-leave', label: 'Annual Leave' },
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
      case 'annual-leave':
        return <AnnualLeave />;
      case 'payroll':
        return <Payroll />;
      case 'attendance':
        return <Attendance />;
      case 'approvals':
        return <ApprovalRequests />;
      case 'unscheduled':
        return <UnscheduledPunches />;
      default:
        return <div style={{ padding: '20px', color: 'white' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ')}
          </h2>
          <p style={{ color: '#9ca3af' }}>This page is under construction.</p>
        </div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', position: 'relative' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: window.innerWidth > 768 ? 'none' : 'block'
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: '240px',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        position: window.innerWidth <= 768 ? 'fixed' : 'relative',
        left: sidebarOpen || window.innerWidth > 768 ? 0 : '-240px',
        top: 0,
        bottom: 0,
        zIndex: 1000,
        transition: 'left 0.3s ease',
        overflowY: 'auto'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '18px 16px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Main Menu
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSidebarOpen(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              touchAction: 'manipulation',
              lineHeight: 1,
              display: window.innerWidth <= 768 ? 'block' : 'none'
            }}
          >
            ×
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleMenuClick(item.id);
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
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.id === 'annual-leave' && pendingLeaveCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {pendingLeaveCount}
                  </span>
                )}
                {item.id === 'unscheduled' && pendingUnscheduledCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {pendingUnscheduledCount}
                  </span>
                )}
              </span>
            </button>
          ))}

          {/* Administration Section */}
          <div style={{
            padding: '20px 20px 12px',
            marginTop: '20px',
            borderTop: '1px solid #2a2a2a'
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Administration
            </span>
          </div>

          {adminItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleMenuClick(item.id);
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
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.id === 'annual-leave' && pendingLeaveCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {pendingLeaveCount}
                  </span>
                )}
              </span>
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
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: '#9333ea',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setSidebarOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                touchAction: 'manipulation',
                lineHeight: 1,
                display: window.innerWidth <= 768 ? 'block' : 'none'
              }}
            >
              ☰
            </button>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold', display: window.innerWidth <= 480 ? 'none' : 'inline' }}>DEV MODE:</span>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                Admin
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: window.innerWidth <= 480 ? 'none' : 'block'
              }}>
                Manager
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: window.innerWidth <= 480 ? 'none' : 'block'
              }}>
                Worker
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap',
              flexShrink: 0
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

