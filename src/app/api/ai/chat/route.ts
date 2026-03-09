import "@/lib/env";
import { streamText, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, buildContext } from "@/lib/ai";
import {
  dailyLogDraftSchema,
  weeklyReviewDraftSchema,
  goalDraftSchema,
} from "@/lib/ai-tools";

// 웹 검색 도구 (Tavily API - 무료 1000회/월)
const webSearchTool = process.env.TAVILY_API_KEY
  ? tool({
      description:
        "웹에서 최신 정보를 검색합니다. 사용자가 외부 정보, 최신 뉴스, 기술 문서, 트렌드 등을 물어볼 때 사용합니다.",
      parameters: z.object({
        query: z.string().describe("검색할 내용 (한국어 또는 영어)"),
      }),
      execute: async ({ query }) => {
        try {
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query,
              search_depth: "basic",
              max_results: 5,
              include_answer: true,
            }),
          });
          if (!res.ok) throw new Error(`Search failed: ${res.status}`);
          const data = await res.json();
          return {
            answer: data.answer || "",
            results: (data.results || []).map((r: any) => ({
              title: r.title,
              url: r.url,
              content: r.content?.substring(0, 300) || "",
            })),
          };
        } catch (error: any) {
          return { error: `검색 실패: ${error.message}`, results: [] };
        }
      },
    })
  : null;

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

    const currentSessionId = chatSession.id;
    const context = await buildContext(session.user.id, currentSessionId);
    const anthropic = createAnthropic({ apiKey });

    // 도구 구성 (웹 검색은 API 키가 있을 때만 포함)
    const tools: Record<string, any> = {
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
    };

    // 웹 검색 도구 추가 (Tavily API 키가 있을 때만)
    if (webSearchTool) {
      tools.web_search = webSearchTool;
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildSystemPrompt(context),
      messages,
      tools,
      maxSteps: 5,
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

    // Save user message to DB (fire-and-forget, text only - images not stored)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "user") {
      const textContent =
        typeof lastMsg.content === "string"
          ? lastMsg.content
          : Array.isArray(lastMsg.content)
            ? lastMsg.content
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("\n") || "[이미지 첨부]"
            : "[이미지 첨부]";

      prisma.aIChatMessage
        .create({
          data: {
            sessionId: currentSessionId,
            role: "user",
            content: textContent,
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
