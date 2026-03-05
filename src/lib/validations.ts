import { z } from "zod";

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedTasks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
    })
  ),
  completedTasks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    })
  ),
  blockers: z.string().optional(),
  mood: z.number().min(1).max(5).optional(),
});

export const weeklyReviewSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  achievements: z.string().min(1),
  lessons: z.string().optional(),
  helpNeeded: z.string().optional(),
  nextWeekPlan: z.string().min(1),
});

export const goalSchema = z.object({
  objective: z.string().min(1),
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
});

export const keyResultSchema = z.object({
  description: z.string().min(1),
  targetValue: z.number().positive(),
  unit: z.string().optional(),
});
