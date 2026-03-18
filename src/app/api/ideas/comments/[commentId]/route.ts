import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// 댓글 삭제 (본인 또는 어드민)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { commentId } = await params;

  const comment = await prisma.ideaComment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  const isOwner = comment.userId === session!.user.id;
  const isAdmin = (session!.user as any).role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await prisma.ideaComment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
