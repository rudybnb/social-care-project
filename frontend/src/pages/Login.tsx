import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, AuthApiError } from '../services/api';
import logo from '../assets/logo.jpeg';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login button clicked!');

    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      // Real Phase 1A admin login — returns a server-side session token
      const data = await authAPI.adminLogin(username, password);
      const { token, expiresAt, user: serverUser } = data;

      const role: 'admin' | 'worker' =
        serverUser.role === 'Admin' || serverUser.role === 'Site Manager' ? 'admin' : 'worker';
      const sessionUser = {
        id: serverUser.staffId || serverUser.id,
        email: serverUser.email || '',
        name: serverUser.name,
        role,
      };

      login(sessionUser, token, expiresAt);

      if (serverUser.staffId) {
        localStorage.setItem('staffId', serverUser.staffId.toString());
        localStorage.setItem('staffName', serverUser.name);
      }

      console.log('Login successful, navigating to:', sessionUser.role);
      navigate(sessionUser.role === 'admin' ? '/admin' : '/worker');
    } catch (error) {
      console.error('Login failed:', error);
      alert(error instanceof AuthApiError ? error.message : 'Login failed. Please try again.');
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
          {/* Logo */}
          <img src={logo} alt="Ecclesia Family Centre Logo" style={{ width: '250px', marginBottom: '24px' }} />

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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
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
                  padding: '14px 45px 14px 14px',
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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
              color: '#9333ea',
              backgroundColor: 'transparent',
              border: '2px solid #9333ea',
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

