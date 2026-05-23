"use client"
import { formatCompact } from "@/lib/utils"

interface Props {
  totalIncome: number
  totalExpense: number
  surplus: number
  savingsRate: number
  cycleStart: string
  cycleEnd: string
}

export function MonthlyFinanceCard({ totalIncome, totalExpense, surplus, savingsRate, cycleStart, cycleEnd }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Keuangan Bulan Ini</p>
        <span className="text-xs text-muted-foreground">{cycleStart} – {cycleEnd}</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Pemasukan</span>
          <span className="text-sm font-semibold text-emerald-500">+{formatCompact(totalIncome)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Pengeluaran</span>
          <span className="text-sm font-semibold text-rose-500">-{formatCompact(totalExpense)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="text-sm font-medium">Surplus</span>
          <span className={`text-base font-bold ${surplus >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {surplus >= 0 ? "+" : ""}{formatCompact(surplus)}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Savings Rate</span>
          <span className="font-medium text-foreground">{savingsRate.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(savingsRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
