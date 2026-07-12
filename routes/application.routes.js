import express from "express";
import {
  applyForJob,
  getStudentApplications,
  getJobApplications,
  getCompanyApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";
import { authenticate, authorize } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/apply", authenticate, authorize("student"), applyForJob);

router.get("/student/my-applications", authenticate, authorize("student"), getStudentApplications);

router.get("/job/:jobId", authenticate, authorize("admin"), getJobApplications);

router.get("/company/:companyId", authenticate, authorize("admin"), getCompanyApplications);

router.patch("/:applicationId/status", authenticate, authorize("admin"), updateApplicationStatus);

export default router;
