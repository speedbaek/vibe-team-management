"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "TeamHidden";

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center h-16 px-4 border-b bg-background">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="ml-3 text-lg font-bold">{orgName}</h1>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-background border-r p-4">
            <div className="flex items-center h-12 mb-4">
              <h1 className="text-lg font-bold">{orgName}</h1>
            </div>
            <NavLinks
              role={(session?.user as any)?.role}
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <div className="absolute bottom-4 left-4 right-4">
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
