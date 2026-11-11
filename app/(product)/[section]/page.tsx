"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useGhanaUser } from "@/components/use-user";
import { LeaderboardCard } from "@/components/widgets";
import { Card, CardContent, Badge, Button, buttonVariants, cn } from "@/components/ui";

const SUBJECTS = [
  { name: "Mathematics", level: "BECE" }, { name: "English Language", level: "BECE" },
  { name: "Integrated Science", level: "BECE" }, { name: "Social Studies", level: "BECE" },
  { name: "Core Mathematics", level: "WASSCE" }, { name: "Core English", level: "WASSCE" },
  { name: "Core Science", level: "WASSCE" }, { name: "Social Studies", level: "WASSCE" },
];
const TITLES: Record<string, string> = {
  subjects: "Subjects", "mock-exams": "Mock exams", "past-questions": "Past questions", leaderboard: "Leaderboard", profile: "Profile",
};

export default function SectionPage({ params }: { params: { section: string } }) {
  const slug = params.section;
  if (!TITLES[slug]) notFound();
  const u = useGhanaUser();
  const [q, setQ] = useState("");
  useEffect(() => { setQ((new URLSearchParams(window.location.search).get("q") || "").toLowerCase()); }, []);

  let body: React.ReactNode;
  if (slug === "leaderboard") body = <LeaderboardCard rows={u.rows} limit={50} />;
  else if (slug === "mock-exams") body = <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Timed mock exams are not available yet.</CardContent></Card>;
  else if (slug === "profile") body = (
    <Card><CardContent className="space-y-3">
      {[["Name", u.name], ["School", u.school || "Not set"], ["Phone", u.phone], ["Questions answered", u.stats.done]].map(([k, v]) => (
        <div key={k as string} className="flex justify-between border-b pb-2 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "-"}</span></div>
      ))}
      <Button variant="outline" onClick={() => { localStorage.removeItem("gp_session_v3"); window.location.href = "/"; }}>Sign out</Button>
    </CardContent></Card>
  );
  else body = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SUBJECTS.filter((s) => s.name.toLowerCase().includes(q)).map((s) => (
        <Card key={s.name + s.level}><CardContent className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.name}</p><Badge className="mt-1">{s.level}</Badge></div>
          <Link href="/" className={cn(buttonVariants({ size: "sm" }))}>Practise</Link>
        </CardContent></Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{TITLES[slug]}</h1>
      {body}
    </div>
  );
}
