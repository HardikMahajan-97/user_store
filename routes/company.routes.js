import express from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/company.controller.js";
import { authenticate, authorize } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), createCompany);

router.get("/", getAllCompanies);

router.get("/:id", getCompanyById);

router.put("/:id", authenticate, authorize("admin"), updateCompany);

router.delete("/:id", authenticate, authorize("admin"), deleteCompany);

export default router;
