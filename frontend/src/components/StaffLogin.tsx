import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { person, lockClosed } from 'ionicons/icons';

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
      <IonContent style={{ '--background': '#1a1a1a' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '24px'
        }}>
          {/* Logo/Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <IonIcon icon={person} style={{ fontSize: '40px', color: 'white' }} />
          </div>

          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Staff Portal
          </h1>

          <p style={{
            color: '#9ca3af',
            fontSize: '14px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Sign in to view your shifts and clock in/out
          </p>

          {/* Login Form */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: '#2a2a2a',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #3a3a3a'
          }}>
            {error && (
              <div style={{
                background: '#7f1d1d',
                color: '#fca5a5',
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
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Username
              </label>
              <div style={{
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #3a3a3a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px'
              }}>
                <IonIcon icon={person} style={{ color: '#6b7280', marginRight: '8px' }} />
                <IonInput
                  value={username}
                  onIonChange={e => setUsername(e.detail.value!)}
                  placeholder="Enter your username"
                  style={{
                    '--color': 'white',
                    '--placeholder-color': '#6b7280'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #3a3a3a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px'
              }}>
                <IonIcon icon={lockClosed} style={{ color: '#6b7280', marginRight: '8px' }} />
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                  style={{
                    '--color': 'white',
                    '--placeholder-color': '#6b7280'
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
                '--background': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
            Social Care Management System v2.0
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StaffLogin;

