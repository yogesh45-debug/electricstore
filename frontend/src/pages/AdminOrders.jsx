import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.listOrders(statusFilter || undefined);
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to load admin orders:", err);
      setError('Failed to fetch store orders list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadOrders();
  }, [user, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      // Reload order details to refresh updated status and payment status in grid
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return '#3B82F6';
      case 'shipped': return '#F59E0B';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="animated-fade">
      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px' }}>Store Orders</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Fulfill orders, track shipping, and audit payments</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Filter Status:</label>
            <select 
              className="form-control" 
              style={{ width: '160px', padding: '8px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Orders</option>
              <option value="placed">Placed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders tracker...</div>
        ) : orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No orders found under selected filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map(order => (
              <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Header row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                  borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '13px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Order ID: </span>
                    <span className="tech-text" style={{ fontWeight: 700 }}>#{order.id}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Customer: </span>
                    <span style={{ fontWeight: 600 }}>{order.customer_name}</span> ({order.customer_email})
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Date: </span>
                    <span className="tech-text">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Main section: Address and Items */}
                <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>ITEMS PURCHASED</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {order.items?.map(item => (
                        <div key={item.id} style={{ display: 'flex', justify: 'space-between', fontSize: '13px' }}>
                          <span>{item.product_name} <strong style={{ color: 'var(--text-secondary)' }}>&times; {item.quantity}</strong></span>
                          <span className="tech-text">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>SHIPPING ADDRESS</h4>
                    <p style={{ fontSize: '13px', lineHeight: '1.4' }}>{order.shipping_address}</p>
                  </div>
                </div>

                {/* Footer row: Status dropdown and totals */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                  borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Payment Method / Status</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {order.payment_method} &bull;{' '}
                        <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {order.payment_status.toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Order Total</span>
                      <span className="tech-text" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-accent)' }}>
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Fulfillment:</span>
                    <select 
                      className="form-control" 
                      style={{
                        width: '130px', padding: '6px', fontSize: '13px', fontWeight: 600,
                        backgroundColor: '#FFFFFF', color: getStatusColor(order.status),
                        borderColor: getStatusColor(order.status)
                      }}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      <option value="placed">Placed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
