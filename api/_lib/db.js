const mongoose = require('mongoose');

/**
 * Cached MongoDB connection for Vercel serverless functions.
 * Reuses the connection across warm invocations to avoid
 * reconnecting on every request.
 */
let cached = global.__mongooseCache;

if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log('✅ MongoDB connected (serverless)');
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
