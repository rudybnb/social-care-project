import React, { useState, useEffect } from 'react';
import StaffLogin from './StaffLogin';
import StaffDashboard from './StaffDashboard';
import StaffProgress from './StaffProgress';
import StaffPayrollView from './StaffPayrollView';
import WorkerLeave from './WorkerLeave';

type View = 'login' | 'dashboard' | 'progress' | 'payroll' | 'leave';

interface Shift {
  id: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  siteName: string;
  siteColor: string;
  duration: number;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  isBank: boolean;
}

const StaffApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  const [staffId, setStaffId] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('');
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Check if already logged in
  useEffect(() => {
    const savedStaffId = localStorage.getItem('staff-id');
    const savedStaffName = localStorage.getItem('staff-name');
    const savedToken = localStorage.getItem('staff-token');

    if (savedStaffId && savedStaffName && savedToken) {
      setStaffId(savedStaffId);
      setStaffName(savedStaffName);
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (id: string, name: string) => {
    setStaffId(id);
    setStaffName(name);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('staff-token');
    localStorage.removeItem('staff-id');
    localStorage.removeItem('staff-name');
    setStaffId('');
    setStaffName('');
    setCurrentView('login');
  };

  const handleViewProgress = () => {
    setCurrentView('progress');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewPayroll = () => {
    setCurrentView('payroll');
  };

  const handleViewAnnualLeave = () => {
    setCurrentView('leave');
  };

  if (currentView === 'login') {
    return <StaffLogin onLogin={handleLogin} />;
  }

  if (currentView === 'progress') {
    return <StaffProgress shifts={shifts} staffName={staffName} />;
  }

  if (currentView === 'payroll') {
    // Get staff member's standard rate
    const { getAllWorkers } = require('../data/sharedData');
    const allWorkers = getAllWorkers();
    const worker = allWorkers.find((w: any) => w.id === staffId);
    const standardRate = worker ? parseFloat(worker.standardRate) || 12.50 : 12.50;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <div style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={handleBackToDashboard}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>My Payroll</h1>
        </div>
        <StaffPayrollView 
          staffId={staffId}
          staffName={staffName}
          standardRate={standardRate}
        />
      </div>
    );
  }

  if (currentView === 'leave') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <div style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button
            onClick={handleBackToDashboard}
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
        <WorkerLeave staffId={staffId} staffName={staffName} />
      </div>
    );
  }

  return (
    <StaffDashboard 
      staffId={staffId} 
      staffName={staffName} 
      onLogout={handleLogout}
      onViewPayroll={handleViewPayroll}
      onViewAnnualLeave={handleViewAnnualLeave}
    />
  );
};

export default StaffApp;

