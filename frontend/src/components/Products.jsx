import React, { useEffect, useState } from 'react';
import './Products.css';
import { getProducts } from '../services/productService';
import NegotiationPanel from './NegotiationPanel';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const Products = () => {
  const [available, setAvailable] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNegotiationFor, setOpenNegotiationFor] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const isFarmer = currentUser?.role === 'farmer';
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [avail, upc] = await Promise.all([
          getProducts({}),
          getProducts({ upcoming: true })
        ]);
        setAvailable(avail.filter(p => !p.isUpcoming));
        setUpcoming(upc);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNegotiate = (product) => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      navigate('/signin');
      return;
    }
    setOpenNegotiationFor(product);
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      navigate('/signin');
      return;
    }
    addItem(product, 1);
    setToastMsg('Product added');
    setToastOpen(true);
  };

  return (
    <div className="products-section">
      <div className="container">
        <div className="products-header">
          <h2 className="section-title">
            Featured <span className="highlight">Products</span>
          </h2>
          <p className="section-subtitle">
            Discover fresh, locally-grown produce directly from farmers at affordable prices.
          </p>
        </div>

        {loading && <div>Loading products...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && (
          <>
            <h3>Available Now</h3>
            <div className="products-grid">
              {available.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.imageUrl ? `${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api').replace('/api','')}${product.imageUrl}` : 'https://images.unsplash.com/photo-1524592157393-88fb3ef00d81?w=800&q=80&auto=format&fit=crop'} 
                      alt={product.name} 
                    />
                  </div>
                  <div className="product-content">
                    <div className="product-header">
                      <h3 className="product-title">{product.name}</h3>
                      <span className="product-category">
                        {product.unit || 'kg'}
                      </span>
                    </div>
                    <div className="product-pricing">
                      <span className="product-price">₹{product.price}/{product.unit}</span>
                      {product.offer ? <span className="product-market-rate">{product.offer}</span> : null}
                    </div>
                    <p className="product-farmer">Farmer listing</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleNegotiate(product)}>Negotiate</button>
                      { !isFarmer && (
                        <button className="btn btn-primary" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                      )}
                    </div>
                  </div>
                  {openNegotiationFor?._id === product._id && (
                    <NegotiationPanel product={product} />
                  )}
                </div>
              ))}
            </div>

            <h3>Upcoming</h3>
            <div className="products-grid">
              {upcoming.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.imageUrl ? `${(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api').replace('/api','')}${product.imageUrl}` : 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=80&auto=format&fit=crop'} 
                      alt={product.name} 
                    />
                  </div>
                  <div className="product-content">
                    <div className="product-header">
                      <h3 className="product-title">{product.name}</h3>
                      <span className="product-category">
                        {product.unit || 'kg'}
                      </span>
                    </div>
                    <div className="product-pricing">
                      <span className="product-price">₹{product.price}/{product.unit}</span>
                      <span className="badge">Upcoming</span>
                    </div>
                    <p className="product-farmer">Expected on {product.availableDate ? new Date(product.availableDate).toLocaleDateString() : 'TBD'}</p>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <div>No upcoming products listed.</div>}
            </div>
          </>
        )}

        <div className="view-all">
           <button className="btn btn-outline" onClick={() => navigate('/products')}>
           View All Products
           </button>
        </div>
      </div>
      <Toast open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default Products;