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

// CORS Configuration - Allow specific origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://user-store-app.vercel.app"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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
const dbConnectMiddleware = async (req, res, next) => {
  try {
    await connectDB(); // connectDB already handles caching
    next();
  } catch (error) {
    return res.status(503).json({ error: "Database unavailable" });
  }
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
// ✅ Only start listening locally
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`✓ Server on port ${port}`));
}

// For Vercel serverless deployment
export default app;