const multer = require('multer');

// Store file in memory — we'll convert to base64 and save in MongoDB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter(req, file, cb) {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Images only (jpg, png, webp)'));
  },
});

module.exports = upload;
