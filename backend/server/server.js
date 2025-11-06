const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Ensure a single admin user exists based on environment credentials
const User = require('./models/User');
(async function ensureAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Administrator';
    if (!email || !password) {
      console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seeding');
      return;
    }
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }
    const admin = await User.create({ name, email, password, role: 'admin' });
    console.log('Admin user created:', admin.email);
  } catch (err) {
    console.error('Admin seeding error:', err.message);
  }
})();

const app = express();

// Disable ETag to avoid 304 responses that break JSON parsing
app.set('etag', false);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// Static uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/impact', require('./routes/impactRoutes'));
app.use('/api/negotiations', require('./routes/negotiationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;