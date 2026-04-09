import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const evaluationSchema = z.object({
  analysis: z.object({
    correctness: z.number().min(0).max(10),
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    isOptimal: z.boolean(),
    edgeCases: z.array(z.string()),
  }),
  quality: z.object({
    readability: z.number().min(0).max(10),
    structure: z.number().min(0).max(10),
    naming: z.number().min(0).max(10),
    bestPractices: z.number().min(0).max(10),
  }),
  communication: z.object({
    clarity: z.number().min(0).max(10),
    completeness: z.number().min(0).max(10),
    explanationQuality: z.number().min(0).max(10),
  }),
  final: z.object({
    logic_score: z.number().min(0).max(10),
    code_score: z.number().min(0).max(10),
    communication_score: z.number().min(0).max(10),
    overallGrade: z.string().describe("Letter grade from A+ to F"),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
});

export type EvaluationOutput = z.infer<typeof evaluationSchema>;

export class AIService {
  private model: ChatOpenAI | null = null;
  private parser: StructuredOutputParser<typeof evaluationSchema>;

  constructor() {
    this.parser = StructuredOutputParser.fromZodSchema(evaluationSchema);
  }

  private getModel() {
    if (!this.model) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY. Please set it in your environment variables.");
      }
      this.model = new ChatOpenAI({
        modelName: "gpt-4o",
        openAIApiKey: apiKey,
        temperature: 0.2,
      });
    }
    return this.model;
  }

  async evaluateSubmission(
    problem: string,
    pseudoCode: string,
    code: string,
    explanation: string
  ): Promise<EvaluationOutput> {
    const formatInstructions = this.parser.getFormatInstructions();
    const model = this.getModel();

    const prompt = new PromptTemplate({
      template: `
        You are an expert senior software engineer and technical interviewer.
        Evaluate the following coding assessment submission.
        
        PROBLEM:
        {problem}
        
        PSEUDO-CODE:
        {pseudoCode}
        
        CODE:
        {code}
        
        EXPLANATION:
        {explanation}
        
        {formatInstructions}
      `,
      inputVariables: ["problem", "pseudoCode", "code", "explanation"],
      partialVariables: { formatInstructions },
    });

    const input = await prompt.format({
      problem,
      pseudoCode,
      code,
      explanation,
    });

    const response = await model.invoke(input);
    return await this.parser.parse(response.content as string);
  }
}

export const aiService = new AIService();
