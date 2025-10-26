import React, { useState, useEffect } from 'react';
import StaffLogin from './StaffLogin';
import StaffDashboard from './StaffDashboard';
import StaffProgress from './StaffProgress';
import StaffPayroll from './StaffPayroll';

type View = 'login' | 'dashboard' | 'progress' | 'payroll';

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

  if (currentView === 'login') {
    return <StaffLogin onLogin={handleLogin} />;
  }

  if (currentView === 'progress') {
    return <StaffProgress shifts={shifts} staffName={staffName} />;
  }

  if (currentView === 'payroll') {
    return (
      <StaffPayroll 
        staffId={staffId}
        staffName={staffName}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <StaffDashboard 
      staffId={staffId} 
      staffName={staffName} 
      onLogout={handleLogout}
      onViewPayroll={handleViewPayroll}
    />
  );
};

export default StaffApp;

