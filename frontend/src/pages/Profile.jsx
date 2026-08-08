import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Profile = () => {
  const { user, refreshUser } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const getInitials = (n) =>
    n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, phone, address };
      if (currentPassword && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }
      await authAPI.updateMe(payload);
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animated-fade" style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 700, color: '#fff',
          flexShrink: 0, boxShadow: '0 4px 12px rgba(46,94,255,0.35)'
        }}>
          {getInitials(user.name)}
        </div>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>{user.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {user.email} &nbsp;·&nbsp;
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '11px',
              fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              backgroundColor: user.role === 'admin' ? '#FEF3C7' : '#EFF6FF',
              color: user.role === 'admin' ? '#92400E' : '#1D4ED8',
              border: user.role === 'admin' ? '1px solid #FCD34D' : '1px solid #BFDBFE'
            }}>
              {user.role}
            </span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{
          backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{
          backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          fontSize: '14px', fontWeight: 500
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Personal Info Card */}
        <div className="card">
          <h2 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 Personal Information
          </h2>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={user.email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Email cannot be changed.
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        {/* Delivery Address Card */}
        <div className="card">
          <h2 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 Default Delivery Address
          </h2>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows="3"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, Apartment, City, State, ZIP"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ fontSize: '17px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔒 Change Password
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Leave blank to keep your current password.
          </p>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div className="profile-row-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '40px' }}>
          <Link to="/" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
