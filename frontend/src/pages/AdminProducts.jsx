import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { adminAPI, productAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AdminProducts = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means "Create mode"

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    discount_percent: 0,
    stock: '',
    image_url: '',
    gallery_images: [''], // Dynamic array of alternate image URLs
    category_id: '',
    specs: '{}', // String JSON
    rating: 4.5
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const catRes = await productAPI.categories();
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: catRes.data[0].id }));
      }

      const prodRes = await productAPI.list({ page, per_page: 10, sort: 'id_asc', search: searchFilter });
      setProducts(prodRes.data.products);
      setTotalPages(prodRes.data.pages);
    } catch (err) {
      console.error("Failed to load admin product list:", err);
      setError('Failed to fetch product catalog details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, page, searchFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      discount_percent: 0,
      stock: '',
      image_url: '',
      gallery_images: [''],
      category_id: categories[0]?.id || '',
      specs: '{\n  "RAM": "8GB",\n  "Storage": "128GB",\n  "Battery": "5000mAh",\n  "Display": "6.5 inch"\n}',
      about_item: '',
      rating: 4.5
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const gallery = product.gallery_images || [];
    setFormData({
      name: product.name,
      brand: product.brand,
      description: product.description || '',
      price: product.price,
      discount_percent: product.discount_percent,
      stock: product.stock,
      image_url: product.image_url || '',
      gallery_images: gallery.length > 0 ? [...gallery] : [''],
      category_id: product.category_id,
      specs: JSON.stringify(product.specs, null, 2),
      about_item: product.about_item || '',
      rating: product.rating
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGalleryImageChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.gallery_images];
      updated[index] = value;
      return { ...prev, gallery_images: updated };
    });
  };

  const addGalleryImageField = () => {
    setFormData(prev => ({
      ...prev,
      gallery_images: [...prev.gallery_images, '']
    }));
  };

  const removeGalleryImageField = (index) => {
    setFormData(prev => {
      const updated = prev.gallery_images.filter((_, i) => i !== index);
      return { ...prev, gallery_images: updated.length > 0 ? updated : [''] };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Parse specs JSON
    let parsedSpecs = {};
    try {
      const cleanSpecs = (formData.specs || '').trim();
      if (!cleanSpecs.startsWith('{') || !cleanSpecs.endsWith('}')) {
        throw new Error("JSON must start with '{' and end with '}'");
      }
      // Use Function constructor for robust and forgiving parsing (handles single quotes, unquoted keys, trailing commas)
      parsedSpecs = Function(`return (${cleanSpecs})`)();
      if (typeof parsedSpecs !== 'object' || parsedSpecs === null || Array.isArray(parsedSpecs)) {
        throw new Error("Must be a key-value object");
      }
    } catch (err) {
      setError(`Invalid Specs format: ${err.message}. Ensure it is a valid key-value object (e.g. {"RAM": "8GB"}).`);
      return;
    }

    const alts = (formData.gallery_images || [])
      .map(s => (s || '').trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      brand: formData.brand,
      description: formData.description,
      price: parseFloat(formData.price),
      discount_percent: parseInt(formData.discount_percent),
      stock: parseInt(formData.stock),
      image_url: formData.image_url,
      gallery_images: alts,
      category_id: parseInt(formData.category_id),
      specs: parsedSpecs,
      about_item: formData.about_item,
      rating: parseFloat(formData.rating || 4.5)
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
      } else {
        await productAPI.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product details.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is permanent.')) {
      return;
    }

    try {
      await productAPI.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  return (
    <div className="animated-fade">
      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px' }}>Products Management</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Add, edit, or remove catalog products</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            ➕ Add Product
          </button>
        </div>

        {/* Admin Products search bar */}
        <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--surface-color)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
          <input 
            type="text"
            className="form-control"
            placeholder="Search products by name, brand, or description..."
            value={searchFilter}
            onChange={(e) => {
              const updated = new URLSearchParams(searchParams);
              if (e.target.value) {
                updated.set('search', e.target.value);
              } else {
                updated.delete('search');
              }
              updated.set('page', '1');
              setSearchParams(updated);
            }}
            style={{ flex: 1, border: 'none', background: 'none', padding: '4px', outline: 'none', boxShadow: 'none', color: 'var(--text-primary)' }}
          />
          {searchFilter && (
            <button 
              onClick={() => {
                const updated = new URLSearchParams(searchParams);
                updated.delete('search');
                updated.set('page', '1');
                setSearchParams(updated);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}
            >
              Clear
            </button>
          )}
        </div>

        {error && !isModalOpen && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading products table...</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map(prod => (
                      <tr key={prod.id}>
                        <td className="tech-text">{prod.id}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{prod.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Brand: {prod.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td>{prod.category_name}</td>
                        <td className="tech-text">
                          {prod.discount_percent > 0 ? (
                            <>
                              <span style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>
                                ₹{(prod.price * (1 - prod.discount_percent / 100)).toFixed(2)}
                              </span>{' '}
                              <span style={{ textDecoration: 'line-through', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                ₹{prod.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            `₹${prod.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="tech-text">
                          <span className={`badge ${prod.stock <= 0 ? 'badge-danger' : prod.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                            {prod.stock} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button onClick={() => openEditModal(prod)} className="btn btn-secondary btn-sm">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="btn btn-danger btn-sm">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No products found matching those search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  &larr; Prev
                </button>
                <span style={{ fontSize: '14px', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal overlay */}
      {isModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,30,61,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--surface-color)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
              {editingProduct ? `Edit Product #${editingProduct.id}` : 'Create New Product'}
            </h2>

            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modal-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Product Name *</label>
                  <input
                    type="text" className="form-control" name="name" required
                    placeholder="e.g. iPhone 15 Pro"
                    value={formData.name} onChange={handleFormChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Brand Name *</label>
                  <input
                    type="text" className="form-control" name="brand" required
                    placeholder="e.g. Apple"
                    value={formData.brand} onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Category *</label>
                  <select
                    className="form-control" name="category_id" required
                    value={formData.category_id} onChange={handleFormChange}
                    style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Primary Image URL *</label>
                  <input
                    type="text" className="form-control" name="image_url" required
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url} onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Price (₹) *</label>
                  <input
                    type="number" step="0.01" className="form-control" name="price" required
                    placeholder="e.g. 79999.00"
                    value={formData.price} onChange={handleFormChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Discount Percent (%)</label>
                  <input
                    type="number" min="0" max="100" className="form-control" name="discount_percent"
                    placeholder="e.g. 10"
                    value={formData.discount_percent} onChange={handleFormChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Stock Quantity *</label>
                  <input
                    type="number" className="form-control" name="stock" required
                    placeholder="e.g. 50"
                    value={formData.stock} onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--text-primary)' }}>Rating (0 - 5)</label>
                  <input
                    type="number" step="0.1" min="0" max="5" className="form-control" name="rating"
                    placeholder="e.g. 4.5"
                    value={formData.rating} onChange={handleFormChange}
                  />
                </div>
                <div style={{ margin: 0 }}>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-primary)' }}>Description</label>
                <textarea
                  className="form-control" name="description" rows="3"
                  placeholder="Enter product description..."
                  value={formData.description} onChange={handleFormChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-primary)' }}>About Item (Separate points by new lines)</label>
                <textarea
                  className="form-control" name="about_item" rows="3"
                  placeholder="Enter details about item..."
                  value={formData.about_item} onChange={handleFormChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Gallery Image URLs (dynamic alternate images) */}
              <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                    Gallery Alternate Image URLs (Optional)
                  </h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addGalleryImageField}
                    style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    ➕ Add Image Option
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.gallery_images.map((url, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Gallery Image {index + 1}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Angle view ${index + 1} URL`}
                          value={url}
                          onChange={(e) => handleGalleryImageChange(index, e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                        />
                      </div>
                      {formData.gallery_images.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeGalleryImageField(index)}
                          style={{ marginTop: '20px', padding: '6px 10px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove this image URL"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Specifications (JSON Format) *</label>
                <textarea
                  className="form-control tech-text" name="specs" rows="6" required
                  value={formData.specs} onChange={handleFormChange}
                  style={{ resize: 'vertical', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
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

export default AdminProducts;
