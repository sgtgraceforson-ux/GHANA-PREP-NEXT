"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardCheck, FileText, Trophy, User, Search, GraduationCap } from "lucide-react";
import { cn } from "@/components/ui";
import { useEffect } from "react";
import { useGhanaUser } from "@/components/use-user";
import { setTutorContext } from "@/components/tutor-chat";
import { StreakFlame } from "@/components/streak-flame";

const NAV = [
  { label: "Dashboard", short: "Home", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Subjects", short: "Subjects", href: "/subjects", Icon: BookOpen },
  { label: "Mock Exams", short: "Mocks", href: "/mock-exams", Icon: ClipboardCheck },
  { label: "Past Questions", short: "Past Qs", href: "/past-questions", Icon: FileText },
  { label: "Leaderboard", short: "Ranks", href: "/leaderboard", Icon: Trophy },
  { label: "Profile", short: "Profile", href: "/profile", Icon: User },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const u = useGhanaUser();
  const on = (href: string) => path === href;

  // AI tutor: shown to signed-in students on every page that uses this shell
  useEffect(() => {
    setTutorContext(u.session ? { layout: "page", userKey: u.phone, name: (u.name || "").split(" ")[0] } : null);
    return () => setTutorContext(null);
  }, [u.session, u.phone, u.name]);

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">GhanaPrep</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ label, href, Icon }) => (
            <Link key={href} href={href} aria-current={on(href) ? "page" : undefined}
              className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                on(href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground">{u.name || "Guest"}</p>
          <p className="truncate">{u.school || "BECE & WASSCE practice"}</p>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" aria-label="Search subjects" placeholder="Search subjects and topics"
              className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
              onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/subjects?q=" + encodeURIComponent((e.target as HTMLInputElement).value); }} />
          </div>
          <div className="ml-auto flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold" title="Day streak">
            <StreakFlame days={u.stats.streak} />
            <span>{u.stats.streak}</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">day streak</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-background md:hidden" aria-label="Main">
        {NAV.map(({ short, href, Icon }) => (
          <Link key={href} href={href} aria-current={on(href) ? "page" : undefined}
            className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium", on(href) ? "text-primary" : "text-muted-foreground")}>
            <Icon className="h-5 w-5" />
            {short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
