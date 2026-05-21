const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const { cleanupExpiredOtps } = require('./controllers/authController');

// Load env vars
dotenv.config();

console.log('🚀 Starting Farm to Fork Backend...');
console.log(`📦 Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 Environment Variables Loaded: ${Object.keys(process.env).length}`);

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
      if (!existingAdmin.isVerified) {
        existingAdmin.isVerified = true;
        existingAdmin.otp = null;
        existingAdmin.otpExpiry = null;
        await existingAdmin.save({ validateBeforeSave: false });
      }
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }
    const admin = await User.create({ name, email, password, role: 'admin', isVerified: true });
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

// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://farmtofork-frontend.onrender.com',
    'https://farmtofork-frontend.vercel.app',
    /\.onrender\.com$/,
    /\.vercel\.app$/
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Static uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/impact', require('./routes/impactRoutes'));
app.use('/api/negotiations', require('./routes/negotiationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Farm to Fork API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      market: '/api/market',
      impact: '/api/impact',
      negotiations: '/api/negotiations',
      orders: '/api/orders',
      contact: '/api/contact'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/products',
      '/api/market',
      '/api/impact',
      '/api/negotiations',
      '/api/orders',
      '/api/contact'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
setInterval(cleanupExpiredOtps, 60 * 1000);
cleanupExpiredOtps();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Self-ping every 14 minutes to prevent Render free tier cold starts
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(() => {
    fetch(`${SELF_URL}/health`)
      .then(() => console.log('🏓 Self-ping OK'))
      .catch(() => {}); // silent fail
  }, 14 * 60 * 1000);
});

module.exports = app;
