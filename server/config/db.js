const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options; Mongoose 6+ no longer needs them
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farm-to-fork');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;