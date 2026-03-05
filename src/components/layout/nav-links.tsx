"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FileText,
  MessageSquare,
  Target,
  LayoutDashboard,
  Users,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const memberLinks = [
  { href: "/ai-chat", label: "AI 코치", icon: MessageSquare },
  { href: "/daily-log", label: "일일 기록", icon: CalendarDays },
  { href: "/weekly-review", label: "주간 회고", icon: FileText },
  { href: "/okr", label: "목표 (OKR)", icon: Target },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "팀 대시보드", icon: LayoutDashboard },
  { href: "/admin/members", label: "팀원 관리", icon: Users },
  { href: "/admin/invite", label: "초대", icon: UserPlus },
];

interface NavLinksProps {
  role?: string;
  onNavigate?: () => void;
}

export function NavLinks({ role, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {role === "ADMIN" && (
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
          내 업무
        </p>
      )}
      {memberLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}

      {role === "ADMIN" && (
        <>
          <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase">
            Admin
          </p>
          {adminLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
