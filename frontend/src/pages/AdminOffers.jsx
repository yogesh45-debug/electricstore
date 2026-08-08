import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminOffers = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    offer_text: '',
    min_purchase: 0,
    discount_value: 0,
    is_active: true
  });

  const loadOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.listOffers();
      setOffers(response.data || []);
    } catch (err) {
      console.error("Failed to load admin offers:", err);
      setError('Failed to fetch store promotions and bank offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadOffers();
  }, [user]);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormData({
      bank_name: '',
      offer_text: '',
      min_purchase: 0,
      discount_value: 0,
      is_active: true
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      bank_name: offer.bank_name,
      offer_text: offer.offer_text,
      min_purchase: offer.min_purchase,
      discount_value: offer.discount_value,
      is_active: offer.is_active
    });
    setError('');
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
      bank_name: formData.bank_name.trim(),
      offer_text: formData.offer_text.trim(),
      min_purchase: parseFloat(formData.min_purchase) || 0,
      discount_value: parseFloat(formData.discount_value) || 0,
      is_active: !!formData.is_active
    };

    if (!payload.bank_name || !payload.offer_text || payload.discount_value <= 0) {
      setError('Please fill in bank name, offer description, and discount value.');
      return;
    }

    try {
      if (editingOffer) {
        await adminAPI.updateOffer(editingOffer.id, payload);
      } else {
        await adminAPI.createOffer(payload);
      }
      setIsModalOpen(false);
      loadOffers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save offer details.');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank offer?')) {
      return;
    }
    
    try {
      await adminAPI.deleteOffer(id);
      loadOffers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete offer.');
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      await adminAPI.updateOffer(offer.id, { is_active: !offer.is_active });
      loadOffers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status.');
    }
  };

  return (
    <div className="animated-fade">
      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px' }}>Bank Offers Management</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Configure instant discount and cash promotion offers</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Add Bank Offer
          </button>
        </div>

        {error && !isModalOpen && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading && offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No bank offers configured. Create one to display on product pages!
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bank Name</th>
                    <th>Offer Description</th>
                    <th>Min. Purchase</th>
                    <th>Discount Value</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(offer => (
                    <tr key={offer.id}>
                      <td className="tech-text">{offer.id}</td>
                      <td style={{ fontWeight: 600 }}>{offer.bank_name}</td>
                      <td style={{ fontSize: '13px' }}>{offer.offer_text}</td>
                      <td className="tech-text">₹{offer.min_purchase.toFixed(2)}</td>
                      <td className="tech-text" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
                        ₹{offer.discount_value.toFixed(2)}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleActive(offer)}
                          className={`badge ${offer.is_active ? 'badge-success' : 'badge-danger'}`}
                          style={{ border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                          title="Click to toggle status"
                        >
                          {offer.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(offer)} className="btn btn-secondary btn-sm">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteOffer(offer.id)} className="btn btn-danger btn-sm">
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

      {/* Offer Form Modal */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,30,61,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface-color)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
              {editingOffer ? `Edit Bank Offer #${editingOffer.id}` : 'Create New Bank Offer'}
            </h2>

            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-primary)' }}>Bank Name *</label>
                <input 
                  type="text" className="form-control" name="bank_name" required
                  placeholder="e.g. HDFC Bank, SBI Card"
                  value={formData.bank_name} onChange={handleFormChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-primary)' }}>Offer Description Text *</label>
                <input 
                  type="text" className="form-control" name="offer_text" required
                  placeholder="e.g. 10% Instant Discount up to ₹1,500"
                  value={formData.offer_text} onChange={handleFormChange}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input 
                  type="checkbox" id="is_active" name="is_active"
                  checked={formData.is_active} onChange={handleFormChange}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                  Enable and Show Offer on Catalog Pages
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOffer ? 'Save Changes' : 'Create Offer'}
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

export default AdminOffers;
