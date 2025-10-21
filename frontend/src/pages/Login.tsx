import React, { useState, useEffect, useRef } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const loginButtonRef = useRef<HTMLIonButtonElement>(null);

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

  // Native DOM event listener to bypass Ionic's event system
  useEffect(() => {
    const button = loginButtonRef.current;
    if (!button) return;

    // Get the actual button element inside the ion-button shadow DOM
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button clicked via native listener');
      if (!loading) {
        onSubmit();
      }
    };

    const handleTouchEnd = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button touched via native listener');
      if (!loading) {
        onSubmit();
      }
    };

    // Add multiple event listeners for maximum compatibility
    button.addEventListener('click', handleClick, true);
    button.addEventListener('touchend', handleTouchEnd, true);
    
    // Also try to access shadow DOM button
    setTimeout(() => {
      const shadowRoot = button.shadowRoot;
      if (shadowRoot) {
        const nativeButton = shadowRoot.querySelector('button');
        if (nativeButton) {
          nativeButton.addEventListener('click', handleClick, true);
          nativeButton.addEventListener('touchend', handleTouchEnd, true);
        }
      }
    }, 100);

    return () => {
      button.removeEventListener('click', handleClick, true);
      button.removeEventListener('touchend', handleTouchEnd, true);
      const shadowRoot = button.shadowRoot;
      if (shadowRoot) {
        const nativeButton = shadowRoot.querySelector('button');
        if (nativeButton) {
          nativeButton.removeEventListener('click', handleClick, true);
          nativeButton.removeEventListener('touchend', handleTouchEnd, true);
        }
      }
    };
  }, [loading, username, password]);

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
            ref={loginButtonRef}
            expand="block" 
            disabled={loading}
            className="mt-6"
            size="large"
            style={{ 
              cursor: 'pointer', 
              touchAction: 'manipulation',
              pointerEvents: 'auto'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </IonButton>
          
          {/* Fallback native button for testing */}
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '16px',
              backgroundColor: '#3880ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            {loading ? 'Signing in...' : 'Native Sign In Button'}
          </button>
          
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>Staff see the mobile interface after sign-in</p>
            <p>Admins and managers see the management dashboard</p>
            <p className="mt-2 text-xs text-blue-500">Try the native button if the Ionic button doesn't work</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

