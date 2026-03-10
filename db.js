import mongoose from "mongoose";

let dbUrl = process.env.MONGO_URI_PROD || process.env.MONGO_URI_DEV;

// Validate environment variable exists
if (!dbUrl) {
  const errorMessage =
    "❌ CRITICAL: No MongoDB URI found. Set MONGO_URI_PROD or MONGO_URI_DEV environment variable.";
  console.error(errorMessage);
  
  // In production, don't exit immediately - allow graceful degradation
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠ Running in degraded mode without database");
  } else {
    process.exit(1);
  }
}

// Configure mongoose options
const mongooseOptions = {
  // Connection timeout: 10 seconds
  serverSelectionTimeoutMS: 10000,
  
  // Socket timeout: 30 seconds
  socketTimeoutMS: 30000,
  
  // Connection pool size
  maxPoolSize: 10,
  minPoolSize: 2,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Connection string handling
  connectTimeoutMS: 10000,
};

const connectDB = async () => {
  // Skip if already connected
  if (mongoose.connection.readyState === 1) {
    console.log("✓ MongoDB already connected");
    return;
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    
    await mongoose.connect(dbUrl, mongooseOptions);
    
    console.log("✓ MongoDB connected successfully");
    console.log(`  Connection state: ${mongoose.connection.readyState}`);
    
    return true;
  } catch (error) {
    console.error("✗ MongoDB connection error:");
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code}`);
    
    // Provide helpful debugging info
    if (error.message.includes("ENOTFOUND")) {
      console.error("  → Check your MongoDB URI hostname");
    } else if (error.message.includes("timeout")) {
      console.error("  → MongoDB connection timeout - check IP whitelist in Atlas");
    } else if (error.message.includes("authentication failed")) {
      console.error("  → Invalid MongoDB credentials");
    }
    
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("✓ Mongoose connected to MongoDB");
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠ Mongoose disconnected from MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("✗ MongoDB connection error event:", err.message);
});

mongoose.connection.on("reconnected", () => {
  console.log("✓ Mongoose reconnected to MongoDB");
});

export default connectDB;