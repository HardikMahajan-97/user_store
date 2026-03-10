import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import userRoutes from "./routes/user.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import documentRoutes from "./routes/document.routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Placement Management API is running");
});

app.use("/api/auth", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/documents", documentRoutes);

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ message: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();





