import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { person, lockClosed } from 'ionicons/icons';
import logo from '../assets/logo.jpeg';

interface StaffLoginProps {
  onLogin: (staffId: string, staffName: string) => void;
}

const StaffLogin: React.FC<StaffLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/auth/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('staff-token', data.token);
        localStorage.setItem('staff-id', data.user.id);
        localStorage.setItem('staff-name', data.user.name);
        onLogin(data.user.id, data.user.name);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#ffffff' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: '#ffffff'
        }}>
          {/* Logo/Header */}
          <img src={logo} alt="Ecclesia Family Centre Logo" style={{ width: '250px', marginBottom: '24px' }} />

          {/* Login Form */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: '#f3f4f6',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#ef4444',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Username
              </label>
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px'
              }}>
                <IonIcon icon={person} style={{ color: '#9ca3af', marginRight: '8px' }} />
                <IonInput
                  value={username}
                  onIonChange={e => setUsername(e.detail.value!)}
                  placeholder="Enter your username"
                  style={{
                    '--color': '#111827',
                    '--placeholder-color': '#9ca3af'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px'
              }}>
                <IonIcon icon={lockClosed} style={{ color: '#9ca3af', marginRight: '8px' }} />
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                  style={{
                    '--color': '#111827',
                    '--placeholder-color': '#9ca3af'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={loading}
              style={{
                '--background': '#2563eb',
                '--border-radius': '8px',
                height: '48px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
            </IonButton>
          </div>

          <div style={{
            color: '#6b7280',
            fontSize: '12px',
            marginTop: '24px',
            textAlign: 'center'
          }}>
            Ecclesia Family Centre App
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StaffLogin;

