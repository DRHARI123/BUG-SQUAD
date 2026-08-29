const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugsquad';
    if (mongoUri.includes('<cluster>') || mongoUri.includes('<iamharidrin_db_user>')) {
      mongoUri = 'mongodb://127.0.0.1:27017/bugsquad';
    }
    const safeUriLog = mongoUri.replace(/:([^:@]+)@/, ':****@');
    
    console.log(`[BUG SQUAD] Connecting to MongoDB: ${safeUriLog}`);

    let conn;
    try {
      conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
    } catch (primaryErr) {
      if (mongoUri !== 'mongodb://127.0.0.1:27017/bugsquad') {
        console.warn(`[BUG SQUAD] Primary Mongo connection failed (${primaryErr.message}). Trying fallback local MongoDB...`);
        mongoUri = 'mongodb://127.0.0.1:27017/bugsquad';
        conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
      } else {
        throw primaryErr;
      }
    }

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
