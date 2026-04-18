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

// Multer setup — memory storage, convert to base64 in controller (no filesystem dependency)
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Images only'));
  }
});

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