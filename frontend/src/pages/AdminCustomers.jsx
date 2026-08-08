import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ProfileIcon } from '../components/Icons';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.listCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Failed to load admin customers:", err);
      setError('Failed to fetch registered customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadCustomers();
  }, [user]);

  // Filter customers by search query
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  });

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animated-fade">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ProfileIcon size={28} style={{ color: 'var(--primary-accent)' }} />
            Customers Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and monitor registered customer accounts on the storefront</p>
        </div>

        {/* Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              backgroundColor: 'rgba(46, 94, 255, 0.1)', color: 'var(--primary-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Customers</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {customers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
          <input 
            type="text"
            className="form-control"
            placeholder="Search customers by name, email, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'none', padding: '4px', outline: 'none', boxShadow: 'none' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            {customers.length === 0 ? 'No customers registered yet.' : 'No customers match your search filters.'}
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Shipping Address</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id}>
                      <td className="tech-text">{cust.id}</td>
                      <td style={{ fontWeight: 600 }}>{cust.name}</td>
                      <td>{cust.email}</td>
                      <td className="tech-text">{cust.phone || '—'}</td>
                      <td style={{ fontSize: '13px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cust.address}>
                        {cust.address || '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatDate(cust.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
