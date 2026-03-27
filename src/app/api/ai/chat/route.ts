import "@/lib/env";
import { streamText, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildContext, getStaticSystemPrompt, getDynamicSystemPrompt } from "@/lib/ai";
import {
  dailyLogDraftSchema,
  weeklyReviewDraftSchema,
  goalDraftSchema,
} from "@/lib/ai-tools";

// Vercel 서버리스 함수 타임아웃 연장 (웹 검색 시 내부 API 호출에 시간 필요)
export const maxDuration = 60;

// Anthropic API 직접 호출 웹 검색 (Rate Limit 자동 재시도 포함)
async function callWebSearchAPI(
  apiKey: string,
  query: string,
  retryCount = 0
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 1,
          },
        ],
        messages: [
          {
            role: "user",
            content: `다음 질문에 대해 웹 검색을 하고 결과를 한국어로 간결하게 정리해주세요. 출처 URL도 포함해주세요.\n\n질문: ${query}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Rate Limit (429) → 3초 대기 후 1회 재시도
    if (res.status === 429 && retryCount < 1) {
      console.log("[Web Search] Rate limited, retrying in 2s...");
      await new Promise((r) => setTimeout(r, 2000));
      return callWebSearchAPI(apiKey, query, retryCount + 1);
    }

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) {
        return "API 사용량 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.";
      }
      throw new Error(`API ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const textBlocks = data.content?.filter((b: any) => b.type === "text");
    return (
      textBlocks?.map((b: any) => b.text).join("\n") ||
      "검색 결과를 가져오지 못했습니다."
    );
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      return "웹 검색 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }
    throw error;
  }
}

function createWebSearchTool(anthropicApiKey: string) {
  return tool({
    description:
      "웹에서 최신 정보를 검색합니다. 사용자가 외부 정보나 최신 뉴스를 물어볼 때만 사용합니다. 이전 대화에서 이미 검색한 내용의 후속 질문에는 사용하지 마세요.",
    parameters: z.object({
      query: z.string().describe("검색할 내용 (한국어 또는 영어)"),
    }),
    execute: async ({ query }) => {
      try {
        const answer = await callWebSearchAPI(anthropicApiKey, query);
        return { answer };
      } catch (error: any) {
        console.error("[Web Search] Error:", error.message);
        return {
          answer: `웹 검색 중 오류가 발생했습니다: ${error.message}`,
        };
      }
    },
  });
}

/**
 * 대화 히스토리 슬라이딩 윈도우
 * 세션의 첫 메시지(의도 파악)를 보존하고, 최근 N-1개 메시지만 유지
 */
function trimMessages(messages: any[], maxCount = 10): any[] {
  if (messages.length <= maxCount) return messages;
  return [messages[0], ...messages.slice(-(maxCount - 1))];
}

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
    // DB 쿼리 실패 시에도 기본값으로 채팅은 동작하도록 함
    let context;
    try {
      context = await buildContext(session.user.id, currentSessionId);
    } catch (dbError: any) {
      console.error("[AI Chat] DB context error, using defaults:", dbError.message);
      context = {
        recentLogs: [],
        currentGoals: [],
        recentReview: null,
        user: { name: session.user.name || "팀원", department: null },
        isFirstTime: false,
        recentChatHistory: [],
        customPrompt: "",
      };
    }
    const anthropic = createAnthropic({ apiKey });

    // 도구 구성 (웹 검색 포함 - 기존 Anthropic API 활용)
    const tools: Record<string, any> = {
      web_search: createWebSearchTool(apiKey),
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

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: getStaticSystemPrompt() + "\n\n" + getDynamicSystemPrompt(context),
      messages: trimMessages(messages),
      tools,
      maxSteps: 2,
      maxTokens: 800,
      onFinish: async ({ text, usage }) => {
        // 토큰 사용량 로깅 (최적화 효과 모니터링용)
        if (usage) {
          console.log(
            `[Token Usage] user=${session.user.id} session=${currentSessionId} ` +
            `input=${usage.promptTokens} output=${usage.completionTokens} total=${usage.totalTokens}`
          );
        }
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
