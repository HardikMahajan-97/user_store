import EligibilityResult from "../models/eligibility.model.js";
import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import Profile from "../models/profile.model.js";
import { calculateCompositeScore } from "../utils/compositeScore.js";
import {
  sendRejectionEmail,
  sendShortlistingCompleteEmail,
} from "../services/email.service.js";

const ensureCompositeScore = async (profile) => {
  if (!profile) {
    return null;
  }

  if (profile.compositeScore === undefined || profile.compositeScore === null || profile.compositeScore === 0) {
    profile.compositeScore = calculateCompositeScore(profile);
    await profile.save();
  }

  return profile;
};

export const checkEligibility = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await Application.findById(applicationId)
      .populate("student")
      .populate("job")
      .populate("company");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const student = application.student;
    const job = application.job;

    const studentProfile = await ensureCompositeScore(
      await Profile.findOne({ student: student._id })
    );

    if (!studentProfile) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const criteria = job.criteria;
    const failureReasons = [];
    const criteriaMatched = {};

    // Check 10th percentage
    const tenthPercentage = parseFloat(studentProfile.tenthPercentage || 0);
    criteriaMatched.tenthPercentage =
      tenthPercentage >= criteria.tenthPercentage;
    if (!criteriaMatched.tenthPercentage && criteria.tenthPercentage > 0) {
      failureReasons.push(
        `10th percentage ${tenthPercentage}% is below the required ${criteria.tenthPercentage}%`
      );
    }

    // Check 12th percentage
    const twelthPercentage = parseFloat(studentProfile.twelthPercentage || 0);
    criteriaMatched.twelthPercentage =
      twelthPercentage >= criteria.twelthPercentage;
    if (!criteriaMatched.twelthPercentage && criteria.twelthPercentage > 0) {
      failureReasons.push(
        `12th percentage ${twelthPercentage}% is below the required ${criteria.twelthPercentage}%`
      );
    }

    // Check aggregate CGPA
    const aggregateCgpa = parseFloat(studentProfile.cgpa || 0);
    criteriaMatched.aggregateCgpa = aggregateCgpa >= criteria.aggregateCgpa;
    if (!criteriaMatched.aggregateCgpa && criteria.aggregateCgpa > 0) {
      failureReasons.push(
        `Aggregate CGPA ${aggregateCgpa} is below the required ${criteria.aggregateCgpa}`
      );
    }

    // Check semester-wise CGPA (if specified)
    criteriaMatched.semesterWiseCgpa = true;
    if (criteria.semesterWiseCgpa && criteria.semesterWiseCgpa.length > 0) {
      for (const sem of criteria.semesterWiseCgpa) {
        const semCgpa = parseFloat(
          studentProfile[`semester${sem.semester}Cgpa`] || 0
        );
        if (semCgpa < sem.minCgpa) {
          criteriaMatched.semesterWiseCgpa = false;
          failureReasons.push(
            `Semester ${sem.semester} CGPA ${semCgpa} is below the required ${sem.minCgpa}`
          );
        }
      }
    }

    // Check Cocubes score (default composite score for now)
    const compositeScore = parseFloat(studentProfile.compositeScore || 0);
    criteriaMatched.compositeScore =
      compositeScore >= criteria.compositeScoreThreshold;
    if (
      !criteriaMatched.compositeScore &&
      criteria.compositeScoreThreshold > 0
    ) {
      failureReasons.push(
        `Composite score ${compositeScore} is below the required ${criteria.compositeScoreThreshold}`
      );
    }

    criteriaMatched.cocubesScore = true;

    const isEligible =
      Object.values(criteriaMatched).every((val) => val === true) &&
      failureReasons.length === 0;

    const eligibilityResult = await EligibilityResult.create({
      student: student._id,
      job: job._id,
      company: application.company._id,
      application: applicationId,
      criteriaMatched,
      scores: {
        tenthPercentage,
        twelthPercentage,
        aggregateCgpa,
        cocubesScore: 0,
        compositeScore,
      },
      isEligible,
      failureReasons,
    });

    // Update application eligibility status
    application.eligibilityStatus = isEligible ? "eligible" : "ineligible";
    application.eligibilityReason = failureReasons.join("; ");
    await application.save();

    if (!isEligible) {
      await sendRejectionEmail(
        student.email,
        student.name,
        job,
        application.company,
        failureReasons.length ? failureReasons : ["Not selected based on current criteria"]
      );
    }

    res.status(200).json({
      message: "Eligibility checked successfully",
      eligibilityResult,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const checkAllEligibilities = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId).populate("company");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const applications = await Application.find({ job: jobId, status: "applied" })
      .populate("student")
      .populate("job")
      .populate("company");

    const results = [];

    for (const application of applications) {
      const student = application.student;
      const studentProfile = await ensureCompositeScore(
        await Profile.findOne({ student: student._id })
      );

      if (!studentProfile) {
        continue;
      }

      const criteria = job.criteria;
      const failureReasons = [];
      const criteriaMatched = {};

      // Check 10th percentage
      const tenthPercentage = parseFloat(
        studentProfile.tenthPercentage || 0
      );
      criteriaMatched.tenthPercentage =
        tenthPercentage >= criteria.tenthPercentage;
      if (
        !criteriaMatched.tenthPercentage &&
        criteria.tenthPercentage > 0
      ) {
        failureReasons.push(
          `10th percentage ${tenthPercentage}% is below the required ${criteria.tenthPercentage}%`
        );
      }

      // Check 12th percentage
      const twelthPercentage = parseFloat(
        studentProfile.twelthPercentage || 0
      );
      criteriaMatched.twelthPercentage =
        twelthPercentage >= criteria.twelthPercentage;
      if (
        !criteriaMatched.twelthPercentage &&
        criteria.twelthPercentage > 0
      ) {
        failureReasons.push(
          `12th percentage ${twelthPercentage}% is below the required ${criteria.twelthPercentage}%`
        );
      }

      // Check aggregate CGPA
      const aggregateCgpa = parseFloat(studentProfile.cgpa || 0);
      criteriaMatched.aggregateCgpa =
        aggregateCgpa >= criteria.aggregateCgpa;
      if (!criteriaMatched.aggregateCgpa && criteria.aggregateCgpa > 0) {
        failureReasons.push(
          `Aggregate CGPA ${aggregateCgpa} is below the required ${criteria.aggregateCgpa}`
        );
      }

      // Check semester-wise CGPA
      criteriaMatched.semesterWiseCgpa = true;
      if (criteria.semesterWiseCgpa && criteria.semesterWiseCgpa.length > 0) {
        for (const sem of criteria.semesterWiseCgpa) {
          const semCgpa = parseFloat(
            studentProfile[`semester${sem.semester}Cgpa`] || 0
          );
          if (semCgpa < sem.minCgpa) {
            criteriaMatched.semesterWiseCgpa = false;
            failureReasons.push(
              `Semester ${sem.semester} CGPA ${semCgpa} is below the required ${sem.minCgpa}`
            );
          }
        }
      }

      // Check Composite score
      const compositeScore = parseFloat(
        studentProfile.compositeScore || 0
      );
      criteriaMatched.compositeScore =
        compositeScore >= criteria.compositeScoreThreshold;
      if (
        !criteriaMatched.compositeScore &&
        criteria.compositeScoreThreshold > 0
      ) {
        failureReasons.push(
          `Composite score ${compositeScore} is below the required ${criteria.compositeScoreThreshold}`
        );
      }

      criteriaMatched.cocubesScore = true;

      const isEligible =
        Object.values(criteriaMatched).every((val) => val === true) &&
        failureReasons.length === 0;

      const eligibilityResult = await EligibilityResult.create({
        student: student._id,
        job: job._id,
        company: application.company._id,
        application: application._id,
        criteriaMatched,
        scores: {
          tenthPercentage,
          twelthPercentage,
          aggregateCgpa,
          cocubesScore: 0,
          compositeScore,
        },
        isEligible,
        failureReasons,
      });

      // Update application eligibility status
      application.eligibilityStatus = isEligible
        ? "eligible"
        : "ineligible";
      application.eligibilityReason = failureReasons.join("; ");
      await application.save();

      if (!isEligible) {
        await sendRejectionEmail(
          student.email,
          student.name,
          job,
          application.company,
          failureReasons.length ? failureReasons : ["Not selected based on current criteria"]
        );
      }

      results.push(eligibilityResult);
    }

    await sendShortlistingCompleteEmail(
      req.user.email,
      req.user.name,
      job,
      job.company,
      results.filter((result) => result.isEligible).length
    );

    res.status(200).json({
      message: "All eligibilities checked successfully",
      totalChecked: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getEligibilityResult = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const eligibilityResult = await EligibilityResult.findOne({
      application: applicationId,
    })
      .populate("student", "name email")
      .populate("job", "jobRole company")
      .populate("company", "name");

    if (!eligibilityResult) {
      return res.status(404).json({
        message: "Eligibility result not found",
      });
    }

    res.status(200).json({
      message: "Eligibility result fetched successfully",
      eligibilityResult,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getJobEligibilityResults = async (req, res) => {
  const { jobId } = req.params;
  const { isEligible } = req.query;

  try {
    const filter = { job: jobId };

    if (isEligible !== undefined) {
      filter.isEligible = isEligible === "true";
    }

    const results = await EligibilityResult.find(filter)
      .populate("student", "name email")
      .populate("job", "jobRole")
      .populate("company", "name")
      .sort({ evaluatedAt: -1 });

    res.status(200).json({
      message: "Eligibility results fetched successfully",
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
