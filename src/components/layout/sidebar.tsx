"use client";

import { useSession } from "next-auth/react";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const { data: session } = useSession();
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "TeamHidden";

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-background">
      <div className="flex flex-col h-full">
        {/* Logo / Org Name */}
        <div className="flex items-center h-16 px-6 border-b">
          <h1 className="text-lg font-bold">{orgName}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <NavLinks role={(session?.user as any)?.role} />
        </nav>

        <Separator />

        {/* User Menu */}
        <div className="p-3">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
