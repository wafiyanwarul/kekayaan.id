import { Hammer, Target, TrendingUp } from "lucide-react"

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goals</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Goal Planner is in development</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This section will help you plan future milestones, track target amounts, and connect savings progress with your monthly cash flow.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Target className="h-7 w-7" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Target,
            title: "Target-based planning",
            text: "Set financial goals with target dates, target values, and progress tracking.",
          },
          {
            icon: TrendingUp,
            title: "Progress visibility",
            text: "See how monthly surplus and asset growth contribute to each goal.",
          },
          {
            icon: Hammer,
            title: "Coming soon",
            text: "Goal creation, editing, reminders, and dashboard integration are planned next.",
          },
        ].map(({ icon: Icon, text, title }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
