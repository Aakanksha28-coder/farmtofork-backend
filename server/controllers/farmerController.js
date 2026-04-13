const User = require('../models/User');
const Product = require('../models/Product');

/**
 * GET /api/farmers/nearby?lat=&lng=&radius=
 * Returns farmers within `radius` km (default 40) of the given coordinates.
 * Each farmer includes their product count and a sample of their products.
 */
exports.getNearbyFarmers = async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = Math.min(parseInt(req.query.radius) || 40, 100); // cap at 100 km

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const maxDistance = radius * 1000; // metres

    const farmers = await User.find({
      role: 'farmer',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance
        }
      }
    }).select('name roleSpecificData location whatsapp').limit(50);

    // Attach product count + up to 3 sample products per farmer
    const results = await Promise.all(
      farmers.map(async (f) => {
        const products = await Product.find({ farmer: f._id })
          .select('name price unit imageUrl category')
          .limit(3);
        const total = await Product.countDocuments({ farmer: f._id });
        return {
          _id: f._id,
          name: f.name,
          farmName: f.roleSpecificData?.farmName || '',
          farmLocation: f.roleSpecificData?.farmLocationText || '',
          whatsapp: f.whatsapp || '',
          coordinates: f.location?.coordinates, // [lng, lat]
          products,
          totalProducts: total
        };
      })
    );

    res.json({ count: results.length, radius, farmers: results });
  } catch (error) {
    console.error('getNearbyFarmers error:', error);
    res.status(500).json({ message: error.message });
  }
};
