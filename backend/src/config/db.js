const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/statuzzz';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(`[MongoDB] Local connection failed (${error.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB] In-Memory Database running at: ${uri}`);
      return conn;
    } catch (memError) {
      console.error(`[MongoDB] In-Memory Database failed to start:`, memError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
