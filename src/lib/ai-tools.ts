import { z } from "zod";

export const dailyLogDraftSchema = z.object({
  date: z
    .string()
    .describe("날짜 (YYYY-MM-DD 형식). 지정하지 않으면 오늘 날짜 사용."),
  plannedTasks: z
    .array(
      z.object({
        id: z.string().describe("고유 ID (uuid 형식)"),
        text: z.string().describe("업무 내용"),
        completed: z.boolean().describe("완료 여부"),
      })
    )
    .describe("계획 및 수행한 업무 목록"),
  completedTasks: z
    .array(
      z.object({
        id: z.string().describe("고유 ID"),
        text: z.string().describe("완료한 업무 내용"),
      })
    )
    .describe("완료한 업무 목록 (plannedTasks 중 completed=true인 것과 동일)"),
  blockers: z
    .string()
    .optional()
    .describe("하루 정리나 고민 (없으면 생략)"),
});

export const weeklyReviewDraftSchema = z.object({
  weekStart: z
    .string()
    .describe("해당 주의 월요일 날짜 (YYYY-MM-DD 형식)"),
  achievements: z.string().describe("이번 주 주요 성과"),
  lessons: z
    .string()
    .optional()
    .describe("이번 주 배운 점 (없으면 생략)"),
  helpNeeded: z
    .string()
    .optional()
    .describe("팀에게 필요한 도움 (없으면 생략)"),
  nextWeekPlan: z.string().describe("다음 주 계획"),
});

export const goalDraftSchema = z.object({
  objective: z.string().describe("목표"),
  quarter: z
    .string()
    .describe("분기 (예: 2026-Q1)"),
  keyResults: z
    .array(
      z.object({
        description: z.string().describe("할 일 항목"),
      })
    )
    .describe("목표 달성을 위한 할 일 목록"),
});
