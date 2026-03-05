import { PrismaClient, UserRole, InvitationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  await prisma.invitation.upsert({
    where: { id: "system-admin-invite" },
    update: {},
    create: {
      id: "system-admin-invite",
      email: adminEmail,
      role: UserRole.ADMIN,
      status: InvitationStatus.PENDING,
      invitedBy: null,
      expiresAt: new Date("2099-12-31"),
    },
  });

  console.log(`Admin invitation created for ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
