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
  problemId: string;
  problemTitle: string;
  language: string;
  code: string;
  pseudoCode: string;
  explanation: string;
  evaluation: EvaluationResult;
  integrity: IntegrityData;
  timestamp: string;
}

export interface EvaluationResult {
  logic_score: number;
  code_score: number;
  communication_score: number;
  performance: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
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
