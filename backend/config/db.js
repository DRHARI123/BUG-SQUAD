const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[BUG SQUAD] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[BUG SQUAD] MongoDB Connection Error: ${error.message}`);
    // Non-fatal logging to keep server functional for mock/testing if local Mongo isn't active
  }
};

module.exports = connectDB;
