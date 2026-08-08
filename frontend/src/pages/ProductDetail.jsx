import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const getCategoryGalleryImages = (categoryName, mainImageUrl) => {
  const normalizedCategory = (categoryName || '').toLowerCase();
  let alts = [];

  if (normalizedCategory.includes('phone') || normalizedCategory.includes('smart')) {
    alts = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500',
      'https://images.unsplash.com/photo-1565849906660-4a66e7448c3b?w=500',
      'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'
    ];
  } else if (normalizedCategory.includes('laptop') || normalizedCategory.includes('notebook')) {
    alts = [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
      'https://images.unsplash.com/photo-1496181130204-755241544e3f?w=500',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'
    ];
  } else if (normalizedCategory.includes('audio') || normalizedCategory.includes('headphone') || normalizedCategory.includes('ear') || normalizedCategory.includes('bud')) {
    alts = [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ];
  } else if (normalizedCategory.includes('wear') || normalizedCategory.includes('watch') || normalizedCategory.includes('band')) {
    alts = [
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500',
      'https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=500',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500'
    ];
  } else if (normalizedCategory.includes('tv') || normalizedCategory.includes('monitor') || normalizedCategory.includes('screen')) {
    alts = [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
      'https://images.unsplash.com/photo-1601944179066-297cbd3d10ff?w=500',
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500'
    ];
  } else {
    alts = [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'
    ];
  }

  return [mainImageUrl, ...alts].filter(Boolean);
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [bankOffers, setBankOffers] = useState([]);
  
  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const galleryImages = product
    ? (product.gallery_images && product.gallery_images.length > 0
      ? [product.image_url, ...product.gallery_images]
      : getCategoryGalleryImages(product.category_name, product.image_url))
    : [];

  useEffect(() => {
    const fetchProductAndOffers = async () => {
      try {
        const response = await productAPI.detail(id);
        setProduct(response.data);
        setSelectedImage(response.data.image_url);

        const offersResponse = await productAPI.listOffers();
        setBankOffers(offersResponse.data || []);
      } catch (err) {
        console.error("Failed to load details:", err);
        setError('Product not found or database connection issues occurred.');
      } finally {
        setLoading(false);
      }
      
      // Fetch reviews separately so failures don't block details loading
      try {
        const reviewsResponse = await productAPI.listReviews(id);
        setReviews(reviewsResponse.data || []);
      } catch (rErr) {
        console.error("Failed to load reviews:", rErr);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchProductAndOffers();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setReviewErrorMsg('Please write a comment.');
      return;
    }
    setSubmittingReview(true);
    setReviewErrorMsg('');
    setReviewSuccessMsg('');
    try {
      const response = await productAPI.addReview(id, {
        rating: newRating,
        comment: newComment.trim()
      });
      setReviewSuccessMsg('Your review has been posted successfully!');
      setNewComment('');
      setNewRating(5);
      
      // Update reviews list
      setReviews(prev => [response.data, ...prev]);
      
      // Update local product rating average
      const updatedReviews = [response.data, ...reviews];
      const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      setProduct(prev => ({
        ...prev,
        rating: avg
      }));
    } catch (err) {
      setReviewErrorMsg(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      setError('Administrators cannot purchase products.');
      return;
    }

    const qty = parseInt(qtyInput);
    if (isNaN(qty) || qty < 1) {
      setError('Please enter a valid quantity of at least 1.');
      return;
    }
    if (qty > product.stock) {
      setError(`Cannot add more than available stock (${product.stock}).`);
      return;
    }

    setAdding(true);
    setError('');
    setSuccessMsg('');
    try {
      await addToCart(product.id, qty);
      setSuccessMsg('Product added to your cart successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleQtyChange = (val) => {
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > product.stock) val = product.stock;
    setQtyInput(val);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading product details...</div>;
  }

  if (error && !product) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', borderColor: 'var(--color-danger)' }}>
        <p style={{ color: 'var(--color-danger)', fontWeight: 600, marginBottom: '16px' }}>{error}</p>
        <Link to="/products" className="btn btn-secondary">Back to Catalog</Link>
      </div>
    );
  }

  const discountPrice = product.price * (1 - product.discount_percent / 100);

  return (
    <div className="animated-fade">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/products" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          &larr; Back to Catalog
        </Link>
      </div>

      <div className="product-detail-grid">
        {/* Left: Product Image & Gallery */}
        <div className="product-detail-left" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{
            padding: '16px',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            {/* Zoom Icon */}
            <div 
              onClick={() => setLightboxImage(selectedImage || product?.image_url)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                zIndex: 5
              }} title="Zoom Image">
              🔍
            </div>

            <img
              src={selectedImage || 'https://via.placeholder.com/500x400'}
              alt={product.name}
              onClick={() => setLightboxImage(selectedImage || product?.image_url)}
              style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', transition: 'all 0.3s ease', cursor: 'zoom-in' }}
            />
          </div>

          {/* Thumbnails Gallery */}
          <div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {galleryImages.map((imgUrl, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(imgUrl)}
                  style={{
                    width: '76px',
                    height: '76px',
                    border: selectedImage === imgUrl ? '2px solid var(--color-warning)' : '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    boxShadow: selectedImage === imgUrl ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedImage !== imgUrl) {
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedImage !== imgUrl) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${index + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                  />
                </div>
              ))}
            </div>

            {/* Carousel Dot Indicators */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
              {galleryImages.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(imgUrl)}
                  aria-label={`Go to image ${index + 1}`}
                  style={{
                    width: selectedImage === imgUrl ? '20px' : '10px',
                    height: '5px',
                    borderRadius: '2.5px',
                    border: 'none',
                    backgroundColor: selectedImage === imgUrl ? 'var(--color-warning)' : '#CBD5E1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product Meta & Purchase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <span className="product-brand" style={{ fontSize: '14px' }}>{product.brand}</span>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', lineHeight: '1.2' }}>{product.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '15px' }}>
                ⭐ {product.rating.toFixed(1)}
              </span>
              <span className="badge badge-info">{product.category_name}</span>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              {product.discount_percent > 0 ? (
                <>
                  <span className="discounted-price" style={{ fontSize: '28px' }}>
                    ₹{discountPrice.toFixed(2)}
                  </span>
                  <span className="original-price" style={{ fontSize: '18px' }}>
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className="badge badge-danger" style={{ backgroundColor: 'var(--deal-accent)', color: '#FFFFFF' }}>
                    -{product.discount_percent}% DEAL
                  </span>
                </>
              ) : (
                <span className="discounted-price" style={{ fontSize: '28px' }}>
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            <div>
              <span className="form-label" style={{ marginBottom: '8px' }}>Availability</span>
              {product.stock <= 0 ? (
                <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Out of Stock</span>
              ) : product.stock <= 5 ? (
                <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>Only {product.stock} units left (Low Stock)</span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>In Stock ({product.stock} units available)</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="purchase-action-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Qty</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '45px', backgroundColor: '#FFFFFF' }}>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(parseInt(qtyInput) - 1)}
                      style={{ border: 'none', background: 'none', width: '35px', height: '100%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      disabled={parseInt(qtyInput) <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qtyInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val)) {
                          setQtyInput('');
                        } else {
                          setQtyInput(val);
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(qtyInput);
                        if (isNaN(val) || val < 1) {
                          setQtyInput(1);
                        } else if (val > product.stock) {
                          setQtyInput(product.stock);
                        }
                      }}
                      min={1}
                      max={product.stock}
                      style={{
                        border: 'none',
                        width: '50px',
                        height: '100%',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(parseInt(qtyInput) + 1)}
                      style={{ border: 'none', background: 'none', width: '35px', height: '100%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      disabled={parseInt(qtyInput) >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '45px' }}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add to Shopping Cart'}
                </button>
              </div>
            )}

            {successMsg && (
              <div style={{ color: 'var(--color-success)', fontSize: '14px', fontWeight: 600 }}>
                {successMsg} &bull; <Link to="/cart" style={{ textDecoration: 'underline' }}>Go to Cart</Link>
              </div>
            )}
            {error && (
              <div style={{ color: 'var(--color-danger)', fontSize: '14px', fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>

          {/* Trust Badges Section */}
          <div className="trust-badges-grid">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>🔄</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>10 Days Replacement</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>🚚</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>Free Delivery</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>1 Year Warranty</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>💵</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>Pay on Delivery</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>Top Brand</span>
            </div>
          </div>

          {/* Bank Offers Section */}
          {bankOffers && bankOffers.length > 0 && (
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FEF3C7',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏷️ Available Bank Offers
              </h3>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {bankOffers.map(offer => (
                  <div key={offer.id} style={{
                    minWidth: '220px',
                    maxWidth: '240px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FDE68A',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#B45309',
                      backgroundColor: '#FEF3C7',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      alignSelf: 'start'
                    }}>
                      {offer.bank_name}
                    </span>
                    <p style={{ fontSize: '12px', margin: 0, fontWeight: 500, color: '#451A03', lineHeight: '1.4' }}>
                      {offer.offer_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Product Description</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              {product.description || 'No description provided for this product.'}
            </p>
          </div>

          {/* About this item highlights */}
          {product.about_item && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>About this item</h2>
              <ul style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                paddingLeft: '20px',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {product.about_item.split('\n').filter(Boolean).map((bullet, idx) => (
                  <li key={idx} style={{ listStyleType: 'disc' }}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Specifications Monospace Table */}
      <section style={{ marginTop: '50px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
          Technical Specifications
        </h2>
        {product.specs && Object.keys(product.specs).length > 0 ? (
          <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <tbody>
                {Object.entries(product.specs).map(([key, val]) => (
                  <tr key={key}>
                    <td style={{ fontWeight: 600, width: '200px', backgroundColor: '#F8FAFC' }}>{key}</td>
                    <td className="tech-text" style={{ fontStyle: 'normal' }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No specifications provided.</p>
        )}
      </section>

      {/* Product Gallery Section between Technical Specifications and Customer Reviews */}
      {galleryImages && galleryImages.length > 0 && (
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
            Product Gallery
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px',
            backgroundColor: 'var(--surface-color)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {galleryImages.map((imgUrl, index) => (
              <div 
                key={index}
                onClick={() => setLightboxImage(imgUrl)}
                style={{
                  height: '220px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  padding: '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <img 
                  src={imgUrl} 
                  alt={`${product.name} View ${index + 1}`} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain'
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <section style={{ marginTop: '50px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
          Customer Reviews
        </h2>
        
        <div className="reviews-layout">
          {/* Left Panel: Rating Summary & Form */}
          <div className="reviews-summary-form-col">
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {product.rating ? product.rating.toFixed(1) : '0.0'}
                </div>
                <div style={{ color: 'var(--color-warning)', fontSize: '20px', marginTop: '4px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < Math.round(product.rating || 0) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </div>
              </div>

              {/* Write a Review Form */}
              {user ? (
                user.role === 'customer' ? (
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Write a Customer Review</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span className="form-label" style={{ margin: 0 }}>Select Star Rating</span>
                      <div style={{ display: 'flex', gap: '6px', fontSize: '24px', color: 'var(--color-warning)' }}>
                        {Array.from({ length: 5 }).map((_, i) => {
                          const starVal = i + 1;
                          return (
                            <span 
                              key={i} 
                              onClick={() => setNewRating(starVal)} 
                              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {starVal <= newRating ? '★' : '☆'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Review Comment</label>
                      <textarea 
                        className="form-control"
                        rows="4"
                        placeholder="Share your experience with this product..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                        style={{ resize: 'vertical', fontSize: '14px' }}
                      />
                    </div>

                    {reviewSuccessMsg && (
                      <div style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: 600 }}>
                        ✓ {reviewSuccessMsg}
                      </div>
                    )}
                    {reviewErrorMsg && (
                      <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600 }}>
                        ✗ {reviewErrorMsg}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm" 
                      style={{ width: '100%', height: '40px' }}
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '6px' }}>
                    Only customer accounts can post product reviews.
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Want to review this product?
                  </p>
                  <Link to="/login" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    Log In to Write Review
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Comments List */}
          <div className="reviews-list-col">
            {reviewsLoading ? (
              <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                <h3>No Customer Reviews Yet</h3>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Be the first to review this product and share your thoughts!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--border-color), var(--text-secondary))',
                          color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '13px'
                        }}>
                          {rev.user_name ? rev.user_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{rev.user_name || 'Anonymous Customer'}</div>
                          <div style={{ color: 'var(--color-warning)', fontSize: '12px', marginTop: '2px' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(rev.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox Zoom Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          {/* Close button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            title="Close Zoom"
          >
            ✕
          </button>
          
          {/* Zoomed Image */}
          <img 
            src={lightboxImage} 
            alt="Zoomed Product View" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              cursor: 'default'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
