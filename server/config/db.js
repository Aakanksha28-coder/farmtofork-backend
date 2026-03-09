const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/farm-to-fork';
    
    if (!process.env.MONGO_URI) {
      console.warn('⚠️  MONGO_URI not set in environment variables. Using local MongoDB.');
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    // Remove deprecated options; Mongoose 6+ no longer needs them
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Please check your MONGO_URI environment variable.');
    process.exit(1);
  }
};

module.exports = connectDB;