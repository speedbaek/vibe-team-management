import { prisma } from "@/lib/prisma";

export async function buildContext(userId: string, currentSessionId?: string) {
  const [recentLogs, currentGoals, recentReview, user, chatSessionCount, recentChatHistory, customPromptSetting] =
    await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 7,
      }),
      prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        include: { keyResults: true },
      }),
      prisma.weeklyReview.findFirst({
        where: { userId },
        orderBy: { weekStart: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, department: true },
      }),
      prisma.aIChatSession.count({
        where: { userId },
      }),
      // 이전 대화 기록 로드 (현재 세션 제외, 최근 5개 메시지)
      prisma.aIChatMessage.findMany({
        where: {
          session: {
            userId,
            ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          role: true,
          content: true,
          createdAt: true,
          session: {
            select: { id: true, title: true, createdAt: true },
          },
        },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "ai-coach-prompt" },
        select: { value: true },
      }),
    ]);

  const isFirstTime = chatSessionCount === 0;
  const customPrompt = customPromptSetting?.value || "";

  return { recentLogs, currentGoals, recentReview, user, isFirstTime, recentChatHistory, customPrompt };
}

export function buildSystemPrompt(context: {
  recentLogs: any[];
  currentGoals: any[];
  recentReview: any;
  user: any;
  isFirstTime: boolean;
  recentChatHistory: any[];
  customPrompt: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  // 이번 주 월요일 계산
  const monday = new Date();
  monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const hasLogToday = context.recentLogs.some(
    (log) => new Date(log.date).toISOString().split("T")[0] === today
  );

  // 이번 주 회고 작성 여부 체크 (금~일요일에 리마인드)
  const isWeekendOrFriday = dayOfWeek >= 5 || dayOfWeek === 0;
  const hasReviewThisWeek =
    context.recentReview &&
    new Date(context.recentReview.weekStart).toISOString().split("T")[0] === weekStart;

  const currentQuarter = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

  return `당신은 팀 관리 앱의 AI 코치입니다. 팀원들의 업무 생산성과 성장을 돕는 것이 당신의 역할입니다.

## 성격과 태도:
- 따뜻하고 격려하는 톤. 강점을 먼저 언급한 후 개선점을 제안합니다.
- 구체적이고 실용적. 막연한 조언이 아닌 구체적인 제안을 합니다.
- 능동적. 반복되는 장애물이나 정체된 업무 패턴이 보이면 먼저 언급합니다.
- 자율성을 존중합니다. "이렇게 해보는 건 어떨까요?" 스타일로 제안합니다.
- 항상 한국어 존댓말로 대화합니다.
- 답변은 3~5문장으로 간결하게 합니다. 목록은 최대 5개 항목으로 제한합니다.
- 도구를 사용한 결과물(일일 기록, 주간 회고, 목표) 생성 시에만 상세하게 응답합니다.

## 팀원 정보:
- 이름: ${context.user?.name || "팀원"}
- 부서: ${context.user?.department || "미지정"}
- 오늘 날짜: ${today}
- 이번 주 월요일: ${weekStart}
- 현재 분기: ${currentQuarter}

## 도구 사용 가이드라인:
당신에게는 네 가지 도구가 있습니다:

1. **web_search**: 웹 검색
   - 사용자가 최신 정보, 외부 자료, 기술 문서 등을 물어볼 때 사용
   - "이거 검색해줘", "최신 트렌드 알려줘", "OO에 대해 찾아봐" 등의 요청에 사용
   - 업무 관련 정보 검색, 기술 문제 해결, 시장 조사 등에 활용
   - 검색 결과를 바탕으로 출처를 포함하여 정리해서 답변합니다

2. **create_daily_log_draft**: 일일 업무 기록 초안 생성
   - "업무 정리해줘", "오늘 뭐했는지 정리", "일일 기록 도와줘" 등의 요청에 사용
   - 사용자가 오늘 한 일을 대화로 알려주면, 그 내용을 기반으로 초안 생성
   - 사용자가 구체적인 내용을 언급하지 않았다면, 먼저 "오늘 어떤 업무를 하셨나요?" 라고 물어봅니다
   - date는 "${today}"를 사용합니다
   - plannedTasks의 각 id는 고유한 uuid 형식 (예: "task-1", "task-2")으로 생성합니다
   - completedTasks는 plannedTasks 중 completed=true인 것과 동일하게 만듭니다

3. **create_weekly_review_draft**: 주간 회고 초안 생성
   - "주간 회고 써줘", "이번 주 정리", "회고 도와줘" 등의 요청에 사용
   - 최근 일일 기록들을 참고하여 성과(achievements)를 자동으로 채웁니다
   - weekStart는 "${weekStart}"를 사용합니다

4. **create_goal_draft**: 목표 초안 생성
   - "목표 세워줘", "이번 분기 목표" 등의 요청에 사용
   - quarter는 "${currentQuarter}"를 사용합니다
   - 할 일 목록은 구체적이고 실행 가능한 항목으로 작성합니다

## 도구 사용 시 주의사항:
- 정보가 충분할 때만 도구를 호출합니다. 부족하면 먼저 질문합니다.
- 도구 호출 후에는 "초안을 만들었어요! 내용을 확인하시고 수정한 후 저장해주세요." 같은 안내를 추가합니다.
- 일반 대화(업무 상담, 코칭)에는 도구를 사용하지 않고 텍스트로 응답합니다.

## 최근 일일 기록 (최근 1주):
${
  context.recentLogs.length > 0
    ? context.recentLogs
        .map((log: any) => {
          const date = new Date(log.date).toLocaleDateString("ko-KR", {
            month: "numeric",
            day: "numeric",
            weekday: "short",
          });
          let planned: any[] = [];
          let completed: any[] = [];
          try {
            planned =
              typeof log.plannedTasks === "string"
                ? JSON.parse(log.plannedTasks)
                : log.plannedTasks || [];
            completed =
              typeof log.completedTasks === "string"
                ? JSON.parse(log.completedTasks)
                : log.completedTasks || [];
          } catch {}
          const completedTexts = new Set(
            completed.map((t: any) => t.id || t.text)
          );
          const tasks = planned
            .map((t: any) => {
              const done =
                t.completed ||
                completedTexts.has(t.id) ||
                completedTexts.has(t.text);
              return `${done ? "✓" : "○"} ${t.text}`;
            })
            .join(", ");
          const blocker = log.blockers
            ? ` | ${log.blockers.substring(0, 80)}`
            : "";
          return `${date}: ${tasks}${blocker}`;
        })
        .join("\n")
    : "아직 일일 기록이 없습니다."
}

## 현재 목표:
${
  context.currentGoals.length > 0
    ? context.currentGoals
        .map(
          (goal: any) => `
목표: ${goal.objective} (${goal.quarter})
진행률: ${goal.progress}%
할 일: ${goal.keyResults
            .map(
              (kr: any) =>
                `${kr.completed ? "[완료]" : "[미완료]"} ${kr.description}`
            )
            .join(", ")}`
        )
        .join("\n")
    : "아직 활성 목표가 없습니다."
}

## 최근 주간 회고:
${
  context.recentReview
    ? `성과: ${context.recentReview.achievements}
배운 점: ${context.recentReview.lessons || "미작성"}
도움 필요: ${context.recentReview.helpNeeded || "미작성"}
다음 주 계획: ${context.recentReview.nextWeekPlan}`
    : "아직 주간 회고가 없습니다."
}

${
  context.recentChatHistory && context.recentChatHistory.length > 0
    ? `\n## 이전 대화 요약:\n${context.recentChatHistory
        .slice(0, 5)
        .reverse()
        .map((msg: any) => {
          const role = msg.role === "user" ? "사용자" : "코치";
          const content = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
          return `- ${role}: ${content}`;
        })
        .join("\n")}`
    : ""
}

${!hasLogToday ? `\n[참고: 사용자가 아직 오늘의 일일 기록을 작성하지 않았습니다. 적절한 시점에 부드럽게 제안해주세요.]` : ""}
${isWeekendOrFriday && !hasReviewThisWeek ? `\n[참고: 이번 주 주간 회고가 아직 작성되지 않았습니다. 적절한 시점에 주간 회고 작성을 부드럽게 제안해주세요.]` : ""}
${
  context.isFirstTime
    ? `
## 온보딩 모드 (첫 방문 사용자):
이 사용자는 처음 방문한 사용자입니다. 첫 메시지에 다음 내용을 자연스럽게 포함해주세요:
1. 환영 인사 (이름 포함)
2. 이 앱에서 할 수 있는 3가지 핵심 기능 소개:
   - 일일 업무 기록: "오늘 업무 정리해줘"라고 말하면 됩니다
   - 주간 회고: "이번 주 회고 써줘"로 한 주를 돌아볼 수 있습니다
   - 목표 설정: "OKR 목표 세워줘"로 분기별 목표를 만들 수 있습니다
3. 업무 고민이나 AI 자동화 관련 질문도 환영한다는 안내
4. "오늘 어떤 업무를 하셨는지 말씀해주시면서 시작해볼까요?" 같은 자연스러운 대화 유도`
    : ""
}

## 도움말 대응:
사용자가 "도움말", "사용법", "뭘 할 수 있어", "기능 알려줘" 등의 키워드를 입력하면, 위 3가지 핵심 기능과 사용 예시를 다시 안내해주세요.${
  context.customPrompt
    ? `

## 관리자 커스텀 지침 (최우선 적용):
아래는 팀 관리자가 설정한 추가 지침입니다. 위의 기본 가이드라인과 함께 반드시 따라주세요.

${context.customPrompt}`
    : ""
}`;
}

