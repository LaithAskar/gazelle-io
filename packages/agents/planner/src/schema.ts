import { z } from "zod";

// The structured lesson-plan body the Planner produces and we store in
// lesson_plans.content. Mirrors the spec's hook -> instruction -> practice ->
// assessment structure.
export const lessonContentSchema = z.object({
  hook: z.string(),
  instruction: z.string(),
  practice: z.string(),
  assessment: z.string(),
});

export const generatedLessonPlanSchema = z.object({
  title: z.string(),
  objectives: z.string(),
  durationMinutes: z.number().int().positive(),
  standardCodes: z.array(z.string()),
  content: lessonContentSchema,
});
export type GeneratedLessonPlan = z.infer<typeof generatedLessonPlanSchema>;

export const generatedQuestionSchema = z.object({
  prompt: z.string(),
  questionType: z.enum(["multiple_choice", "short_answer"]),
  choices: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const generatedQuestionBankSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
