import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

// 게시글 상세 (댓글 포함)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const post = await prisma.ideaPost.findUnique({
    where: { id },
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

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ data: post });
}

// 게시글 삭제 (본인 또는 어드민)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const post = await prisma.ideaPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 본인 또는 어드민만 삭제 가능
  const isOwner = post.userId === session!.user.id;
  const isAdmin = (session!.user as any).role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await prisma.ideaPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
