import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '../components/Icons';

const Register = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification States
  const [sentOtp, setSentOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  const sendMockOtp = () => {
    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number before sending OTP.');
      return;
    }
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(code);
    setOtpSent(true);
    setOtpVerified(false);
    setOtpSuccess(`Mock OTP Sent! Enter code ${code} to verify.`);
    setOtpError('');
  };

  const handleVerifyOtp = () => {
    if (otpInput === sentOtp) {
      setOtpVerified(true);
      setOtpSuccess('Phone number verified successfully!');
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. Please check and try again.');
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    if (!otpVerified) {
      setError('Please verify your phone number using the OTP code sent to you.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register({ name, email, password, phone, address });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.error || 'Registration failed. Try checking your parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
          Create an ElectroStore account to buy electronics easily
        </p>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px',
            fontSize: '14px', marginBottom: '20px', fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-control" 
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input 
              type="email" 
              className="form-control" 
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. +1 555-0199"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtpSuccess('');
                  setOtpError('');
                }}
                disabled={otpVerified}
                required
                style={{ flex: 1 }}
              />
              {!otpVerified && (
                <button
                  type="button"
                  onClick={sendMockOtp}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '8px 12px' }}
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>
            {otpVerified && (
              <div style={{ color: 'var(--color-success, #10B981)', fontSize: '12px', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✅ Phone number verified</span>
              </div>
            )}
          </div>

          {otpSent && !otpVerified && (
            <div className="card" style={{ padding: '12px', marginTop: '-12px', marginBottom: '16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              {otpSuccess && (
                <div style={{ color: 'var(--primary-accent)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  💡 {otpSuccess}
                </div>
              )}
              {otpError && (
                <div style={{ color: '#B91C1C', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  ❌ {otpError}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text"
                  className="form-control tech-text"
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Shipping Address</label>
            <textarea 
              className="form-control" 
              rows="3"
              placeholder="Enter your default home address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
