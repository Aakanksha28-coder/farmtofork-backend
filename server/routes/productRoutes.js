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
  getMyProducts,
  getPoojaProducts
} = require('../controllers/productController');

// Multer setup for image upload
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
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
const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Public: list products and upcoming
router.get('/', getProducts);
// Pooja products — must be before /:id
router.get('/pooja', getPoojaProducts);
// Add protected route to list products owned by the authenticated farmer (must be before /:id)
router.get('/mine', protect, authorizeRoles('farmer'), getMyProducts);
// Get single product by ID (must be after /mine to avoid conflict)
router.get('/:id', getProductById);

// Farmer-only operations
router.post('/', protect, authorizeRoles('farmer'), upload.single('image'), createProduct);
router.put('/:id', protect, authorizeRoles('farmer'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorizeRoles('farmer'), deleteProduct);

module.exports = router;