import mongoose from "mongoose";

const dbUrl = process.env.MONGO_URI_PROD;
if (!dbUrl) {
  console.warn("MONGO_URI_PROD is not defined in environment variables");
  dbUrl = process.env.MONGO_URI_DEV;

  if (!dbUrl) {
    console.error("MONGO_URI_DEV is also not defined. Please set one of these environment variables.");
    process.exit(1);
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});

export default connectDB;