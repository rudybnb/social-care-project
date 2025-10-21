import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login button clicked!');
    
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const role = username.toLowerCase().includes('admin') ? 'admin' : 'worker';
      await login(username, role);
      console.log('Login successful, navigating to:', role);
      navigate(role === 'admin' ? '/admin' : '/worker');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Purple Top Bar - Mobile Optimized */}
      <div style={{
        backgroundColor: '#9333ea',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        flexWrap: 'nowrap'
      }}>
        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>DEV MODE:</span>
        <button style={{
          padding: '6px 12px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '11px',
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
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          Manager
        </button>
        <button style={{
          padding: '6px 12px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          Worker
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        {/* Login Card */}
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            backgroundColor: '#9333ea',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              border: '3px solid white',
              borderRadius: '6px'
            }}></div>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0',
            lineHeight: '1.3'
          }}>
            Social Care Homes Workforce Portal
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            margin: '0 0 28px 0',
            lineHeight: '1.5'
          }}>
            Sign in to access your schedule, attendance, payroll, and more
          </p>

          {/* Username Input */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#9333ea'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleLogin();
                }
              }}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#9333ea'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleLogin}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!loading) handleLogin();
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: loading ? '#7c3aed' : '#9333ea',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Footer Text */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '5px 0' }}>Staff see the mobile interface after sign-in</p>
            <p style={{ margin: '5px 0' }}>Admins and managers see the management dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

