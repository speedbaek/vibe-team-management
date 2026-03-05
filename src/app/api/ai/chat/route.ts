import "@/lib/env";
import { streamText, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, buildContext } from "@/lib/ai";
import {
  dailyLogDraftSchema,
  weeklyReviewDraftSchema,
  goalDraftSchema,
} from "@/lib/ai-tools";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[AI Chat] ANTHROPIC_API_KEY is not set or empty");
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId } = await req.json();

    let chatSession;
    if (sessionId) {
      chatSession = await prisma.aIChatSession.findFirst({
        where: { id: sessionId, userId: session.user.id },
      });
    }

    if (!chatSession) {
      chatSession = await prisma.aIChatSession.create({
        data: {
          userId: session.user.id,
          title: messages[0]?.content?.substring(0, 50) || "새 대화",
        },
      });
    }

    const context = await buildContext(session.user.id);
    const anthropic = createAnthropic({ apiKey });
    const currentSessionId = chatSession.id;

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildSystemPrompt(context),
      messages,
      tools: {
        create_daily_log_draft: tool({
          description:
            "사용자의 일일 업무 기록 초안을 생성합니다. 사용자가 오늘 한 일이나 할 일을 정리해달라고 할 때 사용합니다.",
          parameters: dailyLogDraftSchema,
          execute: async (args) => ({
            type: "daily_log_draft" as const,
            draft: args,
          }),
        }),
        create_weekly_review_draft: tool({
          description:
            "사용자의 주간 회고 초안을 생성합니다. 사용자가 주간 회고 작성을 도와달라고 할 때 사용합니다.",
          parameters: weeklyReviewDraftSchema,
          execute: async (args) => ({
            type: "weekly_review_draft" as const,
            draft: args,
          }),
        }),
        create_goal_draft: tool({
          description:
            "사용자의 OKR 목표 초안을 생성합니다. 사용자가 목표 설정을 도와달라고 할 때 사용합니다.",
          parameters: goalDraftSchema,
          execute: async (args) => ({
            type: "goal_draft" as const,
            draft: args,
          }),
        }),
      },
      maxSteps: 2,
      onFinish: async ({ text }) => {
        // Save assistant response to DB
        if (text) {
          await prisma.aIChatMessage
            .create({
              data: {
                sessionId: currentSessionId,
                role: "assistant",
                content: text,
              },
            })
            .catch(console.error);
        }
        // Update session timestamp
        await prisma.aIChatSession
          .update({
            where: { id: currentSessionId },
            data: { updatedAt: new Date() },
          })
          .catch(console.error);
      },
    });

    // Save user message to DB (fire-and-forget)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "user") {
      prisma.aIChatMessage
        .create({
          data: {
            sessionId: currentSessionId,
            role: "user",
            content: lastMsg.content,
          },
        })
        .catch(console.error);
    }

    return result.toDataStreamResponse({
      headers: { "X-Session-Id": currentSessionId },
    });
  } catch (error: any) {
    console.error("[AI Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "AI 코치 처리 중 오류가 발생했습니다.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
