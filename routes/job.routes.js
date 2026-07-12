import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  closeJob,
} from "../controllers/job.controller.js";
import { authenticate, authorize } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createJob);

router.get("/", getAllJobs);

router.get("/:id", getJobById);

router.put("/:id", authenticate, authorize("admin"), updateJob);

router.patch("/:id/close", authenticate, authorize("admin"), closeJob);

export default router;
