import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// 게시글 목록 조회 (최신순)
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const posts = await prisma.ideaPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, department: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          post: { select: { id: true, name: true, department: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: posts });
}

// 게시글 작성
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { title, content } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 모두 입력해주세요." }, { status: 400 });
  }

  const post = await prisma.ideaPost.create({
    data: {
      userId: session!.user.id,
      title: title.trim(),
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true, department: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ data: post });
}
