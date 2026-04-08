import { Request, Response } from "express";
import { aiService } from "../services/ai.service.ts";
import { scoringService } from "../services/scoring.service.ts";
import admin from "firebase-admin";
import { IntegrityData } from "../../types/index.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = admin.firestore();

export const submitAssessment = async (req: Request, res: Response) => {
  const { problem, pseudoCode, code, explanation, integrity, problemId, problemTitle, language, isTimeout } = req.body;
  const userId = (req as any).user.uid;

  // 1. AI Evaluation
  const evaluation = await aiService.evaluateSubmission(
    JSON.stringify(problem),
    pseudoCode,
    code,
    explanation
  );

  // 2. Scoring
  const performance = scoringService.computePerformanceScore(evaluation);
  const integrityScore = scoringService.computeIntegrityScore(integrity as IntegrityData);
  const confidenceScore = scoringService.computeConfidenceScore(code.length, explanation.length, isTimeout);
  const trustWeight = scoringService.computeTrustWeight(integrityScore, confidenceScore);

  // 3. Update User Skill
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  let currentSkillScore = 0;
  let topicMastery = {};

  if (userDoc.exists) {
    const userData = userDoc.data();
    currentSkillScore = userData?.skillScore || 0;
    topicMastery = userData?.topicMastery || {};
  }

  const newSkillScore = scoringService.updateSkillScore(currentSkillScore, performance, trustWeight);
  const newSkillLevel = scoringService.determineSkillLevel(newSkillScore);

  // Update topic mastery (simplified)
  const topic = problem.topic || "General";
  const currentTopicScore = (topicMastery as any)[topic] || 0;
  const newTopicScore = scoringService.updateSkillScore(currentTopicScore, performance, trustWeight);
  (topicMastery as any)[topic] = newTopicScore;

  await userRef.set({
    skillScore: newSkillScore,
    skillLevel: newSkillLevel,
    topicMastery,
    trustWeight,
    integrityScore,
    confidenceScore,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 4. Save Assessment
  const assessmentData = {
    userId,
    problemId,
    problemTitle,
    language,
    code,
    pseudoCode,
    explanation,
    evaluation: {
      ...evaluation,
      performance
    },
    integrity,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  const assessmentRef = await db.collection("assessments").add(assessmentData);

  res.json({
    id: assessmentRef.id,
    performance,
    newSkillScore,
    newSkillLevel,
    evaluation
  });
};

export const getProblems = async (req: Request, res: Response) => {
  const problemsPath = path.join(__dirname, "../config/problems.json");
  const problemsData = fs.readFileSync(problemsPath, "utf-8");
  const problems = JSON.parse(problemsData);
  res.json(problems);
};
