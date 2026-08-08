import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.adminLogin({ email, password });
      login(response.data.token, response.data.user);
      navigate('/admin');
    } catch (err) {
      console.error("Admin Login fail:", err);
      setError(err.response?.data?.error || 'Invalid admin credentials or unauthorized account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme-wrapper">
      <div className="admin-login-card animated-fade">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            ElectroStore Admin Portal
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '6px' }}>
            Control panel authentication required
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#7F1D1D', border: '1px solid #F87171', color: '#FEE2E2',
            padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px', fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Administrator Email</label>
            <input 
              type="email" 
              className="form-control" 
              required
              placeholder="admin@electrostore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ caretColor: '#FFFFFF' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Security Password</label>
            <input 
              type="password" 
              className="form-control" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ caretColor: '#FFFFFF' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '15px', backgroundColor: '#3B82F6', border: 'none' }}
            disabled={loading}
          >
            {loading ? 'Authenticating secure session...' : 'Verify Identity & Log In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', borderTop: '1px solid #3A506B', paddingTop: '16px' }}>
          <Link to="/" style={{ color: '#94A3B8', hover: { color: '#FFFFFF' } }}>
            &larr; Back to Public Shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
