import { Router } from "express";
import { submitAssessment, getProblems } from "../controllers/assessment.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";

const router = Router();

router.get("/problems", authMiddleware, asyncHandler(getProblems));
router.post("/submit", authMiddleware, asyncHandler(submitAssessment));

export default router;
