import { EvaluationOutput } from "./ai.service.ts";
import { IntegrityData } from "../../types/index.ts";

export class ScoringService {
  private readonly ALPHA = 0.7;
  private readonly BETA = 0.6;

  computePerformanceScore(evaluation: EvaluationOutput): number {
    const { logic_score, code_score, communication_score } = evaluation.final;
    // performance = 0.5 * logic + 0.3 * code + 0.2 * communication
    // Scores are 0-10, performance will be 0-10
    return 0.5 * logic_score + 0.3 * code_score + 0.2 * communication_score;
  }

  computeIntegrityScore(integrity: IntegrityData): number {
    // base score 100
    let score = 100;
    score -= integrity.pasteCount * 5;
    score -= integrity.tabSwitchCount * 10;
    score -= Math.floor(integrity.idleTime / 60) * 2; // -2 per minute idle
    score -= integrity.aiCalls * 15;
    return Math.max(0, score);
  }

  computeConfidenceScore(codeLength: number, explanationLength: number, isTimeout: boolean): number {
    let score = 100;
    if (isTimeout) score -= 30;
    if (codeLength < 50) score -= 20;
    if (explanationLength < 50) score -= 20;
    return Math.max(0, score);
  }

  computeTrustWeight(integrityScore: number, confidenceScore: number): number {
    // trust = beta * integrity + (1 - beta) * confidence
    return this.BETA * (integrityScore / 100) + (1 - this.BETA) * (confidenceScore / 100);
  }

  updateSkillScore(currentSkillScore: number, performanceScore: number, trustWeight: number): number {
    // S_n = alpha * S_(n-1) + (1 - alpha) * (trustWeight * performance)
    // performanceScore is 0-10, we scale it to 0-100 for skillScore
    const scaledPerformance = performanceScore * 10;
    return this.ALPHA * currentSkillScore + (1 - this.ALPHA) * (trustWeight * scaledPerformance);
  }

  determineSkillLevel(score: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    if (score < 30) return 'Beginner';
    if (score < 60) return 'Intermediate';
    if (score < 85) return 'Advanced';
    return 'Expert';
  }
}

export const scoringService = new ScoringService();
