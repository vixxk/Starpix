const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing in backend .env');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected to MongoDB Atlas: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
