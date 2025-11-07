const mongoose = require('mongoose');

// Cache the mongoose connection across serverless invocations
let cachedConn = global.__mongooseConn || null;

const connectDB = async () => {
  try {
    if (cachedConn) return cachedConn;

    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/farm-to-fork';

    // Connect once and cache; avoid process.exit in serverless
    const conn = await mongoose.connect(uri);
    cachedConn = conn;
    global.__mongooseConn = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Log but do not exit; allow non-DB routes to work
    console.error(`MongoDB connection error: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;