import { Request, Response } from "express";
import { aiService } from "../services/ai.service";
import { scoringService } from "../services/scoring.service";
import { createClient } from "@supabase/supabase-js";
import { IntegrityData } from "../../types/index";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [];
    if (!supabaseUrl) missing.push("VITE_SUPABASE_URL/SUPABASE_URL");
    if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY/SERVICE_ROLE_KEY");
    throw new Error(`Missing Supabase configuration: ${missing.join(", ")}. Please check your environment variables.`);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// import { problems } from "../config/problems.ts";

export const submitAssessment = async (req: Request, res: Response) => {
  console.log("[submitAssessment] Received submission");

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err: any) {
    console.error("[submitAssessment] Config error:", err.message);
    return res.status(500).json({ 
      error: "Server configuration error", 
      details: err.message 
    });
  }

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
    if (assessmentError.message.includes('column "problem_id" does not exist')) {
      return res.status(500).json({ 
        error: "Database schema mismatch", 
        details: "The 'problem_id' column is missing from the 'assessments' table. Please run the provided SQL script in Supabase." 
      });
    }
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
  console.log(`[getNextProblem] Fetching next problem for user: ${userId}`);

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err: any) {
    return res.status(500).json({ 
      error: "Server configuration error", 
      details: err.message 
    });
  }

  try {
    // 1. Get user skill score
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("skill_score")
      .eq("uid", userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error("[getNextProblem] Error fetching user data:", userError);
    }

    const skillScore = userData?.skill_score || 0;
    const difficulty = scoringService.determineSkillLevel(skillScore);
    console.log(`[getNextProblem] User skill score: ${skillScore}, Level: ${difficulty}`);
    
    // Map skill level to problem difficulty
    let targetDifficulty = "Easy";
    if (difficulty === "Intermediate") targetDifficulty = "Medium";
    if (difficulty === "Advanced" || difficulty === "Expert") targetDifficulty = "Hard";

    // 2. Get attempted problem IDs
    const { data: attempted, error: attemptedError } = await supabase
      .from("assessments")
      .select("problem_id")
      .eq("user_id", userId);

    if (attemptedError) {
      console.error("[getNextProblem] Error fetching attempted problems:", attemptedError);
      // If this fails, it might be because problem_id column is missing
      if (attemptedError.message.includes('column "problem_id" does not exist')) {
        return res.status(500).json({ 
          error: "Database schema mismatch", 
          details: "The 'problem_id' column is missing from the 'assessments' table. Please run the provided SQL script in Supabase." 
        });
      }
    }

    const attemptedIds = (attempted || []).map(a => a.problem_id).filter(Boolean);
    console.log(`[getNextProblem] Attempted problem IDs: ${attemptedIds.length}`);

    // 3. Fetch a problem not attempted and matching difficulty
    let query = supabase
      .from("problems")
      .select("*")
      .eq("difficulty", targetDifficulty);

    if (attemptedIds.length > 0) {
      query = query.not("id", "in", attemptedIds);
    }

    const { data: problemsData, error: problemsError } = await query.limit(10);

    if (problemsError) {
      console.error("[getNextProblem] Error fetching problems:", problemsError);
      if (problemsError.message.includes('relation "problems" does not exist')) {
        return res.status(500).json({ 
          error: "Database table missing", 
          details: "The 'problems' table does not exist. Please run the provided SQL script in Supabase." 
        });
      }
      throw problemsError;
    }

    if (!problemsData || problemsData.length === 0) {
      console.log("[getNextProblem] No problems found for target difficulty, trying fallback...");
      // Fallback: if no problems left in target difficulty, try any difficulty not attempted
      let fallbackQuery = supabase.from("problems").select("*");
      if (attemptedIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", attemptedIds);
      }
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.limit(1);
      
      if (fallbackError) {
        console.error("[getNextProblem] Fallback error:", fallbackError);
      }

      if (!fallbackData || fallbackData.length === 0) {
        console.log("[getNextProblem] All problems attempted or none exist. Returning a random one.");
        // If all problems attempted, return a random one
        const { data: allProblems } = await supabase.from("problems").select("*").limit(1);
        return res.json(allProblems?.[0] || null);
      }
      return res.json(fallbackData[0]);
    }

    // Return a random one from the filtered list
    const randomProblem = problemsData[Math.floor(Math.random() * problemsData.length)];
    console.log(`[getNextProblem] Returning problem: ${randomProblem.title} (${randomProblem.id})`);
    res.json(randomProblem);
  } catch (error: any) {
    console.error("[getNextProblem] Unexpected error:", error);
    const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
    res.status(500).json({ 
      error: "Internal server error", 
      details: errorMessage,
      raw: error 
    });
  }
};

export const getProblems = async (req: Request, res: Response) => {
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err: any) {
    return res.status(500).json({ 
      error: "Server configuration error", 
      details: err.message 
    });
  }
  const { data, error } = await supabase.from("problems").select("*");
  if (error) throw error;
  res.json(data);
};
