const mongoose = require('mongoose');

let cachedConn = global.__mongooseConn || null;
let connectingPromise = null;

const connectDB = async () => {
  try {
    // Already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If currently connecting, await it
    if (connectingPromise) {
      await connectingPromise;
      return mongoose.connection;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI environment variable is not set');
      return null;
    }

    // Create a single connection promise
    connectingPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
      // ❌ removed bufferCommands and bufferMaxEntries completely
    });

    await connectingPromise;

    cachedConn = mongoose.connection;
    global.__mongooseConn = cachedConn;
    connectingPromise = null;

    console.log(`✅ MongoDB Connected: ${cachedConn.host}`);
    return cachedConn;

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    connectingPromise = null;

    // If connection exists, reuse it
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    return null;
  }
};

module.exports = connectDB;
