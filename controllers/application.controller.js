import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import EligibilityResult from "../models/eligibility.model.js";
import Profile from "../models/profile.model.js";
import { calculateCompositeScore } from "../utils/compositeScore.js";
import { sendApplicationConfirmationEmail } from "../services/email.service.js";

const ensureCompositeScore = async (studentId) => {
  const profile = await Profile.findOne({ student: studentId });

  if (!profile) {
    return null;
  }

  if (profile.compositeScore === undefined || profile.compositeScore === null || profile.compositeScore === 0) {
    profile.compositeScore = calculateCompositeScore(profile);
    await profile.save();
  }

  return profile;
};

export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const studentId = req.user._id;

  if (!jobId) {
    return res.status(400).json({
      message: "Job ID is required",
    });
  }

  try {
    const job = await Job.findById(jobId).populate("company");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const existingApplication = await Application.findOne({
      student: studentId,
      job: jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    await ensureCompositeScore(studentId);

    const application = await Application.create({
      student: studentId,
      job: jobId,
      company: job.company._id,
    });

    await application.populate("job", "jobRole stipend");
    await application.populate("company", "name");

    await sendApplicationConfirmationEmail(
      req.user.email,
      req.user.name,
      application.job,
      application.company
    );

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getStudentApplications = async (req, res) => {
  const studentId = req.user._id;

  try {
    const applications = await Application.find({ student: studentId })
      .populate("job", "jobRole stipend postPpoCTC status")
      .populate("company", "name email")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getJobApplications = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate("student", "name email")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getCompanyApplications = async (req, res) => {
  const { companyId } = req.params;

  try {
    const applications = await Application.find({ company: companyId })
      .populate("student", "name email")
      .populate("job", "jobRole stipend")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status, rejectionReason } = req.body;

  const validStatuses = ["applied", "shortlisted", "rejected", "selected"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
    });
  }

  try {
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    application.status = status;
    if (status === "rejected" && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }

    await application.save();
    await application.populate("student", "name email");
    await application.populate("job", "jobRole stipend postPpoCTC");
    await application.populate("company", "name email");

    if (status === "shortlisted") {
      const { sendShortlistEmail } = await import("../services/email.service.js");
      await sendShortlistEmail(
        application.student.email,
        application.student.name,
        application.job,
        application.company
      );
    }

    if (status === "rejected") {
      const { sendRejectionEmail } = await import("../services/email.service.js");
      await sendRejectionEmail(
        application.student.email,
        application.student.name,
        application.job,
        application.company,
        rejectionReason ? [rejectionReason] : ["Not selected based on current criteria"]
      );
    }

    if (status === "selected") {
      const { sendSelectionEmail } = await import("../services/email.service.js");
      await sendSelectionEmail(
        application.student.email,
        application.student.name,
        application.job,
        application.company
      );
    }

    res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
