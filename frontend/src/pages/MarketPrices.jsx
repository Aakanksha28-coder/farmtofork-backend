import React, { useState, useEffect } from 'react';
import { listPrices, getIndianPrices } from '../services/marketService';
import './MarketPrices.css';

const MarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Indian API filters
  const [commodity, setCommodity] = useState('');
  const [stateName, setStateName] = useState('');
  const [marketName, setMarketName] = useState('');
  const [limit, setLimit] = useState(25);
  const [indiaLoading, setIndiaLoading] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const data = await listPrices();
        setPrices(data);
      } catch (err) {
        setError(err.message || 'Failed to load market prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const categories = ['all', ...new Set(prices.map(price => price.category))];

  const filteredPrices = prices
    .filter(price => filter === 'all' || price.category === filter)
    .filter(price => 
      price.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const fetchIndian = async () => {
    try {
      setError('');
      setIndiaLoading(true);
      const data = await getIndianPrices({ commodity, state: stateName, market: marketName, limit });
      // Replace current list with Indian live data
      setPrices(data);
      setFilter('all');
    } catch (err) {
      setError(err.message || 'Failed to fetch Indian market prices');
    } finally {
      setIndiaLoading(false);
    }
  };

  return (
    <div className="market-prices container">
      <h1>Live Market Prices</h1>
      <p className="subtitle">Current market prices for agricultural products</p>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${filter === category ? 'active' : ''}`}
              onClick={() => setFilter(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Indian API controls */}
      <div className="filters" style={{ marginTop: '1rem' }}>
        <div className="search-box" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Commodity (e.g., Tomato)"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
          />
          <input
            type="text"
            placeholder="State (optional)"
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Market (optional)"
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
          />
          <input
            type="number"
            min={1}
            style={{ width: '120px' }}
            placeholder="Limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 25)}
          />
          <button className="category-btn" onClick={fetchIndian} disabled={indiaLoading}>
            {indiaLoading ? 'Fetching…' : 'Fetch Indian Prices'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading market prices...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="prices-grid">
          {filteredPrices.length === 0 ? (
            <div className="no-results">No market prices found</div>
          ) : (
            filteredPrices.map((price) => (
              <div key={`${price.productName}-${price.recordedAt}-${price.market || ''}`} className="price-card">
                <div className="price-header">
                  <h3>{price.productName}</h3>
                  <span className="category">{price.category}</span>
                </div>
                <div className="price-body">
                  <div className="price-value">₹{Number(price.price).toFixed(2)} <span className="unit">per {price.unit || 'kg'}</span></div>
                  <div className="price-rate"><strong>Rate per kg</strong></div>
                  <div className="price-meta">
                    <div className="source">Source: {price.source}{price.market ? ` • ${price.market}, ${price.state || ''}` : ''}</div>
                    <div className="date">Updated: {new Date(price.recordedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MarketPrices;