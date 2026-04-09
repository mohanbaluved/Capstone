export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  skillScore: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  topicMastery: Record<string, number>;
  trustWeight: number;
  integrityScore: number;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id?: string;
  userId: string;
  problem: string;
  topic: string;
  difficulty: string;
  code: string;
  explanation: string;
  evaluation: EvaluationResult;
  performanceScore: number;
  trustWeight: number;
  createdAt: string;
}

export interface EvaluationResult {
  logic_score: number;
  code_score: number;
  communication_score: number;
  overallGrade: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  performance: number;
  integrityScore: number;
  confidenceScore: number;
  timeTaken: number;
  timeLimit: number;
  timedOut: boolean;
  pseudoCode: string;
  language: string;
  integrity: IntegrityData;
  previousSkillScore: number;
  updatedSkillScore: number;
  updatedSkillLevel: string;
  analysis: {
    correctness: number;
    timeComplexity: string;
    spaceComplexity: string;
    isOptimal: boolean;
    edgeCases: string[];
  };
  quality: {
    readability: number;
    structure: number;
    naming: number;
    bestPractices: number;
  };
}

export interface IntegrityData {
  pasteCount: number;
  tabSwitchCount: number;
  idleTime: number;
  aiCalls: number;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  content: string;
}
