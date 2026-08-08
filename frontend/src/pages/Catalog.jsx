import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination details
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // Filters read from URL params
  const categoryFilter = searchParams.get('category') || '';
  const searchFilter = searchParams.get('search') || '';
  const minPriceFilter = searchParams.get('min_price') || '';
  const maxPriceFilter = searchParams.get('max_price') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sortFilter = searchParams.get('sort') || '';
  const minRatingFilter = searchParams.get('min_rating') || '';
  const inStockFilter = searchParams.get('in_stock') === 'true';
  const onSaleFilter = searchParams.get('on_sale') === 'true';
  const pageFilter = parseInt(searchParams.get('page') || '1');

  // Input states for active search forms
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [minPriceInput, setMinPriceInput] = useState(minPriceFilter);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceFilter);
  const [brandInput, setBrandInput] = useState(brandFilter);
  const [minRatingInput, setMinRatingInput] = useState(minRatingFilter);
  const [inStockInput, setInStockInput] = useState(inStockFilter);
  const [onSaleInput, setOnSaleInput] = useState(onSaleFilter);

  useEffect(() => {
    // Sync input states when url params change
    setSearchInput(searchFilter);
    setMinPriceInput(minPriceFilter);
    setMaxPriceInput(maxPriceFilter);
    setBrandInput(brandFilter);
    setMinRatingInput(minRatingFilter);
    setInStockInput(inStockFilter);
    setOnSaleInput(onSaleFilter);
  }, [searchFilter, minPriceFilter, maxPriceFilter, brandFilter, minRatingFilter, inStockFilter, onSaleFilter]);

  // Debounced search-as-you-type for the search input
  useEffect(() => {
    if (searchInput === searchFilter) return;
    const delayDebounceFn = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, searchFilter]);

  useEffect(() => {
    const fetchCatalogData = async () => {
      setLoading(true);
      try {
        const catRes = await productAPI.categories();
        setCategories(catRes.data);

        // Fetch products based on search params
        const params = {
          category: categoryFilter,
          search: searchFilter,
          min_price: minPriceFilter,
          max_price: maxPriceFilter,
          brand: brandFilter,
          sort: sortFilter,
          min_rating: minRatingFilter,
          in_stock: inStockFilter ? 'true' : '',
          on_sale: onSaleFilter ? 'true' : '',
          page: pageFilter,
          per_page: 8
        };
        const prodRes = await productAPI.list(params);
        setProducts(prodRes.data.products);
        setTotalPages(prodRes.data.pages);
        setCurrentPage(prodRes.data.page);
        setTotalProductsCount(prodRes.data.total);
      } catch (error) {
        console.error("Failed to load catalog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogData();
  }, [searchParams]);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    
    // Always reset to page 1 on filter changes
    updated.set('page', '1');

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ 
      search: searchInput,
      min_price: minPriceInput,
      max_price: maxPriceInput,
      brand: brandInput,
      min_rating: minRatingInput,
      in_stock: inStockInput ? 'true' : '',
      on_sale: onSaleInput ? 'true' : ''
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setBrandInput('');
    setMinRatingInput('');
    setInStockInput(false);
    setOnSaleInput(false);
    setSearchParams({});
  };

  const handlePageChange = (pageNum) => {
    const updated = new URLSearchParams(searchParams);
    updated.set('page', pageNum.toString());
    setSearchParams(updated);
  };

  return (
    <div className="animated-fade" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Product Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Found {totalProductsCount} electronic products
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Sort By:</label>
          <select 
            className="form-control" 
            style={{ width: '160px', padding: '8px' }}
            value={sortFilter}
            onChange={(e) => updateFilters({ sort: e.target.value })}
          >
            <option value="">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      <div className="catalog-grid">
        {/* Filters Sidebar */}
        <aside className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
              Categories
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <button 
                  onClick={() => updateFilters({ category: '' })}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                    fontWeight: categoryFilter === '' ? 700 : 400,
                    color: categoryFilter === '' ? 'var(--primary-accent)' : 'var(--text-primary)'
                  }}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => updateFilters({ category: cat.slug })}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                      fontWeight: categoryFilter === cat.slug ? 700 : 400,
                      color: categoryFilter === cat.slug ? 'var(--primary-accent)' : 'var(--text-primary)'
                    }}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                Search Keyword
              </h3>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Name, brand, desc..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ padding: '8px 12px' }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                Brand
              </h3>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Apple, Samsung, Dell..."
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                style={{ padding: '8px 12px' }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                Price Range (₹)
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Min" 
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  style={{ padding: '8px', width: '50%' }}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Max" 
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  style={{ padding: '8px', width: '50%' }}
                />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                Customer Rating
              </h3>
              <select
                className="form-control"
                value={minRatingInput}
                onChange={(e) => setMinRatingInput(e.target.value)}
                style={{ padding: '8px 12px', width: '100%', backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <option value="">All Ratings</option>
                <option value="4.5">4.5 ★ & Above</option>
                <option value="4.0">4.0 ★ & Above</option>
                <option value="3.5">3.5 ★ & Above</option>
                <option value="3.0">3.0 ★ & Above</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={inStockInput}
                  onChange={(e) => setInStockInput(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                In Stock Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={onSaleInput}
                  onChange={(e) => setOnSaleInput(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                On Sale Only (Special Deals)
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              Apply Filters
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleClearFilters}
              style={{ width: '100%' }}
            >
              Clear All
            </button>
          </form>
        </aside>

        {/* Main Products Grid */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>Loading products catalog...</div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              No products found matching those search criteria.
            </div>
          ) : (
            <>
              <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {products.map((product) => {
                  const discountPrice = product.price * (1 - product.discount_percent / 100);
                  
                  // Snapshot spec strings
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

                      <div className="product-image-container" style={{ height: '170px' }}>
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/300x200'} 
                          alt={product.name} 
                          className="product-image"
                        />
                      </div>

                      <div className="product-info">
                        <span className="product-brand">{product.brand}</span>
                        <h3 className="product-title" style={{ fontSize: '15px' }}>
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

                        <Link to={`/products/${product.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                          View Product
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &larr; Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button 
                      key={pageNum}
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: '35px' }}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button 
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
