const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  
  try {
    if (!mongoURI) {
      console.error('❌ MONGO_URI environment variable is not set!');
      console.error('Please set MONGO_URI in your Render environment variables.');
      console.error('Example: mongodb+srv://username:password@cluster.mongodb.net/farm-to-fork');
      process.exit(1);
    }
    
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 Connection type: ${mongoURI.startsWith('mongodb+srv') ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB'}`);
    
    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed!`);
    console.error(`Error: ${error.message}`);
    
    // Provide specific troubleshooting based on error type
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('\n🔍 DNS/Network Error Detected:');
      console.error('1. Check if your MongoDB Atlas cluster exists and is running');
      console.error('2. Verify the connection string format in MONGO_URI');
      console.error('3. Ensure the cluster address is correct');
      console.error('4. Check if MongoDB Atlas is accessible from Render servers');
      console.error('5. Try creating a NEW MongoDB Atlas cluster with a different name');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Authentication Error:');
      console.error('1. Check username and password in connection string');
      console.error('2. Verify database user exists in MongoDB Atlas');
      console.error('3. Ensure user has correct permissions');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n🔍 Network Access Error:');
      console.error('1. Add 0.0.0.0/0 to IP whitelist in MongoDB Atlas');
      console.error('2. Or add Render\'s IP addresses to whitelist');
    }
    
    if (mongoURI) {
      console.error('\n📝 Current MONGO_URI format:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    }
    process.exit(1);
  }
};

module.exports = connectDB;