import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const handleQtyChange = async (itemId, currentQty, amount, stockLimit) => {
    const newQty = currentQty + amount;
    if (newQty <= 0) {
      await removeFromCart(itemId);
    } else if (newQty > stockLimit) {
      alert(`Cannot set quantity to ${newQty}. Only ${stockLimit} items are available in stock.`);
    } else {
      await updateQuantity(itemId, newQty);
    }
  };

  if (!user) {
    return (
      <div className="card animated-fade" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Your Shopping Cart</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
          Please log in to view or manage your shopping cart.
        </p>
        <Link to="/login" className="btn btn-primary">Log In to Account</Link>
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading your cart...</div>;
  }

  return (
    <div className="animated-fade">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Your Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <h2>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 24px' }}>
            Explore our electronics categories and add products to your cart.
          </p>
          <Link to="/products" className="btn btn-primary">Browse Catalog</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>
          <div className="cart-grid">
            
            {/* Cart Items List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'center' }}>Quantity</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => {
                      if (!item.product) return null;
                      const product = item.product;
                      const unitPrice = product.final_price || (product.price * (1 - product.discount_percent / 100));
                      const itemTotal = unitPrice * item.quantity;

                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#F1F5F9' }}
                              />
                              <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>
                                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                                </h4>
                                <span className="product-brand" style={{ fontSize: '10px' }}>{product.brand}</span>
                              </div>
                            </div>
                          </td>
                          <td className="tech-text" style={{ fontSize: '14px' }}>
                            ₹{unitPrice.toFixed(2)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontWeight: 'bold' }}
                                onClick={() => handleQtyChange(item.id, item.quantity, -1, product.stock)}
                              >
                                -
                              </button>
                              <span className="tech-text" style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                                {item.quantity}
                              </span>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontWeight: 'bold' }}
                                onClick={() => handleQtyChange(item.id, item.quantity, 1, product.stock)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="tech-text" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-accent)' }}>
                            ₹{itemTotal.toFixed(2)}
                          </td>
                          <td>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '16px' }}
                              title="Remove item"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span>Subtotal ({cart.items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span className="tech-text" style={{ fontWeight: 600 }}>₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span>Shipping</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>FREE</span>
              </div>
              
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700,
                borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px'
              }}>
                <span>Total Amount</span>
                <span className="tech-text" style={{ color: 'var(--primary-accent)' }}>₹{cart.subtotal.toFixed(2)}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '10px' }}>
                Proceed to Checkout
              </Link>

              <Link to="/products" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                &larr; Continue Shopping
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
