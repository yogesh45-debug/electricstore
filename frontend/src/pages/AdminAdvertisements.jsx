import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { adminAPI, productAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminAdvertisements = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [ads, setAds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true
  });

  const [productSearch, setProductSearch] = useState('');

  const loadAds = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.listAdvertisements();
      setAds(response.data || []);
    } catch (err) {
      console.error("Failed to load admin advertisements:", err);
      setError('Failed to fetch active advertisement campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.list({ all: true });
      setProducts(response.data?.products || []);
    } catch (err) {
      console.error("Failed to load products for ad autofill:", err);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadAds();
    loadProducts();
  }, [user]);

  const openCreateModal = () => {
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true
    });
    setError('');
    setProductSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      is_active: ad.is_active
    });
    setError('');
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      image_url: formData.image_url.trim(),
      link_url: formData.link_url.trim(),
      is_active: !!formData.is_active
    };

    if (!payload.title || !payload.image_url) {
      setError('Please fill in both the Ad Title and the Image URL.');
      return;
    }

    try {
      if (editingAd) {
        await adminAPI.updateAdvertisement(editingAd.id, payload);
      } else {
        await adminAPI.createAdvertisement(payload);
      }
      setIsModalOpen(false);
      loadAds();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save advertisement campaign.');
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }
    
    try {
      await adminAPI.deleteAdvertisement(id);
      loadAds();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete advertisement.');
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await adminAPI.updateAdvertisement(ad.id, { is_active: !ad.is_active });
      loadAds();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle ad status.');
    }
  };

  return (
    <div className="animated-fade">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px' }}>Advertisement Banners</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage promotional slider campaigns visible on the homepage</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Add Advertisement
          </button>
        </div>

        {error && !isModalOpen && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading && ads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading advertisements...</div>
        ) : ads.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No advertisements configured. Create one to display on the public storefront homepage!
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Preview</th>
                    <th>Campaign Title</th>
                    <th>Subtext / Description</th>
                    <th>Target Link</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map(ad => (
                    <tr key={ad.id}>
                      <td className="tech-text">{ad.id}</td>
                      <td>
                        <img 
                          src={ad.image_url} 
                          alt={ad.title} 
                          style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{ad.title}</td>
                      <td style={{ fontSize: '13px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ad.description}
                      </td>
                      <td className="tech-text" style={{ fontSize: '12px' }}>{ad.link_url || '—'}</td>
                      <td>
                        <button 
                          onClick={() => handleToggleActive(ad)}
                          className={`badge ${ad.is_active ? 'badge-success' : 'badge-danger'}`}
                          style={{ 
                            border: 'none', 
                            cursor: 'pointer', 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontWeight: '600',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          title="Click to toggle active status"
                        >
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: ad.is_active ? '#10B981' : '#EF4444',
                            display: 'inline-block'
                          }} />
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(ad)} className="btn btn-secondary btn-sm">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteAd(ad.id)} className="btn btn-danger btn-sm">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ad Form Modal */}
      {/* Ad Form Modal */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,30,61,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--surface-color)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
              {editingAd ? `Edit Advertisement #${editingAd.id}` : 'Create New Advertisement'}
            </h2>

            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="modal-grid">
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Link & Autofill from Catalog Product (Optional)</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="🔍 Type to search catalog products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ marginBottom: '8px', fontSize: '13px' }}
                    />
                    <select 
                      className="form-control"
                      onChange={(e) => {
                        const prodId = e.target.value;
                        if (prodId) {
                          const prod = products.find(p => p.id === parseInt(prodId));
                          if (prod) {
                            setFormData(prev => ({
                              ...prev,
                              title: `Exclusive Deal: ${prod.name}`,
                              description: prod.description ? (prod.description.length > 80 ? prod.description.substring(0, 80) + '...' : prod.description) : `Get the best price on ${prod.name}!`,
                              image_url: prod.image_url || '',
                              link_url: `/products/${prod.id}`
                            }));
                          }
                        }
                      }}
                      value=""
                      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                    >
                      <option value="">-- Choose a Product --</option>
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase()))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))
                      }
                    </select>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Selecting a product automatically fills Title, Subtext, Image, and Target Link.
                    </small>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-primary)' }}>Ad Campaign Title *</label>
                    <input 
                      type="text" className="form-control" name="title" required
                      placeholder="e.g. Next-Gen Tech is Now Within Your Reach"
                      value={formData.title} onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-primary)' }}>Target Link URL</label>
                    <input 
                      type="text" className="form-control" name="link_url"
                      placeholder="e.g. /products?category=laptops or /products/3"
                      value={formData.link_url} onChange={handleFormChange}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setFormData(p => ({ ...p, link_url: '/products' }))}
                      >
                        Catalog
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setFormData(p => ({ ...p, link_url: '/products?category=smartphones' }))}
                      >
                        Smartphones
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setFormData(p => ({ ...p, link_url: '/products?category=laptops' }))}
                      >
                        Laptops
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setFormData(p => ({ ...p, link_url: '/products?category=audio' }))}
                      >
                        Audio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-primary)' }}>Subtext / Description</label>
                    <textarea 
                      className="form-control" name="description" rows="3"
                      placeholder="e.g. Save up to 15% on high-performance laptops and laptops accessories."
                      value={formData.description} onChange={handleFormChange}
                      style={{ resize: 'vertical', minHeight: '85px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-primary)' }}>Background Image URL *</label>
                    <input 
                      type="text" className="form-control" name="image_url" required
                      placeholder="e.g. https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600"
                      value={formData.image_url} onChange={handleFormChange}
                    />
                    {formData.image_url && (
                      <div style={{ marginTop: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
                        <div style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--border-color)', textAlign: 'left' }}>Live Image Preview</div>
                        <img 
                          src={formData.image_url} 
                          alt="Ad Preview" 
                          style={{ width: '100%', maxHeight: '110px', objectFit: 'cover', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                    <input 
                      type="checkbox" id="is_active" name="is_active"
                      checked={formData.is_active} onChange={handleFormChange}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_active" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                      Enable and Show Ad Banner on Storefront Homepage
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAd ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminAdvertisements;
