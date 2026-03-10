import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db.js";

// Import routes
import userRoutes from "./routes/user.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import documentRoutes from "./routes/document.routes.js";

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration - Allow specific origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://user-store-app.vercel.app/"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Health Check Endpoint (No DB required)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Placement Management API is running",
    version: "1.0.0",
    health: "ok",
  });
});

// Database connection flag
let dbConnected = false;

// DB Status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    serverStatus: "running",
    databaseStatus: dbConnected ? "connected" : "connecting",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (protected by DB connection check middleware)
const dbConnectMiddleware = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      error: "Database not connected. Please try again later.",
      status: "service_unavailable",
    });
  }
  next();
};

app.use("/api/auth", dbConnectMiddleware, userRoutes);
app.use("/api/profile", dbConnectMiddleware, profileRoutes);
app.use("/api/documents", dbConnectMiddleware, documentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  
  // Don't expose internal error details
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "An error occurred" 
    : err.message;

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV !== "production" && { details: err.message }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Endpoint not found",
    path: req.path,
  });
});

// Start server with timeout handling
const startServer = async () => {
  try {
    console.log("Starting server...");
    
    // Set connection timeout
    const connectionPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database connection timeout")),
        15000 // 15 second timeout
      )
    );

    await Promise.race([connectionPromise, timeoutPromise]);
    dbConnected = true;
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    // Don't exit - allow server to start with degraded functionality
    console.warn("⚠ Server starting without database connection");
    dbConnected = false;
  }

  // For local development
  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`✓ Server listening on port ${port}`);
    });
  }
};

// Start server
startServer();

// For Vercel serverless deployment
export default app;