import mongoose from "mongoose";

const eligibilityResultSchema = new mongoose.Schema(
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
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    criteriaMatched: {
      tenthPercentage: Boolean,
      twelthPercentage: Boolean,
      semesterWiseCgpa: Boolean,
      aggregateCgpa: Boolean,
      cocubesScore: Boolean,
      compositeScore: Boolean,
    },
    scores: {
      tenthPercentage: Number,
      twelthPercentage: Number,
      aggregateCgpa: Number,
      cocubesScore: Number,
      compositeScore: Number,
    },
    isEligible: {
      type: Boolean,
      default: false,
    },
    failureReasons: [
      {
        type: String,
      },
    ],
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const EligibilityResult = mongoose.model(
  "EligibilityResult",
  eligibilityResultSchema
);
export default EligibilityResult;
