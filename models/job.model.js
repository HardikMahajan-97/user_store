import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    responsibilities: [
      {
        type: String,
      },
    ],
    requirements: [
      {
        type: String,
      },
    ],
    requiredSkills: [
      {
        type: String,
      },
    ],
    softSkills: [
      {
        type: String,
      },
    ],
    criteria: {
      tenthPercentage: {
        type: Number,
        default: 0,
      },
      twelthPercentage: {
        type: Number,
        default: 0,
      },
      semesterWiseCgpa: [
        {
          semester: Number,
          minCgpa: Number,
        },
      ],
      aggregateCgpa: {
        type: Number,
        default: 0,
      },
      cocubesScore: {
        type: Number,
        default: 0,
      },
      compositeScoreThreshold: {
        type: Number,
        default: 0,
      },
    },
    stipend: {
      type: Number,
      required: true,
    },
    postPpoCTC: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["draft", "active", "closed", "archived"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
