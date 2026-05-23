import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({ label, value, sub, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && (
        <p className={cn("text-xs font-medium",
          trend === "up" ? "text-emerald-500" :
          trend === "down" ? "text-rose-500" :
          "text-muted-foreground"
        )}>{sub}</p>
      )}
    </div>
  )
}
