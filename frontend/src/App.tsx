import React from 'react';
import { IonApp, IonContent } from '@ionic/react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import StaffApp from './components/StaffApp';
import DynamicSiteQR from './components/DynamicSiteQR';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ role, children }: { role?: 'admin' | 'worker'; children: React.ReactElement }) {
  const { user } = useAuth();
  console.log('ProtectedRoute check:', { user, requiredRole: role });
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/worker'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/staff" element={<StaffApp />} />
      <Route path="/site-qr/:siteId" element={<DynamicSiteQR />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/*"
        element={
          <ProtectedRoute role="worker">
            <WorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <IonApp>
      <IonContent>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </IonContent>
    </IonApp>
  );
}

export default App;
