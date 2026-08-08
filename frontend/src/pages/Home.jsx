import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import {
  SmartphoneIcon,
  LaptopIcon,
  AudioIcon,
  WearableIcon,
  AccessoryIcon,
  MonitorIcon,
  TabletIcon
} from '../components/Icons';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const catRes = await productAPI.categories();
        setCategories(catRes.data);
        
        // Fetch top rated products as featured
        const prodRes = await productAPI.list({ per_page: 8, sort: 'rating' });
        setFeaturedProducts(prodRes.data.products);

        // Fetch advertisements
        const adRes = await productAPI.listAdvertisements();
        setAdvertisements(adRes.data || []);
      } catch (error) {
        console.error("Failed to load home page content:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  // Automatic slide rotation for ad carousel
  useEffect(() => {
    if (advertisements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [advertisements]);

  return (
    <div className="animated-fade">
      {/* Hero / Advertisement Carousel Section */}
      {advertisements && advertisements.length > 0 ? (
        <section className="hero-carousel">
          {advertisements.map((ad, idx) => {
            const isActive = idx === currentAdIndex;
            return (
              <div 
                key={ad.id} 
                className="hero-slide"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(15, 30, 61, 0.95) 35%, rgba(15, 30, 61, 0.3) 100%), url(${ad.image_url})`,
                  opacity: isActive ? 1 : 0,
                  visibility: isActive ? 'visible' : 'hidden',
                  zIndex: isActive ? 1 : 0
                }}
              >
                <div className="hero-content">
                  <span className="badge badge-info hero-badge">
                    PROMOTION
                  </span>
                  <h1 className="hero-title">
                    {ad.title}
                  </h1>
                  <p className="hero-desc">
                    {ad.description}
                  </p>
                  <div>
                    <Link to={ad.link_url || "/products"} className="btn btn-primary btn-lg hero-btn">
                      Explore Offer &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left / Right Arrow Controls */}
          {advertisements.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentAdIndex(prev => (prev - 1 + advertisements.length) % advertisements.length)}
                className="hero-control prev"
                aria-label="Previous Slide"
              >
                ❮
              </button>
              <button 
                onClick={() => setCurrentAdIndex(prev => (prev + 1) % advertisements.length)}
                className="hero-control next"
                aria-label="Next Slide"
              >
                ❯
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {advertisements.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '8px', zIndex: 10
            }}>
              {advertisements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAdIndex(idx)}
                  style={{
                    width: '10px', height: '10px', borderRadius: '50%', border: 'none',
                    backgroundColor: idx === currentAdIndex ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer', padding: 0, transition: 'background-color 0.2s'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Fallback Static Hero Section if no Ads */
        <section className="hero-carousel fallback">
          <div className="hero-content">
            <span className="badge badge-info hero-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
              NEW IN STOCK
            </span>
            <h1 className="hero-title">
              Next-Gen Tech is Now Within Your Reach
            </h1>
            <p className="hero-desc">
              Compare, select, and buy top-rated electronics. Discover verified specs, authentic customer ratings, and flexible payments.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn-primary btn-lg hero-btn">
                Browse Products
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg hero-btn-secondary" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}>
                Join Customer Club
              </Link>
            </div>
          </div>
          <div style={{
            position: 'absolute',
            right: '5%',
            bottom: '-10%',
            opacity: 0.15,
            fontSize: '280px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            TECH
          </div>
        </section>
      )}

      {/* Category Tiles */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Shop by Category</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '20px'
        }}>
          {categories.map((cat) => {
            // Map icons based on slug
            const iconMap = {
              'smartphones': SmartphoneIcon,
              'laptops': LaptopIcon,
              'audio': AudioIcon,
              'wearables': WearableIcon,
              'accessories': AccessoryIcon,
              'tvs-monitors': MonitorIcon,
              'tablets': TabletIcon
            };
            const IconComponent = iconMap[cat.slug] || AccessoryIcon;
            return (
              <Link 
                key={cat.id} 
                to={`/products?category=${cat.slug}`}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ color: 'var(--primary-accent)', marginBottom: '12px' }}>
                  <IconComponent size={36} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{cat.name}</h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px' }}>Top-Rated Products</h2>
          <Link to="/products" style={{ color: 'var(--primary-accent)', fontWeight: 600, fontSize: '14px' }}>
            View All Products &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading products...</div>
        ) : (
          <div className="products-grid">
            {featuredProducts.map((product) => {
              const discountPrice = product.price * (1 - product.discount_percent / 100);
              
              // Get specs array from JSON specs
              const specStrings = [];
              if (product.specs) {
                Object.entries(product.specs).slice(0, 3).forEach(([key, val]) => {
                  specStrings.push(`${key}: ${val}`);
                });
              }
              const specStrip = specStrings.join(' · ');

              return (
                <div key={product.id} className="product-card">
                  {product.discount_percent > 0 && (
                    <div className="deal-badge">-{product.discount_percent}% DEAL</div>
                  )}
                  {product.stock <= 0 ? (
                    <div className="stock-badge-out">OUT OF STOCK</div>
                  ) : product.stock <= 5 ? (
                    <div className="stock-badge-low">LOW STOCK ({product.stock})</div>
                  ) : null}
                  
                  <div className="product-image-container">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/300x200'} 
                      alt={product.name} 
                      className="product-image"
                    />
                  </div>
                  
                  <div className="product-info">
                    <span className="product-brand">{product.brand}</span>
                    <h3 className="product-title">
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    
                    {specStrip && (
                      <div className="specs-strip" title={specStrip}>
                        {specStrip}
                      </div>
                    )}
                    
                    <div className="product-rating">
                      ⭐ {product.rating.toFixed(1)}
                    </div>
                    
                    <div className="product-price-row">
                      {product.discount_percent > 0 ? (
                        <>
                          <span className="discounted-price">₹{discountPrice.toFixed(2)}</span>
                          <span className="original-price">₹{product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="discounted-price">₹{product.price.toFixed(2)}</span>
                      )}
                    </div>

                    <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
