import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { adminAPI, productAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  DashboardIcon, 
  ProductsIcon, 
  OrdersIcon, 
  OffersIcon, 
  AdsIcon, 
  StorefrontIcon, 
  HomeIcon,
  ProfileIcon
} from '../components/Icons';

/* ── Inline Styles / Theme ─────────────────────────────────────────────── */
const SIDEBAR_BG  = '#0B132B';
const ACCENT      = '#6C63FF';
const ACCENT2     = '#17B8A6';
const CARD_BG     = '#FFFFFF';
const PAGE_BG     = '#F4F6FA';
const TEXT_MAIN   = '#1E293B';
const TEXT_MUTED  = '#64748B';
const BORDER      = '#E2E8F0';

/* ── Sidebar Nav Item ───────────────────────────────────────────────────── */
const SideNavItem = ({ to, icon, label, active }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 10, textDecoration: 'none',
    backgroundColor: active ? `${ACCENT}22` : 'transparent',
    color: active ? ACCENT : 'rgba(255,255,255,0.7)',
    fontWeight: active ? 700 : 400, fontSize: 14,
    transition: 'all 0.15s ease',
    borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
  }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span>{label}</span>
  </Link>
);

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Admin Search Autocomplete States
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSuggestions, setAdminSuggestions] = useState([]);
  const [adminSuggestionsOpen, setAdminSuggestionsOpen] = useState(false);
  const adminSearchRef = useRef(null);

  // Debounced search for Admin suggestions
  useEffect(() => {
    if (!adminSearchQuery.trim()) {
      setAdminSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await productAPI.list({ search: adminSearchQuery, per_page: 5 });
        setAdminSuggestions(res.data.products || []);
      } catch (err) {
        console.error("Admin Autocomplete fetch failed:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [adminSearchQuery]);

  // Click outside suggestions list
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminSearchRef.current && !adminSearchRef.current.contains(e.target)) {
        setAdminSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(console.error);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const SIDEBAR_W = sidebarOpen ? 230 : 0;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: PAGE_BG, fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative' }}>
      {/* ═══ SIDEBAR MOBILE OVERLAY BACKDROP ═══ */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 99,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        position: isMobile ? 'fixed' : 'static',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        width: SIDEBAR_W,
        minWidth: SIDEBAR_W,
        backgroundColor: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none'
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
                Electro<span style={{ color: ACCENT2 }}>Store</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.1em' }}>CONTROL PANEL</div>
            </div>
          </div>
        </div>

        {/* Admin profile chip */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff'
          }}>
            {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.name || 'Admin'}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Administrator</div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '8px 4px 6px', textTransform: 'uppercase' }}>Main</div>
          <SideNavItem to="/admin"          icon={<DashboardIcon />} label="Dashboard"   active={location.pathname === '/admin'} />
          <SideNavItem to="/admin/products" icon={<ProductsIcon />} label="Products"    active={location.pathname === '/admin/products'} />
          <SideNavItem to="/admin/orders"   icon={<OrdersIcon />} label="Orders"      active={location.pathname === '/admin/orders'} />
          <SideNavItem to="/admin/offers"   icon={<OffersIcon />} label="Bank Offers" active={location.pathname === '/admin/offers'} />
          <SideNavItem to="/admin/advertisements" icon={<AdsIcon />} label="Advertisements" active={location.pathname === '/admin/advertisements'} />
          <SideNavItem to="/admin/customers" icon={<ProfileIcon />} label="Customers" active={location.pathname === '/admin/customers'} />

          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '16px 4px 6px', textTransform: 'uppercase' }}>Store</div>
          <SideNavItem to="/products" icon={<StorefrontIcon />} label="Storefront" active={false} />
          <SideNavItem to="/"         icon={<HomeIcon />} label="Home Page"  active={false} />
        </nav>

        {/* Low stock warning badge */}
        {stats?.low_stock_count > 0 && (
          <div style={{ margin: '0 12px 16px', borderRadius: 10, backgroundColor: '#7F1D1D22', border: '1px solid #EF444433', padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 600 }}>⚠️ Low Stock</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {stats.low_stock_count} product{stats.low_stock_count > 1 ? 's' : ''} below threshold
            </div>
            <Link to="/admin/products" style={{ fontSize: 11, color: '#F87171', textDecoration: 'underline', display: 'block', marginTop: 6 }}>Restock →</Link>
          </div>
        )}
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden', height: '100vh' }}>
        {/* Top Bar */}
        <header style={{
          backgroundColor: CARD_BG, padding: '0 28px',
          height: 62, display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: `1px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)'
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: TEXT_MUTED, padding: 4, lineHeight: 1 }}
            title="Toggle sidebar"
          >☰</button>
          {!isMobile && (
            <div ref={adminSearchRef} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 360, backgroundColor: '#F1F5F9', borderRadius: 10, padding: '8px 14px', position: 'relative' }}>
              <span style={{ color: TEXT_MUTED, fontSize: 16 }}>🔍</span>
              <input
                placeholder="Search products..."
                value={adminSearchQuery}
                onChange={(e) => {
                  setAdminSearchQuery(e.target.value);
                  setAdminSuggestionsOpen(true);
                }}
                onFocus={() => setAdminSuggestionsOpen(true)}
                style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: 14, color: TEXT_MAIN }}
              />

              {adminSuggestionsOpen && adminSearchQuery.trim() && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 999,
                  marginTop: '6px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {adminSuggestions.length > 0 ? (
                    adminSuggestions.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          navigate(`/admin/products?search=${encodeURIComponent(prod.name)}`);
                          setAdminSearchQuery('');
                          setAdminSuggestionsOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${BORDER}`,
                          transition: 'background-color 0.2s',
                          color: TEXT_MAIN,
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PAGE_BG}
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
                          <div style={{ fontSize: '11px', color: TEXT_MUTED }}>
                            ID: {prod.id} · Brand: {prod.brand}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: ACCENT }}>
                          ₹{prod.price.toFixed(0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', fontSize: '13px', color: TEXT_MUTED, textAlign: 'center' }}>
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <>
              <Link to="/admin/orders" style={{ padding: '7px 16px', borderRadius: 10, backgroundColor: PAGE_BG, border: `1px solid ${BORDER}`, fontSize: 13, color: TEXT_MAIN, textDecoration: 'none', fontWeight: 500 }}>
                Manage Orders
              </Link>
              <Link to="/admin/products" style={{ padding: '7px 16px', borderRadius: 10, backgroundColor: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                + New Product
              </Link>
            </>
          )}
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: isMobile ? '16px' : '28px', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
