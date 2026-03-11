import mongoose from "mongoose";

let dbUrl = process.env.MONGO_URI_PROD || process.env.MONGO_URI_DEV;

// Cache connection across serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 0,      // ✅ 0 for serverless - don't force open connections
  bufferCommands: false, // ✅ fail fast if not connected
};

const connectDB = async () => {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Reuse in-flight connection promise
  if (!cached.promise) {
    cached.promise = mongoose.connect(dbUrl, mongooseOptions)
      .then((mongoose) => {
        console.log("✓ MongoDB connected successfully");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset so next request retries
    throw error;
  }

  return cached.conn;
};

export default connectDB;