import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// 댓글 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id: postId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }

  // 게시글 존재 확인
  const post = await prisma.ideaPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const comment = await prisma.ideaComment.create({
    data: {
      postId,
      userId: session!.user.id,
      content: content.trim(),
    },
    include: {
      post: { select: { id: true, name: true, department: true, image: true } },
    },
  });

  return NextResponse.json({ data: comment });
}
