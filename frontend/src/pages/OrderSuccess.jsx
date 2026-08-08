import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.detail(id);
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order confirmation details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading order confirmation details...</div>;
  }

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Visual Indicator */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D1FAE5',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '24px'
      }}>
        ✓
      </div>

      <h1 style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>Thank You!</h1>
      <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Your order has been placed successfully.
      </h2>

      {order ? (
        <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>Order ID</span>
            <span className="tech-text" style={{ fontWeight: 700 }}>#{order.id}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Payable</span>
            <span className="tech-text" style={{ fontWeight: 700 }}>₹{order.total_amount.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Method</span>
            <span>{order.payment_method}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Status</span>
            <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
              {order.payment_status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Fulfillment Status</span>
            <span className="badge badge-info">{order.status.toUpperCase()}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Delivery Address:</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.shipping_address}</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ width: '100%', textAlign: 'center', padding: '24px', marginBottom: '30px' }}>
          Unable to pull order transaction snapshots. Your order is registered in the database under ID #{id}.
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
        <Link to="/orders" className="btn btn-primary" style={{ flex: 1 }}>
          View Order History
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ flex: 1 }}>
          Back to Shopping
        </Link>
      </div>

    </div>
  );
};

export default OrderSuccess;
