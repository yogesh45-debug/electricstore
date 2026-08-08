import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { orderAPI } from '../services/api';

const CardPreview = ({ number, name, expiry }) => {
  const displayNum = number || '•••• •••• •••• ••••';
  const displayName = name || 'CARDHOLDER NAME';
  const displayExpiry = expiry || 'MM/YY';
  return (
    <div style={{
      width: '100%',
      maxWidth: '320px',
      height: '180px',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6d28d9 100%)',
      borderRadius: '12px',
      padding: '20px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      fontFamily: "'JetBrains Mono', monospace",
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-30%',
        width: '150%',
        height: '150%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>VISA</span>
        <div style={{
          width: '38px',
          height: '28px',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          borderRadius: '4px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>

      <div style={{ fontSize: '16px', letterSpacing: '2px', wordSpacing: '4px', padding: '10px 0 5px' }}>
        {displayNum}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 0, paddingRight: '10px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: '2px' }}>Card Holder</span>
          <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName.toUpperCase()}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: '2px' }}>Expires</span>
          <span style={{ fontSize: '12px', fontWeight: 600, display: 'block' }}>{displayExpiry}</span>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCartState } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Card and UPI Detail States
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // Auto-formatting helpers
  const handleCardNumberChange = (value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 16);
    const matches = cleanValue.match(/\d{1,4}/g);
    setCardNumber(matches ? matches.join(' ') : cleanValue);
  };

  const handleCardExpiryChange = (value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);
    if (cleanValue.length >= 3) {
      setCardExpiry(`${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`);
    } else {
      setCardExpiry(cleanValue);
    }
  };

  const handleCardCvvChange = (value) => {
    setCardCvv(value.replace(/\D/g, '').slice(0, 3));
  };

  // Sync user's default address if available
  useEffect(() => {
    if (user && user.address) {
      setShippingAddress(user.address);
    }
  }, [user]);

  // Prevent routing access if cart empty
  useEffect(() => {
    if (!loading && !orderPlaced && cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, loading, orderPlaced]);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, label, discount }
  const [couponError, setCouponError] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);

  // Valid coupon codes (frontend demo)
  const VALID_COUPONS = {
    SAVE10:   { label: '10% Off',       type: 'percent', value: 10 },
    SAVE20:   { label: '20% Off',       type: 'percent', value: 20 },
    FLAT500:  { label: '₹500 Flat Off', type: 'flat',    value: 500 },
    FREESHIP: { label: 'Free Shipping', type: 'freeship', value: 0 },
  };

  const applyDiscount = (subtotal) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') return (subtotal * appliedCoupon.value) / 100;
    if (appliedCoupon.type === 'flat') return Math.min(appliedCoupon.value, subtotal);
    return 0;
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code.'); return; }
    const found = VALID_COUPONS[code];
    if (found) {
      setAppliedCoupon({ code, ...found });
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try SAVE10, SAVE20 or FLAT500.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress) {
      setError('Please provide a delivery address.');
      return;
    }

    // Payment validation checking
    if (paymentMethod === 'Card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length !== 16 || isNaN(cleanNum)) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name.');
        return;
      }
      if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
        setError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length !== 3 || isNaN(cardCvv)) {
        setError('Please enter a valid 3-digit CVV.');
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. username@upi).');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await orderAPI.create({
        shipping_address: shippingAddress,
        payment_method: paymentMethod
      });
      
      // Successfully created order!
      setOrderPlaced(true);
      clearCartState();
      navigate(`/order-success/${response.data.id}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.response?.data?.error || 'Order placement failed. Check items stock level.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-fade">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Checkout</h1>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px',
          fontSize: '14px', marginBottom: '20px', fontWeight: 500
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="checkout-grid">
        {/* Left Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Shipping Address */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>1. Delivery Address</h2>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Shipping Address *</label>
              <textarea 
                className="form-control" 
                rows="4" 
                required
                placeholder="Enter complete street address, apartment, city, state, zip code..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>2. Payment Mode</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex', gap: '12px', alignItems: 'center', padding: '12px',
                border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: paymentMethod === 'Card' ? '#EFF6FF' : '#FFFFFF',
                borderColor: paymentMethod === 'Card' ? 'var(--primary-accent)' : 'var(--border-color)'
              }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="Card" 
                  checked={paymentMethod === 'Card'}
                  onChange={() => setPaymentMethod('Card')}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Credit / Debit Card</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Instant delivery snapshot - Mock Gateway (Auto-PAID)</div>
                </div>
              </label>

              {paymentMethod === 'Card' && (
                <div style={{
                  padding: '20px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color, #F8FAFC)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '-4px',
                  marginBottom: '8px'
                }}>
                  <CardPreview
                    number={cardNumber}
                    name={cardName}
                    expiry={cardExpiry}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Cardholder Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.slice(0, 30))}
                        required
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Card Number *</label>
                      <input
                        type="text"
                        className="form-control tech-text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        required
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Expiry Date (MM/YY) *</label>
                        <input
                          type="text"
                          className="form-control tech-text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => handleCardExpiryChange(e.target.value)}
                          required
                          style={{ fontSize: '13px', padding: '8px 12px' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>CVV *</label>
                        <input
                          type="password"
                          className="form-control tech-text"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => handleCardCvvChange(e.target.value)}
                          required
                          style={{ fontSize: '13px', padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <label style={{
                display: 'flex', gap: '12px', alignItems: 'center', padding: '12px',
                border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: paymentMethod === 'UPI' ? '#EFF6FF' : '#FFFFFF',
                borderColor: paymentMethod === 'UPI' ? 'var(--primary-accent)' : 'var(--border-color)'
              }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="UPI" 
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>UPI (GooglePay / PhonePe / Paytm)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Instant checkout - Mock Gateway (Auto-PAID)</div>
                </div>
              </label>

              {paymentMethod === 'UPI' && (
                <div style={{
                  padding: '20px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color, #F8FAFC)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginTop: '-4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'radial-gradient(#000000 20%, transparent 20%), radial-gradient(#000000 20%, transparent 20%)',
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 3px 3px',
                        backgroundColor: '#FFF'
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Scan Merchant QR Code</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        Scan this QR code using your UPI app (PhonePe, GPay, Paytm) to pay instantly, or enter your UPI ID below.
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0, width: '100%' }}>
                    <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>UPI ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. mobile@paytm or name@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.slice(0, 40))}
                      required
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                </div>
              )}

              <label style={{
                display: 'flex', gap: '12px', alignItems: 'center', padding: '12px',
                border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: paymentMethod === 'COD' ? '#EFF6FF' : '#FFFFFF',
                borderColor: paymentMethod === 'COD' ? 'var(--primary-accent)' : 'var(--border-color)'
              }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Cash On Delivery (COD)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay cash when delivered. Status set to (PENDING)</div>
                </div>
              </label>
            </div>

            {/* Clearly labeled mock payment gateway notice */}
            <div style={{
              backgroundColor: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '6px',
              padding: '12px 16px', marginTop: '20px', fontSize: '13px', color: '#B45309'
            }}>
              💡 <strong>Mock Payment Notice:</strong> This platform is running on a mock transaction module. 
              Selecting <strong>Card</strong> or <strong>UPI</strong> simulates an instant successful payment (marked Paid). 
              Selecting <strong>COD</strong> creates the order as Pending, which changes to Paid upon Admin delivery confirmation.
            </div>
          </div>
        </div>

        {/* Right Checkout Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Checkout Summary
          </h2>

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {cart.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ maxWidth: '70%' }}>
                  <span style={{ fontWeight: 600 }}>{item.product?.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> &times; {item.quantity}</span>
                </div>
                <span className="tech-text">₹{((item.product?.final_price || item.product?.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* ── Coupon Code Section ── */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={() => setCouponOpen(o => !o)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--primary-accent)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px', padding: 0
              }}
            >
              🎟️ Have a promo code? {couponOpen ? '▲' : '▼'}
            </button>

            {appliedCoupon && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: '10px', padding: '8px 12px',
                backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7',
                borderRadius: '6px', fontSize: '13px'
              }}>
                <span style={{ color: '#065F46', fontWeight: 600 }}>
                  ✅ <strong>{appliedCoupon.code}</strong> — {appliedCoupon.label} applied!
                </span>
                <button
                  type="button"
                  onClick={() => { setAppliedCoupon(null); setCouponError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}
                  title="Remove coupon"
                >×</button>
              </div>
            )}

            {couponOpen && !appliedCoupon && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter promo code…"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    style={{ flex: 1, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyCoupon}
                    style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
                  >Apply</button>
                </div>
                {couponError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '12px', margin: 0 }}>{couponError}</p>
                )}
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                  Try: <strong>SAVE10</strong>, <strong>SAVE20</strong>, <strong>FLAT500</strong>
                </p>
              </div>
            )}
          </div>

          {/* ── Price Breakdown ── */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Subtotal</span>
              <span className="tech-text">₹{cart.subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-success)' }}>
                <span>Discount ({appliedCoupon.code})</span>
                <span className="tech-text" style={{ fontWeight: 600 }}>
                  − ₹{applyDiscount(cart.subtotal).toFixed(2)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>Shipping Fee</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700,
              borderTop: '2px solid var(--border-color)', paddingTop: '12px', marginTop: '6px'
            }}>
              <span>Payable Total</span>
              <span className="tech-text" style={{ color: 'var(--primary-accent)' }}>
                ₹{Math.max(0, cart.subtotal - applyDiscount(cart.subtotal)).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Complete Payment & Checkout'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
