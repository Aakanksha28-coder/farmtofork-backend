const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/productController');

// Multer setup for image upload
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use /tmp for Render/Vercel serverless (read-write), otherwise use uploads directory
const isRender = process.env.RENDER || process.env.RENDER_SERVICE_ID;
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const uploadsDir = (isRender || isVercel)
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP images allowed'));
};
const upload = multer({ 
  storage, 
  fileFilter: imageFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  if (err) {
    // Handle file filter errors
    if (err.message && err.message.includes('Only JPG')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// Public: list products and upcoming
router.get('/', getProducts);
// Add protected route to list products owned by the authenticated farmer
router.get('/mine', protect, authorizeRoles('farmer'), getMyProducts);
router.get('/:id', getProductById);

// Farmer-only operations - multer error handler must come after upload middleware
router.post('/', protect, authorizeRoles('farmer'), upload.single('image'), handleMulterError, createProduct);
router.put('/:id', protect, authorizeRoles('farmer'), upload.single('image'), handleMulterError, updateProduct);
router.delete('/:id', protect, authorizeRoles('farmer'), deleteProduct);

module.exports = router;