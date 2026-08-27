const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugsquad';
    const safeUriLog = mongoUri.replace(/:([^:@]+)@/, ':****@');
    
    console.log(`[BUG SQUAD] Connecting to MongoDB: ${safeUriLog}`);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[BUG SQUAD] MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error(`[BUG SQUAD] MongoDB Runtime Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[BUG SQUAD] MongoDB Connection Disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[BUG SQUAD] MongoDB Connection Reestablished.');
    });

  } catch (error) {
    console.error(`[BUG SQUAD] MongoDB Connection Failure: ${error.message}`);
    // Non-fatal logging keeps server functional for testing if Mongo drops
  }
};

module.exports = connectDB;
