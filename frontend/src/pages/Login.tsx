import React, { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      // Simple login logic - determine role based on username
      const role = username.toLowerCase().includes('admin') ? 'admin' : 'worker';
      await login(username, role);
      navigate(role === 'admin' ? '/admin' : '/worker');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!loading) {
      onSubmit();
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Social Care Homes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Social Care Homes</h1>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Workforce Portal</h2>
            <p className="text-gray-500">Sign in to access your schedule, attendance, payroll, and more</p>
          </div>
          
          <IonList className="bg-white rounded-lg shadow-lg">
            <IonItem>
              <IonLabel position="stacked">Username</IonLabel>
              <IonInput 
                type="text" 
                value={username} 
                onIonChange={(e) => setUsername(e.detail.value || '')}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput 
                type="password" 
                value={password} 
                onIonChange={(e) => setPassword(e.detail.value || '')}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
              />
            </IonItem>
          </IonList>
          
          <IonButton 
            expand="block" 
            onClick={onSubmit}
            onTouchStart={handleTouchStart}
            disabled={loading}
            className="mt-6"
            size="large"
            style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </IonButton>
          
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>Staff see the mobile interface after sign-in</p>
            <p>Admins and managers see the management dashboard</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;