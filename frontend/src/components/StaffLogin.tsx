import React, { useState } from 'react';
import logo from '../assets/logo.jpeg';
import QRScanner from './QRScanner';

interface StaffLoginProps {
  onLogin: (staffId: string, staffName: string) => void;
}

const StaffLogin: React.FC<StaffLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRLogin = async (qrData: string) => {
    try {
      setLoading(true);
      setError('');
      setShowQRScanner(false);

      // QR data format: "STAFF_LOGIN:{staffId}"
      if (!qrData.startsWith('STAFF_LOGIN:')) {
        setError('Invalid QR code. Please scan a staff login QR code.');
        return;
      }

      const staffId = qrData.replace('STAFF_LOGIN:', '');

      // Call backend to get staff details and generate token
      const response = await fetch('https://social-care-backend.onrender.com/api/auth/staff/qr-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffId }),
      });

      if (response.ok) {
        const data = await response.json();
        // /api/auth/login returns {success: true, user: {username, name, role, staffId}}
        const staffId = data.user.id?.toString() || '1';
        localStorage.setItem('staff-token', `staff-${staffId}`);
        localStorage.setItem('staff-id', staffId);
        localStorage.setItem('staff-name', data.user.name);
        onLogin(staffId, data.user.name);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'QR login failed');
      }
    } catch (err) {
      console.error('QR login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://social-care-backend.onrender.com/api/auth/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // /api/auth/login returns {success: true, user: {username, name, role, staffId}}
        const staffId = data.user.id?.toString() || '1';
        localStorage.setItem('staff-token', `staff-${staffId}`);
        localStorage.setItem('staff-id', staffId);
        localStorage.setItem('staff-name', data.user.name);
        onLogin(staffId, data.user.name);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <img src={logo} alt="Ecclesia Family Centre Logo" style={{ width: '250px', marginBottom: '24px' }} />

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
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
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}>👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 45px',
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
          </div>

          {/* Password */}
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
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 45px 14px 45px',
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
            type="submit"
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
              marginBottom: '16px'
            }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#3a3a3a' }}></div>
          <span style={{ padding: '0 12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#3a3a3a' }}></div>
        </div>

        {/* QR Code Login Button */}
        <button
          type="button"
          onClick={() => setShowQRScanner(true)}
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
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          📷 Scan QR Code to Login
        </button>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '0'
        }}>
          Ecclesia Family Centre App
        </p>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRLogin}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default StaffLogin;

