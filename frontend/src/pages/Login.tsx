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
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '10px'
        }}>
          Social Care Homes
        </h1>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#666',
          marginBottom: '10px'
        }}>
          Workforce Portal
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#999'
        }}>
          Sign in to access your schedule
        </p>
      </div>

      {/* Login Form */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Username Input */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '8px'
          }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3880ff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '8px'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3880ff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleLogin();
              }
            }}
          />
        </div>

        {/* Large Sign In Button */}
        <button
          onClick={handleLogin}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (!loading) handleLogin();
          }}
          disabled={loading}
          style={{
            width: '100%',
            padding: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: loading ? '#ccc' : '#3880ff',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '60px'
          }}
        >
          {loading ? 'Signing in...' : 'SIGN IN'}
        </button>

        {/* Instructions */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Test Accounts:</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Username with "admin" → Admin Dashboard
          </p>
          <p style={{ margin: '5px 0' }}>
            Any other username → Worker Dashboard
          </p>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666',
        maxWidth: '400px',
        width: '100%'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Debug Info:</strong>
        </p>
        <p style={{ margin: '5px 0' }}>
          Username: {username || '(empty)'}
        </p>
        <p style={{ margin: '5px 0' }}>
          Password: {password ? '***' : '(empty)'}
        </p>
        <p style={{ margin: '5px 0' }}>
          Status: {loading ? 'Loading...' : 'Ready'}
        </p>
      </div>
    </div>
  );
};

export default Login;

