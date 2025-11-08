const mongoose = require('mongoose');

// Cache the mongoose connection across serverless invocations
let cachedConn = global.__mongooseConn || null;
let connectingPromise = null;

const connectDB = async () => {
  try {
    // If already connected, return the connection
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If connecting, wait for the existing connection attempt
    if (mongoose.connection.readyState === 2 || connectingPromise) {
      if (connectingPromise) {
        await connectingPromise;
      } else {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000);
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    }

    // Prefer env var; fall back to Atlas URI for production reliability
    const uri = process.env.MONGO_URI || 'mongodb+srv://aakankshamore2805_db_user:farmtofork@cluster0.wh5gwdo.mongodb.net/farm-to-fork?retryWrites=true&w=majority&appName=Cluster0';

    // Create connection promise to prevent multiple simultaneous connections
    connectingPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
      bufferMaxEntries: 0,
    }).then((conn) => {
      cachedConn = conn;
      global.__mongooseConn = conn;
      connectingPromise = null;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).catch((error) => {
      connectingPromise = null;
      throw error;
    });

    const conn = await connectingPromise;
    return conn;
  } catch (error) {
    // Log but do not exit; allow non-DB routes to work
    console.error(`MongoDB connection error: ${error.message}`);
    connectingPromise = null;
    // Try to use existing connection if available
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    // Return null to indicate connection failure
    return null;
  }
};

module.exports = connectDB;