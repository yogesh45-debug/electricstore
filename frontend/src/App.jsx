import React, { useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider, CartContext } from './context/CartContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import { productAPI } from './services/api';
import {
  ProfileIcon,
  CartIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  DashboardIcon,
  ProductsIcon,
  OrdersIcon,
  OffersIcon,
  AdsIcon,
  LogoIcon,
  GitHubIcon
} from './components/Icons';

// Pages imports
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminOffers from './pages/AdminOffers';
import AdminAdvertisements from './pages/AdminAdvertisements';
import AdminCustomers from './pages/AdminCustomers';
import AdminLayout from './pages/AdminLayout';

// Auth Guard: Customers Only
const CustomerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading session...</div>;
  if (!user || user.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Auth Guard: Admins Only
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading session...</div>;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Helper: get user initials
const getInitials = (name) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

// Layout component to selectively show Header/Footer and style pages
const LayoutWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { isDark, toggleDarkMode } = useDarkMode();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  
  // Search Autocomplete States & Refs
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchRef = useRef(null);

  const [searchMobileQuery, setSearchMobileQuery] = useState('');
  const [suggestionsMobile, setSuggestionsMobile] = useState([]);
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);
  const searchMobileRef = useRef(null);

  // Debounced search for Desktop suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await productAPI.list({ search: searchQuery, per_page: 5 });
        setSuggestions(res.data.products || []);
      } catch (err) {
        console.error("Autocomplete fetch failed:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Debounced search for Mobile suggestions
  useEffect(() => {
    if (!searchMobileQuery.trim()) {
      setSuggestionsMobile([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await productAPI.list({ search: searchMobileQuery, per_page: 5 });
        setSuggestionsMobile(res.data.products || []);
      } catch (err) {
        console.error("Autocomplete fetch failed:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchMobileQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
      if (searchMobileRef.current && !searchMobileRef.current.contains(e.target)) {
        setMobileSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);



  // Hide standard header/footer for Admin pages (which have their own dashboard layout)
  const isAdminPage = location.pathname.startsWith('/admin');
  const showAdminHeader = isAdminPage || (user && user.role === 'admin');

  return (
    <div className="app-container">
      {/* Dynamic Animated Background Glows */}
      <div className="bg-blobs-wrapper">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
      </div>

      {!isAdminPage && (
        <header className="main-header" style={{ backgroundColor: showAdminHeader ? '#0B132B' : 'var(--header-bg)' }}>
          <div className="header-container" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Hamburger menu button for mobile */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                ☰
              </button>

              <Link to={user && user.role === 'admin' ? "/admin" : "/"} className="logo">
                <LogoIcon size={26} />
                <span>
                  Electro<span className="logo-highlight" style={{ color: showAdminHeader ? '#17B8A6' : 'var(--primary-accent)' }}>Store</span>
                </span>
                {showAdminHeader && <span style={{ fontSize: '12px', verticalAlign: 'middle', marginLeft: '8px', color: '#94A3B8' }}>CONTROL PANEL</span>}
              </Link>
            </div>

            {/* Center: Public Search Bar (Desktop Only via CSS class) */}
            {!isAdminPage && (!user || user.role !== 'admin') && (
              <div ref={searchRef} className="header-search-center">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSuggestionsOpen(false);
                    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                  }}
                  style={{ display: 'flex', width: '100%', alignItems: 'center' }}
                >
                  <input 
                    type="text" 
                    name="search" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSuggestionsOpen(true);
                    }}
                    onFocus={() => setSuggestionsOpen(true)}
                    style={{ 
                      border: 'none', 
                      background: 'none', 
                      outline: 'none', 
                      color: '#fff', 
                      fontSize: '13px',
                      width: '100%' 
                    }} 
                  />
                  <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
                    🔍
                  </button>
                </form>

                {suggestionsOpen && searchQuery.trim() && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 999,
                    marginTop: '6px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.length > 0 ? (
                      suggestions.map(prod => {
                        const discountPrice = prod.price * (1 - prod.discount_percent / 100);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              navigate(`/products/${prod.id}`);
                              setSearchQuery('');
                              setSuggestionsOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color, #e2e8f0)',
                              transition: 'background-color 0.2s',
                              color: 'var(--text-primary, #1e293b)',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color, #f8fafc)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prod.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                {prod.brand}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {prod.discount_percent > 0 ? (
                                <>
                                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-accent, #6C63FF)' }}>
                                    ₹{discountPrice.toFixed(0)}
                                  </div>
                                  <div style={{ textDecoration: 'line-through', fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>
                                    ₹{prod.price.toFixed(0)}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #1e293b)' }}>
                                  ₹{prod.price.toFixed(0)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary, #64748b)', textAlign: 'center' }}>
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Mobile Navigation Drawer */}
            {mobileMenuOpen && (
              <div className="mobile-nav-menu">
                <ul className="mobile-nav-links">
                  {user && user.role === 'admin' ? (
                    <>
                      <li><Link to="/admin">Dashboard</Link></li>
                      <li><Link to="/admin/products">Products</Link></li>
                      <li><Link to="/admin/orders">Orders</Link></li>
                      <li><Link to="/admin/offers">Offers</Link></li>
                      <li><Link to="/admin/advertisements">Ads</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link to="/">Home</Link></li>
                      <li><Link to="/products">Catalog</Link></li>
                      {user && user.role === 'customer' && (
                        <li><Link to="/orders">My Orders</Link></li>
                      )}
                      <li>
                        <a
                          href="https://github.com/yogesh45-debug/electricstore"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <GitHubIcon size={18} />
                          <span>GitHub</span>
                        </a>
                      </li>
                      <li ref={searchMobileRef} style={{ padding: '8px 16px', position: 'relative' }}>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setMobileSuggestionsOpen(false);
                            setMobileMenuOpen(false);
                            navigate(`/products?search=${encodeURIComponent(searchMobileQuery)}`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-color)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            border: '1px solid var(--border-color)',
                            width: '100%'
                          }}
                        >
                          <input
                            type="text"
                            name="search"
                            placeholder="Search products..."
                            value={searchMobileQuery}
                            onChange={(e) => {
                              setSearchMobileQuery(e.target.value);
                              setMobileSuggestionsOpen(true);
                            }}
                            onFocus={() => setMobileSuggestionsOpen(true)}
                            style={{
                              border: 'none',
                              background: 'none',
                              outline: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              width: '100%'
                            }}
                          />
                          <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
                            🔍
                          </button>
                        </form>

                        {mobileSuggestionsOpen && searchMobileQuery.trim() && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '16px',
                            right: '16px',
                            backgroundColor: 'var(--card-bg, #ffffff)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            zIndex: 999,
                            marginTop: '4px',
                            maxHeight: '260px',
                            overflowY: 'auto'
                          }}>
                            {suggestionsMobile.length > 0 ? (
                              suggestionsMobile.map(prod => {
                                const discountPrice = prod.price * (1 - prod.discount_percent / 100);
                                return (
                                  <div
                                    key={prod.id}
                                    onClick={() => {
                                      navigate(`/products/${prod.id}`);
                                      setSearchMobileQuery('');
                                      setMobileSuggestionsOpen(false);
                                      setMobileMenuOpen(false);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                      transition: 'background-color 0.2s',
                                      color: 'var(--text-primary, #1e293b)',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color, #f8fafc)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <img
                                      src={prod.image_url}
                                      alt={prod.name}
                                      style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {prod.name}
                                      </div>
                                      <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>
                                        {prod.brand}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                      {prod.discount_percent > 0 ? (
                                        <>
                                          <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary-accent, #6C63FF)' }}>
                                            ₹{discountPrice.toFixed(0)}
                                          </div>
                                          <div style={{ textDecoration: 'line-through', fontSize: '9px', color: 'var(--text-secondary, #64748b)' }}>
                                            ₹{prod.price.toFixed(0)}
                                          </div>
                                        </>
                                      ) : (
                                        <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary, #1e293b)' }}>
                                          ₹{prod.price.toFixed(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '10px', fontSize: '12px', color: 'var(--text-secondary, #64748b)', textAlign: 'center' }}>
                                No products found
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            <nav className="header-nav">
              {user && user.role === 'admin' ? (
                // Admin navigation links
                <ul className="nav-links">
                  <li><Link to="/admin" className="nav-link">Dashboard</Link></li>
                  <li><Link to="/admin/products" className="nav-link">Products</Link></li>
                  <li><Link to="/admin/orders" className="nav-link">Orders</Link></li>
                  <li><Link to="/admin/offers" className="nav-link">Offers</Link></li>
                  <li><Link to="/admin/advertisements" className="nav-link">Ads</Link></li>
                </ul>
              ) : (
                // Customer/Public navigation links
                <ul className="nav-links">
                  <li><Link to="/" className="nav-link">Home</Link></li>
                  <li><Link to="/products" className="nav-link">Catalog</Link></li>
                  {user && user.role === 'customer' && (
                    <li><Link to="/orders" className="nav-link">My Orders</Link></li>
                  )}
                </ul>
              )}

              <div className="nav-buttons">
                {/* GitHub Repo Link */}
                <a
                  href="https://github.com/yogesh45-debug/electricstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub Repository"
                  aria-label="GitHub Repository"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    color: 'inherit',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    opacity: 0.85,
                    transition: 'opacity 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <GitHubIcon size={20} />
                </a>

                {/* Dark Mode Toggle */}
                <button
                  id="dark-mode-toggle"
                  className="dark-mode-toggle"
                  onClick={toggleDarkMode}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                </button>

                {(!user || user.role === 'customer') && (
                  <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '8px', marginRight: '10px' }} title="Cart">
                    <CartIcon size={20} />
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--deal-accent)',
                        color: '#FFFFFF', borderRadius: '50%', width: '18px', height: '18px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'
                      }}>
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {user ? (
                  <div className="profile-nav-wrapper" ref={profileRef}>
                    <button
                      className="profile-avatar-btn"
                      onClick={() => setProfileOpen(o => !o)}
                      aria-label="Open profile menu"
                      id="profile-nav-btn"
                    >
                      <div className="profile-avatar">{getInitials(user.name)}</div>
                      <span className="profile-name-text">{user.name.split(' ')[0]}</span>
                      <span className={`profile-chevron${profileOpen ? ' open' : ''}`}>▼</span>
                    </button>

                    {profileOpen && (
                      <div className="profile-dropdown" id="profile-dropdown">
                        {/* Header */}
                        <div className="profile-dropdown-header">
                          <strong>{user.name}</strong>
                          <p>{user.email}</p>
                        </div>

                        {/* Customer-only items */}
                        {user.role === 'customer' && (
                          <>
                            <Link to="/profile" className="profile-dropdown-item"><ProfileIcon size={16} /> My Profile</Link>
                            <Link to="/orders" className="profile-dropdown-item"><OrdersIcon size={16} /> My Orders</Link>
                            <Link to="/cart" className="profile-dropdown-item"><CartIcon size={16} /> My Cart</Link>
                            <div className="profile-dropdown-divider" />
                          </>
                        )}

                        {/* Admin-only items */}
                        {user.role === 'admin' && (
                          <>
                            <Link to="/admin" className="profile-dropdown-item"><DashboardIcon size={16} /> Dashboard</Link>
                            <Link to="/admin/products" className="profile-dropdown-item"><ProductsIcon size={16} /> Products</Link>
                            <Link to="/admin/orders" className="profile-dropdown-item"><OrdersIcon size={16} /> Orders</Link>
                            <Link to="/admin/offers" className="profile-dropdown-item"><OffersIcon size={16} /> Bank Offers</Link>
                            <Link to="/admin/advertisements" className="profile-dropdown-item"><AdsIcon size={16} /> Advertisements</Link>
                            <Link to="/admin/customers" className="profile-dropdown-item"><ProfileIcon size={16} /> Customers</Link>
                            <div className="profile-dropdown-divider" />
                          </>
                        )}

                        <button onClick={logout} className="profile-dropdown-item danger"><LogoutIcon size={16} /> Log Out</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Log In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      <main className="main-content" style={{ padding: isAdminPage ? 0 : '40px 20px' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Catalog />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/cart" element={<Cart />} />

          {/* Customer Routes (Protected) */}
          <Route path="/checkout" element={<CustomerRoute><Checkout /></CustomerRoute>} />
          <Route path="/order-success/:id" element={<CustomerRoute><OrderSuccess /></CustomerRoute>} />
          <Route path="/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
          <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />

          {/* Admin Routes (Protected) */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="advertisements" element={<AdminAdvertisements />} />
            <Route path="customers" element={<AdminCustomers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminPage && (
        <footer className="main-footer">
          <div className="footer-container">
            <div>
              <h3 className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogoIcon size={26} />
                <span>ElectroStore</span>
              </h3>
              <p style={{ maxWidth: '300px', fontSize: '13px' }}>
                Your premium destination for high-performance consumer electronics.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-links-group">
                <h4>Shop</h4>
                <ul>
                  <li><Link to="/products?category=smartphones">Smartphones</Link></li>
                  <li><Link to="/products?category=laptops">Laptops</Link></li>
                  <li><Link to="/products?category=audio">Audio</Link></li>
                </ul>
              </div>
              <div className="footer-links-group">
                <h4>Support</h4>
                <ul>
                  <li><Link to="/orders">Track Order</Link></li>
                  <li><Link to="/cart">My Cart</Link></li>
                  <li><Link to="/admin/login">Admin Portal</Link></li>
                </ul>
              </div>
              <div className="footer-links-group">
                <h4>GitHub</h4>
                <ul>
                  <li>
                    <a
                      href="https://github.com/yogesh45-debug/electricstore"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                    >
                      <GitHubIcon size={15} /> Repo
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/yogesh45-debug/electricstore/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'inherit', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                    >
                      Issues
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} ElectroStore Inc. All rights reserved. Scoped to Premium Electronics.
          </div>
        </footer>
      )}

    </div>
  );
};

const App = () => {
  return (
    <Router>
      <DarkModeProvider>
        <AuthProvider>
          <CartProvider>
            <LayoutWrapper />
          </CartProvider>
        </AuthProvider>
      </DarkModeProvider>
    </Router>
  );
};

export default App;
