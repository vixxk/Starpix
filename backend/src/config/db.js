const mongoose = require('mongoose');

let mongoMemoryInstance = null;

const connectWithTimeout = (uri, options, timeoutMs = 2500) => {
  return Promise.race([
    mongoose.connect(uri, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/statuzzz';

  // 1. Try primary configured URI with strict 2.5s cap (prevents SRV DNS hang)
  try {
    const conn = await connectWithTimeout(mongoUri, { serverSelectionTimeoutMS: 2000 }, 2500);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Primary connection failed (${error.message}). Switching to fallback...`);
    try { await mongoose.disconnect(); } catch (e) {}
  }

  // 2. Try local standalone MongoDB instance
  if (!mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
    try {
      const localConn = await connectWithTimeout('mongodb://127.0.0.1:27017/statuzzz', { serverSelectionTimeoutMS: 2000 }, 2000);
      console.log(`[MongoDB] Connected to local fallback MongoDB: ${localConn.connection.host}`);
      return localConn;
    } catch (localErr) {
      console.warn(`[MongoDB] Local MongoDB unavailable (${localErr.message}). Starting MongoMemoryServer...`);
      try { await mongoose.disconnect(); } catch (e) {}
    }
  }

  // 3. Fallback to MongoMemoryServer for zero-downtime dev/testing environment
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryInstance = await MongoMemoryServer.create();
    const memUri = mongoMemoryInstance.getUri();
    const memConn = await mongoose.connect(memUri);
    console.log(`[MongoDB] Connected to MongoMemoryServer in-memory DB: ${memConn.connection.host}`);
    return memConn;
  } catch (memErr) {
    console.error(`[MongoDB] Fatal: All database connection attempts failed: ${memErr.message}`);
  }
};

module.exports = connectDB;
