import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/react';
import { 
  homeOutline, 
  peopleOutline, 
  calendarOutline, 
  locationOutline, 
  documentTextOutline, 
  settingsOutline,
  statsChartOutline,
  addOutline,
  logOutOutline,
  menuOutline,
  closeOutline
} from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const logoutButtonRef = useRef<HTMLIonButtonElement>(null);
  const sidebarButtonRef = useRef<HTMLIonButtonElement>(null);

  const handleMenuItemClick = (index: number) => {
    console.log(`Menu item ${index} clicked`);
    alert(`Menu item ${index} clicked - Navigation would happen here`);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleSidebarToggle = () => {
    console.log('Sidebar toggle clicked');
    setSidebarOpen(!sidebarOpen);
  };

  // Native event listeners for logout button
  useEffect(() => {
    const button = logoutButtonRef.current;
    if (!button) return;

    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Logout button clicked via native listener');
      handleLogout();
    };

    button.addEventListener('click', handleClick, true);
    button.addEventListener('touchend', handleClick, true);

    return () => {
      button.removeEventListener('click', handleClick, true);
      button.removeEventListener('touchend', handleClick, true);
    };
  }, []);

  // Native event listeners for sidebar toggle button
  useEffect(() => {
    const button = sidebarButtonRef.current;
    if (!button) return;

    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Sidebar toggle clicked via native listener');
      handleSidebarToggle();
    };

    button.addEventListener('click', handleClick, true);
    button.addEventListener('touchend', handleClick, true);

    return () => {
      button.removeEventListener('click', handleClick, true);
      button.removeEventListener('touchend', handleClick, true);
    };
  }, [sidebarOpen]);

  const menuItems = [
    { icon: homeOutline, label: 'Overview', active: true },
    { icon: peopleOutline, label: 'Rota' },
    { icon: calendarOutline, label: 'Attendance' },
    { icon: locationOutline, label: 'Room Guide' },
    { icon: documentTextOutline, label: 'Payroll' },
    { icon: statsChartOutline, label: 'Reports' },
    { icon: peopleOutline, label: 'Queries' },
    { icon: peopleOutline, label: 'Directory' },
    { icon: locationOutline, label: 'Sites' },
    { icon: settingsOutline, label: 'Settings' }
  ];

  const careHomes = [
    { name: 'Kent Care Home', shifts: 0, assigned: 0, todayShifts: 0, role: 'Test Worker' },
    { name: 'London Care Home', shifts: 0, assigned: 0, todayShifts: 0, role: 'Site Manager' },
    { name: 'Essex Care Home', shifts: 0, assigned: 0, todayShifts: 0, role: '' }
  ];

  return (
    <IonPage>
      <div className="flex h-full bg-gray-900 text-white">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 transition-all duration-300 flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              {sidebarOpen && <h2 className="text-lg font-semibold">Main Menu</h2>}
              <IonButton 
                ref={sidebarButtonRef}
                fill="clear" 
                size="small"
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                <IonIcon icon={sidebarOpen ? closeOutline : menuOutline} />
              </IonButton>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 py-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`flex items-center px-4 py-3 mx-2 rounded cursor-pointer transition-colors w-full text-left ${
                  item.active ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => handleMenuItemClick(index)}
                style={{ 
                  touchAction: 'manipulation', 
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: item.active ? '#9333ea' : 'transparent'
                }}
              >
                <IonIcon icon={item.icon} className="text-xl" />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Administration Section */}
          {sidebarOpen && (
            <div className="px-4 py-2 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Administration</p>
              <button 
                className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer w-full text-left"
                onClick={() => alert('Directory clicked')}
                style={{ border: 'none', backgroundColor: 'transparent', touchAction: 'manipulation' }}
              >
                <IonIcon icon={peopleOutline} />
                <span className="ml-3">Directory</span>
              </button>
              <button 
                className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer w-full text-left"
                onClick={() => alert('Sites clicked')}
                style={{ border: 'none', backgroundColor: 'transparent', touchAction: 'manipulation' }}
              >
                <IonIcon icon={locationOutline} />
                <span className="ml-3">Sites</span>
              </button>
              <button 
                className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer w-full text-left"
                onClick={() => alert('Settings clicked')}
                style={{ border: 'none', backgroundColor: 'transparent', touchAction: 'manipulation' }}
              >
                <IonIcon icon={settingsOutline} />
                <span className="ml-3">Settings</span>
              </button>
            </div>
          )}

          {/* User Info */}
          <div className="p-4 border-t border-gray-700">
            {sidebarOpen ? (
              <div>
                <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-400">Site Manager</p>
                <IonButton 
                  ref={logoutButtonRef}
                  fill="clear" 
                  size="small"
                  className="mt-2 text-red-400"
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                >
                  <IonIcon icon={logOutOutline} slot="start" />
                  Logout
                </IonButton>
                {/* Native logout button fallback */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  Native Logout
                </button>
              </div>
            ) : (
              <IonButton 
                ref={logoutButtonRef}
                fill="clear" 
                size="small"
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                <IonIcon icon={logOutOutline} />
              </IonButton>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <IonContent className="bg-gray-900">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Good afternoon, Admin</h1>
                  <p className="text-gray-400">Sunday, October 16, 2024 • Managing 3 locations</p>
                </div>
                <button
                  onClick={() => alert('Create Shift clicked')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <IonIcon icon={addOutline} />
                  Create Shift
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Staff</p>
                      <p className="text-3xl font-bold text-white">4</p>
                      <p className="text-gray-400 text-xs">across all sites</p>
                    </div>
                    <div className="bg-purple-600 p-3 rounded-lg">
                      <IonIcon icon={peopleOutline} className="text-2xl text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Clocked In</p>
                      <p className="text-3xl font-bold text-white">0</p>
                      <p className="text-gray-400 text-xs">staff members</p>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <IonIcon icon={calendarOutline} className="text-2xl text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Rooting</p>
                      <p className="text-3xl font-bold text-white">0</p>
                      <p className="text-gray-400 text-xs">shifts planned</p>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <IonIcon icon={calendarOutline} className="text-2xl text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Today's Shifts</p>
                      <p className="text-3xl font-bold text-white">0</p>
                      <p className="text-gray-400 text-xs">scheduled</p>
                    </div>
                    <div className="bg-gray-600 p-3 rounded-lg">
                      <IonIcon icon={statsChartOutline} className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Care Homes Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {careHomes.map((home, index) => (
                  <div key={index} className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-yellow-500 p-2 rounded">
                          <IonIcon icon={locationOutline} className="text-white" />
                        </div>
                        <h3 className="ml-3 font-semibold text-white">{home.name}</h3>
                      </div>
                      <span className="text-yellow-500 text-sm">{home.shifts} shifts</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Staff assigned</span>
                        <span className="text-white">{home.assigned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Today's shifts</span>
                        <span className="text-white">{home.todayShifts}</span>
                      </div>
                      {home.role && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">{home.role}</span>
                          <span className="text-white">{home.todayShifts}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Shifts */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Upcoming Shifts</h3>
                    <span className="text-purple-400 text-sm cursor-pointer">View All →</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Here's a preview of the activity at sites</p>
                  <div className="flex flex-col items-center justify-center py-8">
                    <IonIcon icon={calendarOutline} className="text-4xl text-gray-600 mb-2" />
                    <p className="text-gray-400">No upcoming shifts scheduled</p>
                    <button
                      onClick={() => alert('Create First Shift clicked')}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#a78bfa',
                        border: 'none',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <IonIcon icon={addOutline} />
                      Create First Shift
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                    <span className="text-purple-400 text-sm cursor-pointer">View All →</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Track attendance activity</p>
                  <div className="flex flex-col items-center justify-center py-8">
                    <IonIcon icon={statsChartOutline} className="text-4xl text-gray-600 mb-2" />
                    <p className="text-gray-400">No recent attendance</p>
                  </div>
                </div>
              </div>
            </div>
          </IonContent>
        </div>
      </div>
    </IonPage>
  );
};

export default AdminDashboard;

