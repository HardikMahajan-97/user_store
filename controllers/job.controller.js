import Job from "../models/job.model.js";
import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import { sendJobNotificationEmail } from "../services/email.service.js";

export const createJob = async (req, res) => {
  const {
    company,
    jobRole,
    jobDescription,
    responsibilities,
    requirements,
    requiredSkills,
    softSkills,
    criteria,
    stipend,
    postPpoCTC,
  } = req.body;

  if (!company?.trim() || !jobRole?.trim() || !jobDescription?.trim()) {
    return res.status(400).json({
      message: "Company, job role, and job description are required",
    });
  }

  try {
    const companyExists = await Company.findById(company);

    if (!companyExists) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const job = await Job.create({
      company,
      jobRole,
      jobDescription,
      responsibilities,
      requirements,
      requiredSkills,
      softSkills,
      criteria,
      stipend,
      postPpoCTC,
      createdBy: req.user._id,
    });

    await job.populate("company", "name email");

    const students = await User.find({ role: "student" }).select("name email");
    await Promise.allSettled(
      students.map((student) =>
        sendJobNotificationEmail(student.email, student.name, job, job.company)
      )
    );

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const { companyId, status } = req.query;
    const filter = { status: { $ne: "archived" } };

    if (companyId) {
      filter.company = companyId;
    }

    if (status) {
      filter.status = status;
    }

    const jobs = await Job.find(filter)
      .populate("company", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Jobs fetched successfully",
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await Job.findById(id)
      .populate("company")
      .populate("createdBy", "name email");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({
      message: "Job fetched successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  const { id } = req.params;
  const {
    jobRole,
    jobDescription,
    responsibilities,
    requirements,
    requiredSkills,
    softSkills,
    criteria,
    stipend,
    postPpoCTC,
    status,
  } = req.body;

  try {
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (jobRole) job.jobRole = jobRole;
    if (jobDescription) job.jobDescription = jobDescription;
    if (responsibilities) job.responsibilities = responsibilities;
    if (requirements) job.requirements = requirements;
    if (requiredSkills) job.requiredSkills = requiredSkills;
    if (softSkills) job.softSkills = softSkills;
    if (criteria) job.criteria = { ...job.criteria, ...criteria };
    if (stipend) job.stipend = stipend;
    if (postPpoCTC) job.postPpoCTC = postPpoCTC;
    if (status) job.status = status;

    await job.save();
    await job.populate("company", "name email");

    res.status(200).json({
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const closeJob = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await Job.findByIdAndUpdate(
      id,
      { status: "closed" },
      { new: true }
    ).populate("company", "name email");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({
      message: "Job closed successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
