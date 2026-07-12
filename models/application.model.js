import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "selected"],
      default: "applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    eligibilityStatus: {
      type: String,
      enum: ["pending", "eligible", "ineligible"],
      default: "pending",
    },
    eligibilityReason: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);
export default Application;
