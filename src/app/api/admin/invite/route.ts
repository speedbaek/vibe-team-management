import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: invitations });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 }
    );
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: { email: parsed.data.email, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "Invitation already sent" },
      { status: 409 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email: parsed.data.email,
      role: parsed.data.role as any,
      invitedBy: session!.user.id,
      expiresAt,
    },
  });

  return NextResponse.json({ data: invitation }, { status: 201 });
}
