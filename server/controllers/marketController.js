const MarketPrice = require('../models/MarketPrice');

// Upload or update market price (simple upsert by productName)
exports.uploadPrice = async (req, res) => {
  try {
    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    const { productName, category, unit = 'kg', price, source } = req.body;
    if (!productName || !price) return res.status(400).json({ message: 'productName and price required' });

    const mp = await MarketPrice.create({ productName, category, unit, price, source: source || 'uploaded' });
    res.status(201).json(mp);
  } catch (error) {
    console.error('Upload price error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Latest price by productName
exports.getLatestPrice = async (req, res) => {
  try {
    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    const { product } = req.query;
    if (!product) return res.status(400).json({ message: 'product query required' });
    const mp = await MarketPrice.findOne({ productName: product }).sort({ recordedAt: -1, createdAt: -1 });
    if (!mp) return res.status(404).json({ message: 'No price found' });
    res.json(mp);
  } catch (error) {
    console.error('Get latest price error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// List recent prices (optionally filter by category)
exports.listPrices = async (req, res) => {
  try {
    // Check if database connection exists
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected');
      return res.status(503).json({ message: 'Database connection not available' });
    }

    const { category } = req.query;
    const q = category ? { category } : {};
    const items = await MarketPrice.find(q).sort({ recordedAt: -1, createdAt: -1 }).limit(50);
    res.json(items || []);
  } catch (error) {
    console.error('List prices error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Fetch Indian market prices via data.gov.in Agmarknet dataset
exports.getIndianPrices = async (req, res) => {
  try {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'DATA_GOV_API_KEY is not set in environment' });
    }

    const { commodity, state, market, limit = 25 } = req.query;
    const baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    const params = new URLSearchParams({ 'api-key': apiKey, format: 'json', limit: String(limit) });
    if (commodity) params.append('filters[commodity]', commodity);
    if (state) params.append('filters[state]', state);
    if (market) params.append('filters[market]', market);

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ message: 'Failed to fetch from data.gov.in', details: text });
    }
    const json = await response.json();
    const records = Array.isArray(json.records) ? json.records : [];

    // Agmarknet modal_price is in Rs./Quintal. Convert to Rs./kg.
    const normalized = records
      .filter(rec => rec && rec.modal_price && !isNaN(Number(rec.modal_price)))
      .map((rec) => ({
        productName: rec.variety ? `${rec.commodity} - ${rec.variety}` : rec.commodity,
        category: rec.commodity,
        unit: 'kg',
        price: Number(rec.modal_price) / 100,
        source: 'agmarknet',
        recordedAt: rec.arrival_date ? new Date(rec.arrival_date) : new Date(),
        market: rec.market,
        state: rec.state,
        district: rec.district
      }));

    res.json(normalized);
  } catch (error) {
    console.error('Indian price fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};