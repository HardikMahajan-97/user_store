import express from "express";
import {
  checkEligibility,
  checkAllEligibilities,
  getEligibilityResult,
  getJobEligibilityResults,
} from "../controllers/eligibility.controller.js";
import { authenticate, authorize } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/:applicationId", authenticate, authorize("admin"), checkEligibility);

router.post("/job/:jobId/check-all", authenticate, authorize("admin"), checkAllEligibilities);

router.get("/:applicationId", authenticate, getEligibilityResult);

router.get("/job/:jobId/results", authenticate, authorize("admin"), getJobEligibilityResults);

export default router;
