import { Request, Response } from "express";
import { aiService } from "../services/ai.service.ts";
import { scoringService } from "../services/scoring.service.ts";
import { createClient } from "@supabase/supabase-js";
import { IntegrityData } from "../../types/index.ts";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// import { problems } from "../config/problems.ts";

export const submitAssessment = async (req: Request, res: Response) => {
  console.log("Received assessment submission:", JSON.stringify(req.body, null, 2));
  const { 
    problem, 
    pseudoCode, 
    code, 
    explanation, 
    integrity, 
    problemId, 
    language, 
    timeTaken,
    timeLimit,
    timedOut 
  } = req.body;
  
  const userId = (req as any).user.uid;
  console.log("User ID from token:", userId);

  if (!problemId) {
    return res.status(400).json({ error: "problemId is required" });
  }

  // 1. AI Evaluation
  console.log("Calling AI service for evaluation...");
  const evaluation = await aiService.evaluateSubmission(
    JSON.stringify(problem),
    pseudoCode,
    code,
    explanation
  );
  console.log("AI Evaluation result:", JSON.stringify(evaluation, null, 2));

  // 2. Scoring
  const performance = scoringService.computePerformanceScore(evaluation);
  const integrityScore = scoringService.computeIntegrityScore(integrity as IntegrityData);
  const confidenceScore = scoringService.computeConfidenceScore(code.length, explanation.length, timedOut);
  const trustWeight = scoringService.computeTrustWeight(integrityScore, confidenceScore);
  
  console.log("Calculated scores:", { performance, integrityScore, confidenceScore, trustWeight });

  // 3. Update User Skill
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("uid", userId)
    .single();

  let currentSkillScore = 0;
  let topicMastery = {};

  if (userData) {
    currentSkillScore = userData.skill_score || 0;
    topicMastery = userData.topic_mastery || {};
  }

  const newSkillScore = scoringService.updateSkillScore(currentSkillScore, performance, trustWeight);
  const newSkillLevel = scoringService.determineSkillLevel(newSkillScore);

  const topic = problem.topic || "General";
  const currentTopicScore = (topicMastery as any)[topic] || 0;
  const newTopicScore = scoringService.updateSkillScore(currentTopicScore, performance, trustWeight);
  (topicMastery as any)[topic] = newTopicScore;

  console.log("Updating user profile:", { newSkillScore, newSkillLevel });
  await supabase
    .from("users")
    .update({
      skill_score: newSkillScore,
      skill_level: newSkillLevel,
      topic_mastery: topicMastery,
      trust_weight: trustWeight,
      integrity_score: integrityScore,
      confidence_score: confidenceScore,
      updated_at: new Date().toISOString()
    })
    .eq("uid", userId);

  // 4. Save Assessment
  const assessmentData = {
    user_id: userId,
    problem_id: problemId,
    problem_title: problem.title,
    problem: problem.description,
    topic: problem.topic,
    difficulty: problem.difficulty,
    code,
    explanation,
    performance_score: performance * 10, // Scale to 0-100
    trust_weight: trustWeight,
    evaluation: {
      ...evaluation,
      performance,
      integrityScore,
      confidenceScore,
      timeTaken,
      timeLimit,
      timedOut,
      pseudoCode,
      language,
      integrity,
      previousSkillScore: currentSkillScore,
      updatedSkillScore: newSkillScore,
      updatedSkillLevel: newSkillLevel
    },
    created_at: new Date().toISOString()
  };

  console.log("Inserting assessment into database...");
  const { data: assessmentRef, error: assessmentError } = await supabase
    .from("assessments")
    .insert([assessmentData])
    .select()
    .single();

  if (assessmentError) {
    console.error("Error inserting assessment:", assessmentError);
    throw assessmentError;
  }

  console.log("Assessment saved successfully:", assessmentRef.id);
  res.json({
    id: assessmentRef?.id,
    performance,
    newSkillScore,
    newSkillLevel,
    evaluation
  });
};

export const getNextProblem = async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;

  // 1. Get user skill score
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("skill_score")
    .eq("uid", userId)
    .single();

  const skillScore = userData?.skill_score || 0;
  const difficulty = scoringService.determineSkillLevel(skillScore);
  
  // Map skill level to problem difficulty
  let targetDifficulty = "Easy";
  if (difficulty === "Intermediate") targetDifficulty = "Medium";
  if (difficulty === "Advanced" || difficulty === "Expert") targetDifficulty = "Hard";

  // 2. Get attempted problem IDs
  const { data: attempted, error: attemptedError } = await supabase
    .from("assessments")
    .select("problem_id")
    .eq("user_id", userId);

  const attemptedIds = (attempted || []).map(a => a.problem_id).filter(Boolean);

  // 3. Fetch a problem not attempted and matching difficulty
  let query = supabase
    .from("problems")
    .select("*")
    .eq("difficulty", targetDifficulty);

  if (attemptedIds.length > 0) {
    query = query.not("id", "in", `(${attemptedIds.join(",")})`);
  }

  const { data: problemsData, error: problemsError } = await query.limit(10);

  if (problemsError) throw problemsError;

  if (!problemsData || problemsData.length === 0) {
    // Fallback: if no problems left in target difficulty, try any difficulty not attempted
    let fallbackQuery = supabase.from("problems").select("*");
    if (attemptedIds.length > 0) {
      fallbackQuery = fallbackQuery.not("id", "in", `(${attemptedIds.join(",")})`);
    }
    const { data: fallbackData } = await fallbackQuery.limit(1);
    
    if (!fallbackData || fallbackData.length === 0) {
      // If all problems attempted, return a random one
      const { data: allProblems } = await supabase.from("problems").select("*").limit(1);
      return res.json(allProblems?.[0] || null);
    }
    return res.json(fallbackData[0]);
  }

  // Return a random one from the filtered list
  const randomProblem = problemsData[Math.floor(Math.random() * problemsData.length)];
  res.json(randomProblem);
};

export const getProblems = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("problems").select("*");
  if (error) throw error;
  res.json(data);
};
