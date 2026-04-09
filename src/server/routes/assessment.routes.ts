import { Router } from "express";
import { submitAssessment, getProblems, getNextProblem } from "../controllers/assessment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/problems", authMiddleware, asyncHandler(getProblems));
router.get("/problems/next", authMiddleware, asyncHandler(getNextProblem));
router.post("/submit", authMiddleware, asyncHandler(submitAssessment));

export default router;