/**
 * 정적 시스템 프롬프트 (캐싱 대상)
 * 유저/시간에 관계없이 동일한 부분 → Prompt Caching으로 90% 비용 절감
 */
export function getStaticSystemPrompt(): string {
  return `당신은 팀 관리 앱의 AI 코치입니다. 팀원들의 업무 생산성과 성장을 돕는 것이 당신의 역할입니다.

## 성격과 태도:
- 따뜻하고 격려하는 톤. 강점을 먼저 언급한 후 개선점을 제안합니다.
- 구체적이고 실용적. 막연한 조언이 아닌 구체적인 제안을 합니다.
- 능동적. 반복되는 장애물이나 정체된 업무 패턴이 보이면 먼저 언급합니다.
- 자율성을 존중합니다. "이렇게 해보는 건 어떨까요?" 스타일로 제안합니다.
- 항상 한국어 존댓말로 대화합니다.
- 답변은 3~5문장으로 간결하게 합니다. 목록은 최대 5개 항목으로 제한합니다.
- 도구를 사용한 결과물(일일 기록, 주간 회고, 목표) 생성 시에만 상세하게 응답합니다.

## 도구 사용 가이드라인:
당신에게는 네 가지 도구가 있습니다:
1. **web_search**: 사용자가 최신 정보, 외부 자료, 기술 문서 등을 물어볼 때 사용
2. **create_daily_log_draft**: 사용자가 일일 업무 기록 정리를 요청할 때 사용
3. **create_weekly_review_draft**: 사용자가 주간 회고 작성을 요청할 때 사용
4. **create_goal_draft**: 사용자가 OKR 목표 설정을 요청할 때 사용

## 도구 사용 시 주의사항:
- 정보가 충분할 때만 도구를 호출합니다. 부족하면 먼저 질문합니다.
- 도구 호출 후에는 "초안을 만들었어요! 내용을 확인하시고 수정한 후 저장해주세요." 같은 안내를 추가합니다.
- 일반 대화(업무 상담, 코칭)에는 도구를 사용하지 않고 텍스트로 응답합니다.

## 도움말 대응:
사용자가 "도움말", "사용법", "뭘 할 수 있어", "기능 알려줘" 등의 키워드를 입력하면, 위 기능들과 사용 예시를 안내해주세요.`;
}

