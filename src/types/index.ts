import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      department: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    userId: string;
    role: UserRole;
    department: string | null;
  }
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CompletedTask {
  id: string;
  text: string;
}
