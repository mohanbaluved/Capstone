import { Request, Response } from "express";
import { aiService } from "../services/ai.service.ts";
import { scoringService } from "../services/scoring.service.ts";
import { createClient } from "@supabase/supabase-js";
import { IntegrityData } from "../../types/index.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("uid", userId)
    .single();

  let currentSkillScore = 0;
  let topicMastery = {};

  if (userData) {
    currentSkillScore = userData.skillScore || 0;
    topicMastery = userData.topicMastery || {};
  }

  const newSkillScore = scoringService.updateSkillScore(currentSkillScore, performance, trustWeight);
  const newSkillLevel = scoringService.determineSkillLevel(newSkillScore);

  // Update topic mastery (simplified)
  const topic = problem.topic || "General";
  const currentTopicScore = (topicMastery as any)[topic] || 0;
  const newTopicScore = scoringService.updateSkillScore(currentTopicScore, performance, trustWeight);
  (topicMastery as any)[topic] = newTopicScore;

  await supabase
    .from("users")
    .update({
      skillScore: newSkillScore,
      skillLevel: newSkillLevel,
      topicMastery,
      trustWeight,
      integrityScore,
      confidenceScore,
      updatedAt: new Date().toISOString()
    })
    .eq("uid", userId);

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
    timestamp: new Date().toISOString()
  };

  const { data: assessmentRef, error: assessmentError } = await supabase
    .from("assessments")
    .insert([assessmentData])
    .select()
    .single();

  res.json({
    id: assessmentRef?.id,
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
