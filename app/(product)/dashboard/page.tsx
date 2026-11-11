"use client";
import { useGhanaUser } from "@/components/use-user";
import { StatTile, ContinueCard, GoalCard, CountdownCard, WeakTopicsCard, LeaderboardCard } from "@/components/widgets";

export default function DashboardPage() {
  const u = useGhanaUser();
  const { done, doneToday, totalScore, streak, weak } = u.stats;
  const first = (u.name || "").split(" ")[0];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{first ? `Welcome back, ${first}` : "Welcome to GhanaPrep"}</h1>
        <p className="text-sm text-muted-foreground">Here is where you stand today.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Answered" value={done} />
        <StatTile label="Average" value={done ? `${(totalScore / done).toFixed(1)}/10` : "-"} />
        <StatTile label="Streak" value={`${streak} d`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ContinueCard last={u.last} />
          <GoalCard done={doneToday} />
          <WeakTopicsCard weak={weak} />
        </div>
        <div className="space-y-4">
          <CountdownCard />
          <LeaderboardCard rows={u.rows} />
        </div>
      </div>
    </div>
  );
}
