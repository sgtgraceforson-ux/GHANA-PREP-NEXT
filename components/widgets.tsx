"use client";
import Link from "next/link";
import { Play, Target, CalendarClock, TrendingUp, Trophy, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, buttonVariants, cn } from "@/components/ui";

export const DAILY_GOAL = 10; // questions per day

export const WAEC_EXAM = { label: "WASSCE", date: "" }; // set the official WAEC start date, e.g. "2027-05-03"

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}

export function ContinueCard({ last }: { last: any }) {
  return (
    <Card>
      <CardHeader><CardTitle>Continue learning</CardTitle>{last && <Badge>{last.level === "JHS" ? "BECE" : "WASSCE"}</Badge>}</CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{last ? last.subject : "No practice yet"}</p>
          <p className="truncate text-sm text-muted-foreground">{last ? (last.topic || "All topics") : "Pick a subject to start your first session."}</p>
        </div>
        <Link href="/" className={cn(buttonVariants(), "shrink-0")}>
          <Play className="h-4 w-4" />{last ? "Resume" : "Start"}
        </Link>
      </CardContent>
    </Card>
  );
}

export function GoalCard({ done }: { done: number }) {
  const pct = (done / DAILY_GOAL) * 100;
  return (
    <Card>
      <CardHeader><CardTitle>Today&apos;s goal</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader>
      <CardContent>
        <div className="mb-2 flex items-end justify-between">
          <p className="text-2xl font-semibold">{Math.min(done, DAILY_GOAL)}<span className="text-sm font-normal text-muted-foreground"> / {DAILY_GOAL} questions</span></p>
          <p className="text-sm font-medium text-primary">{Math.round(Math.min(pct, 100))}%</p>
        </div>
        <Progress value={pct} />
        <p className="mt-2 text-xs text-muted-foreground">{done >= DAILY_GOAL ? "Goal reached. Keep your streak going tomorrow." : `${DAILY_GOAL - done} more to hit today's goal.`}</p>
      </CardContent>
    </Card>
  );
}

export function CountdownCard() {
  const has = !!WAEC_EXAM.date;
  const days = has ? Math.max(0, Math.ceil((new Date(WAEC_EXAM.date + "T00:00:00").getTime() - Date.now()) / 86400000)) : null;
  return (
    <Card>
      <CardHeader><CardTitle>WAEC countdown</CardTitle><CalendarClock className="h-4 w-4 text-muted-foreground" /></CardHeader>
      <CardContent>
        {has ? (<>
          <p className="text-4xl font-semibold text-primary">{days}</p>
          <p className="text-sm text-muted-foreground">days until {WAEC_EXAM.label}</p>
        </>) : <p className="text-sm text-muted-foreground">The exam date has not been announced yet.</p>}
      </CardContent>
    </Card>
  );
}

export function WeakTopicsCard({ weak }: { weak: Record<string, number> }) {
  const list = Object.entries(weak || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <Card>
      <CardHeader><CardTitle>Weak topics</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
      <CardContent className="pt-2">
        {list.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No weak topics yet. Answer a few questions and we will track where you slip.</p>
        ) : (
          <ul className="divide-y">
            {list.map(([topic, n]) => (
              <li key={topic} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{topic}</p><p className="text-xs text-muted-foreground">{n} missed</p></div>
                <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>Practise<ArrowRight className="h-3 w-3" /></Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderboardCard({ rows, limit = 5 }: { rows: any[]; limit?: number }) {
  const top = rows.slice(0, limit);
  return (
    <Card>
      <CardHeader><CardTitle>Leaderboard</CardTitle><Badge>This device</Badge></CardHeader>
      <CardContent className="pt-2">
        {top.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No scores yet. Be the first on the board.</p>
        ) : (
          <ul className="divide-y">
            {top.map((r, i) => (
              <li key={i} className={cn("flex items-center gap-3 py-2.5", r.me && "-mx-2 rounded-lg bg-primary/5 px-2")}>
                <span className={cn("w-5 text-center text-sm font-semibold", i === 0 ? "text-streak" : "text-muted-foreground")}>{i + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}{r.me && <span className="text-primary"> (you)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.school || `${r.done} questions`}</p></div>
                <span className="text-sm font-semibold">{r.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
