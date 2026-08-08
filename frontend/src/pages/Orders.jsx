import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

// Inline Modal Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '650px',
  backgroundColor: 'var(--surface-color)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-color)',
  padding: '24px',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative'
};

// 1. Invoice / Bill Statement Modal
const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  // 18% GST calculation
  const total = order.total_amount;
  const subtotal = total / 1.18;
  const gst = total - subtotal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: #000 !important;
            z-index: 9999999;
            padding: 30px !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div 
        id="print-invoice-area" 
        className="card" 
        style={modalContentStyle} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
              ⚡ ElectroStore
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Premium Electronics Destination</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>GSTIN: 27AAAAA1111A1Z1</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>TAX INVOICE</h3>
            <p style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>Invoice #: INV-{order.id}-{new Date(order.created_at).getFullYear()}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Date: {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Address & Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '24px', fontSize: '13px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Billed To:</h4>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.customer_name || 'Valued Customer'}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{order.customer_email || ''}</p>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Shipped To:</h4>
            <p style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)', fontWeight: 500 }}>{order.shipping_address}</p>
          </div>
        </div>

        {/* Payment Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-color)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Payment Method: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{order.payment_method}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Payment Status: </span>
            <strong style={{ color: order.payment_status === 'paid' ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {order.payment_status?.toUpperCase()}
            </strong>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '8px 0', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Product</th>
              <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Qty</th>
              <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Unit Price</th>
              <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 0', fontWeight: 500, color: 'var(--text-primary)' }}>{item.product_name}</td>
                <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-primary)' }}>{item.quantity}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-primary)' }} className="tech-text">₹{item.unit_price.toFixed(2)}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }} className="tech-text">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '260px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal (Excl. Tax):</span>
              <span className="tech-text">₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CGST (9%):</span>
              <span className="tech-text">₹{(gst / 2).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>SGST (9%):</span>
              <span className="tech-text">₹{(gst / 2).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-color)', paddingTop: '10px', fontWeight: 'bold', fontSize: '15px' }}>
              <span style={{ color: 'var(--text-primary)' }}>Total paid:</span>
              <span className="tech-text" style={{ color: 'var(--primary-accent)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
          <p>Thank you for shopping with ElectroStore!</p>
          <p>This is a computer-generated tax invoice and requires no physical signature.</p>
        </div>

        {/* Actions (Hidden in Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Track Order Modal
const TrackingModal = ({ order, onClose }) => {
  if (!order) return null;

  const isCancelled = order.status === 'cancelled';
  
  const steps = [
    { title: 'Order Placed', desc: 'Order received and payment verified', key: 'placed' },
    { title: 'Processed', desc: 'Items packed and quality checked', key: 'processed' },
    { title: 'Shipped', desc: 'In transit to your nearest sorting facility', key: 'shipped' },
    { title: 'Delivered', desc: 'Delivered to your shipping address', key: 'delivered' }
  ];

  const getStepStatus = (stepKey, index) => {
    if (isCancelled) {
      if (stepKey === 'placed') return 'completed';
      return 'disabled';
    }

    const statusMap = {
      'placed': 1,
      'shipped': 2,
      'delivered': 3
    };

    const currentLevel = statusMap[order.status] || 1;

    let stepLevel = index + 1;
    if (stepKey === 'processed') stepLevel = 1.5; // Processed is between Placed and Shipped

    if (currentLevel >= stepLevel) {
      return 'completed';
    } else if (Math.ceil(currentLevel) === index) {
      return 'active';
    }
    return 'pending';
  };

  const getStepCircleStyle = (status) => {
    const base = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: 2,
      transition: 'all 0.3s ease'
    };
    if (status === 'completed') {
      return { ...base, backgroundColor: 'var(--color-success)', color: 'white' };
    } else if (status === 'active') {
      return { ...base, backgroundColor: 'var(--primary-accent)', color: 'white', boxShadow: '0 0 0 4px rgba(46, 94, 255, 0.2)' };
    } else {
      return { ...base, backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div 
        className="card" 
        style={{ ...modalContentStyle, maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>Track Shipment</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Tracking details for Order <span style={{ fontWeight: 700 }}>#{order.id}</span>
        </p>

        {isCancelled ? (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '18px' }}>🚫</span>
            <div>
              <strong>Order Cancelled</strong>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>This order was cancelled. Restocked inventory is back in the catalog and any payments have been refunded.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', paddingLeft: '12px', marginBottom: '24px' }}>
            {/* Connector Line */}
            <div style={{
              position: 'absolute',
              left: '28px',
              top: '16px',
              bottom: '16px',
              width: '2px',
              backgroundColor: 'var(--border-color)',
              zIndex: 1
            }} />

            {/* Filled Connector Line */}
            <div style={{
              position: 'absolute',
              left: '28px',
              top: '16px',
              height: order.status === 'delivered' ? 'calc(100% - 32px)' : order.status === 'shipped' ? '66%' : '33%',
              width: '2px',
              backgroundColor: 'var(--color-success)',
              zIndex: 1,
              transition: 'height 0.5s ease'
            }} />

            {steps.map((step, idx) => {
              const status = getStepStatus(step.key, idx);
              return (
                <div key={step.key} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={getStepCircleStyle(status)}>
                    {status === 'completed' ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: status === 'pending' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {step.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Support Modal
const SupportModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div 
        className="card" 
        style={{ ...modalContentStyle, maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>Order Support</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Need assistance with Order <span style={{ fontWeight: 700 }}>#{order.id}</span>?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '20px' }}>📞</span>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Customer Hotline</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>1800-123-4567 (9 AM - 6 PM)</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '20px' }}>✉️</span>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Email Helpdesk</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>support@electrostore.com</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Live Assistance</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chat with an agent in real-time</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            Close Support
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Orders Component
const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [selectedSupport, setSelectedSupport] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await orderAPI.list();
        setOrders(response.data);
      } catch (err) {
        console.error("Failed to load user orders:", err);
        setError('Failed to fetch your order history.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This will release reserved stock levels.")) {
      return;
    }
    
    try {
      const response = await orderAPI.cancel(orderId);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      alert("Order cancelled successfully!");
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.response?.data?.error || "Failed to cancel order.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading order history...</div>;
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'placed': return 'badge-info';
      case 'shipped': return 'badge-warning';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="animated-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Your Order History</h1>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>No orders found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            You haven't placed any orders yet.
          </p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '13px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Order ID: </span>
                  <span className="tech-text" style={{ fontWeight: 700 }}>#{order.id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Placed on: </span>
                  <span className="tech-text">
                    {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    FULFILLMENT: {order.status.toUpperCase()}
                  </span>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    PAYMENT: {order.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}> &times; {item.quantity}</span>
                    </div>
                    <span className="tech-text">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px'
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Payment Method</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{order.payment_method}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Total Paid</span>
                  <span className="tech-text" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-accent)' }}>
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Actions Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '14px',
                marginTop: '4px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedInvoice(order)}
                    className="btn btn-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    📄 Bill Statement
                  </button>
                  <button
                    onClick={() => setSelectedTracking(order)}
                    className="btn btn-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    🚚 Track Order
                  </button>
                  <button
                    onClick={() => setSelectedSupport(order)}
                    className="btn btn-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    💬 Support
                  </button>
                </div>
                
                {order.status === 'placed' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn"
                    style={{
                      fontSize: '12.5px',
                      padding: '6px 12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--color-danger)',
                      border: '1px solid var(--color-danger)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--color-danger)';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                      e.target.style.color = 'var(--color-danger)';
                    }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals rendering */}
      {selectedInvoice && (
        <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
      {selectedTracking && (
        <TrackingModal order={selectedTracking} onClose={() => setSelectedTracking(null)} />
      )}
      {selectedSupport && (
        <SupportModal order={selectedSupport} onClose={() => setSelectedSupport(null)} />
      )}
    </div>
  );
};

export default Orders;