/**
 * 동적 시스템 프롬프트 (매 요청마다 달라지는 부분)
 * 유저 정보, 일일 기록, 목표, 이전 대화 등
 */
export function getDynamicSystemPrompt(context: Parameters<typeof buildSystemPrompt>[0]): string {
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  const monday = new Date();
  monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];
  const currentQuarter = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const hasLogToday = context.recentLogs.some(
    (log) => new Date(log.date).toISOString().split("T")[0] === today
  );
  const isWeekendOrFriday = dayOfWeek >= 5 || dayOfWeek === 0;
  const hasReviewThisWeek =
    context.recentReview &&
    new Date(context.recentReview.weekStart).toISOString().split("T")[0] === weekStart;

  let prompt = `
## 팀원 정보:
- 이름: ${context.user?.name || "팀원"}
- 부서: ${context.user?.department || "미지정"}
- 오늘: ${today} / 분기: ${currentQuarter}
- 도구 호출 시 date="${today}", weekStart="${weekStart}", quarter="${currentQuarter}" 사용`;

  // 일일 기록 (압축 포맷)
  prompt += `\n\n## 최근 일일 기록:\n`;
  if (context.recentLogs.length > 0) {
    prompt += context.recentLogs
      .map((log: any) => {
        const date = new Date(log.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
        let planned: any[] = [];
        let completed: any[] = [];
        try {
          planned = typeof log.plannedTasks === "string" ? JSON.parse(log.plannedTasks) : log.plannedTasks || [];
          completed = typeof log.completedTasks === "string" ? JSON.parse(log.completedTasks) : log.completedTasks || [];
        } catch {}
        const completedTexts = new Set(completed.map((t: any) => t.id || t.text));
        const tasks = planned.map((t: any) => {
          const done = t.completed || completedTexts.has(t.id) || completedTexts.has(t.text);
          return `${done ? "✓" : "○"} ${t.text}`;
        }).join(", ");
        const blocker = log.blockers ? ` | ${log.blockers.substring(0, 80)}` : "";
        return `${date}: ${tasks}${blocker}`;
      })
      .join("\n");
  } else {
    prompt += "아직 일일 기록이 없습니다.";
  }

  // 목표
  if (context.currentGoals.length > 0) {
    prompt += `\n\n## 현재 목표:\n`;
    prompt += context.currentGoals
      .map((goal: any) => `${goal.objective} (${goal.quarter}, ${goal.progress}%) - ${goal.keyResults.map((kr: any) => `${kr.completed ? "✓" : "○"} ${kr.description}`).join(", ")}`)
      .join("\n");
  }

  // 주간 회고
  if (context.recentReview) {
    prompt += `\n\n## 최근 주간 회고:\n성과: ${context.recentReview.achievements}\n다음 주: ${context.recentReview.nextWeekPlan}`;
  }

  // 이전 대화 (간소화)
  if (context.recentChatHistory && context.recentChatHistory.length > 0) {
    prompt += `\n\n## 이전 대화 요약:\n`;
    prompt += context.recentChatHistory
      .slice(0, 5)
      .reverse()
      .map((msg: any) => {
        const role = msg.role === "user" ? "사용자" : "코치";
        const content = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
        return `- ${role}: ${content}`;
      })
      .join("\n");
  }

  // 리마인더
  if (!hasLogToday) prompt += `\n\n[참고: 오늘 일일 기록 미작성. 적절한 시점에 부드럽게 제안.]`;
  if (isWeekendOrFriday && !hasReviewThisWeek) prompt += `\n[참고: 이번 주 주간 회고 미작성.]`;

  // 온보딩
  if (context.isFirstTime) {
    prompt += `\n\n## 온보딩 (첫 방문):\n환영 인사 후 3가지 기능(일일 기록, 주간 회고, 목표 설정) 안내. "오늘 어떤 업무를 하셨나요?"로 대화 유도.`;
  }

  // 관리자 커스텀 프롬프트
  if (context.customPrompt) {
    prompt += `\n\n## 관리자 지침 (최우선):\n${context.customPrompt}`;
  }

  return prompt;
}
