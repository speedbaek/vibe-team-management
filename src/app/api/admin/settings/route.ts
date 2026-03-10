import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "ai-coach-prompt";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const setting = await prisma.systemSetting.findUnique({
    where: { key: SETTING_KEY },
  });

  return NextResponse.json({
    data: {
      customPrompt: setting?.value || "",
      updatedAt: setting?.updatedAt || null,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { customPrompt } = await req.json();

  if (typeof customPrompt !== "string") {
    return NextResponse.json(
      { error: "customPrompt 값이 필요합니다." },
      { status: 400 }
    );
  }

  // 빈 문자열이면 삭제 (기본 프롬프트만 사용)
  if (customPrompt.trim() === "") {
    await prisma.systemSetting.deleteMany({
      where: { key: SETTING_KEY },
    });
    return NextResponse.json({ data: { customPrompt: "", updatedAt: null } });
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: customPrompt.trim(),
      updatedBy: session!.user.id,
    },
    update: {
      value: customPrompt.trim(),
      updatedBy: session!.user.id,
    },
  });

  return NextResponse.json({
    data: { customPrompt: setting.value, updatedAt: setting.updatedAt },
  });
}
