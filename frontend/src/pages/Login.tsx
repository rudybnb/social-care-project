import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

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
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar - Mobile Optimized */}
      <div style={{
        backgroundColor: '#2563eb',
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
          backgroundColor: '#1d4ed8',
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
          backgroundColor: '#1d4ed8',
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
          backgroundColor: '#1d4ed8',
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
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <img src={logo} alt="Ecclesia Family Centre Logo" style={{ width: '250px', marginBottom: '24px' }} />

          {/* Title */}
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 8px 0',
            lineHeight: '1.3'
          }}>
            Social Care Homes Workforce Portal
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
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
              color: '#111827',
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
                backgroundColor: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#111827',
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
                backgroundColor: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
              backgroundColor: loading ? '#1d4ed8' : '#2563eb',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              marginBottom: '12px'
            }}
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>

          {/* Staff Login Button */}
          <button
            onClick={() => navigate('/staff')}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#2563eb',
              backgroundColor: 'transparent',
              border: '2px solid #2563eb',
              borderRadius: '8px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              marginBottom: '20px'
            }}
          >
            Staff Login
          </button>

          {/* Footer Text */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '5px 0' }}>Ecclesia Family Centre App</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

