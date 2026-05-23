import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | "neutral"
  className?: string
  icon?: LucideIcon
}

export function StatCard({ label, value, sub, trend, className, icon: Icon }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
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
        {Icon && (
          <div className={cn(
            "rounded-lg p-2",
            trend === "up" ? "bg-emerald-500/15 text-emerald-300" :
            trend === "down" ? "bg-rose-500/15 text-rose-300" :
            "bg-indigo-500/15 text-indigo-300"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
