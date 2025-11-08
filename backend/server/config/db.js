const mongoose = require('mongoose');

// Cache the mongoose connection across serverless invocations
let cachedConn = global.__mongooseConn || null;

const connectDB = async () => {
  try {
    // If already connected, return the connection
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If cached connection exists, return it
    if (cachedConn && mongoose.connection.readyState === 1) {
      return cachedConn;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
      return mongoose.connection;
    }

    // Prefer env var; fall back to Atlas URI for production reliability
    const uri = process.env.MONGO_URI || 'mongodb+srv://aakankshamore2805_db_user:farmtofork@cluster0.wh5gwdo.mongodb.net/farm-to-fork?retryWrites=true&w=majority&appName=Cluster0';

    // Connect with options optimized for serverless
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    cachedConn = conn;
    global.__mongooseConn = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Log but do not exit; allow non-DB routes to work
    console.error(`MongoDB connection error: ${error.message}`);
    // Try to use existing connection if available
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    return null;
  }
};

module.exports = connectDB;