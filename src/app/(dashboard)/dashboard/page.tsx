import { StatCard } from "@/components/shared/StatCard"
import { WealthAllocationChart } from "@/features/assets/components/WealthAllocationChart"
import { MonthlyFinanceCard } from "@/features/finance/components/MonthlyFinanceCard"
import { formatCompact, formatRupiah } from "@/lib/utils"

// Mock data — will be replaced by real API calls
const mockWealth = {
  totalWealth: 185_000_000,
  liquidWealth: 52_000_000,
  nonLiquidWealth: 133_000_000,
  todayDelta: 500_000,
  monthlyDelta: 3_200_000,
}

const mockFinance = {
  totalIncome: 12_000_000,
  totalExpense: 7_350_000,
  surplus: 4_650_000,
  savingsRate: 38.75,
  cycleStart: "25 Apr",
  cycleEnd: "24 Mei",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Wealth Summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Total Kekayaan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Kekayaan"
            value={formatCompact(mockWealth.totalWealth)}
            sub={`+${formatCompact(mockWealth.monthlyDelta)} bulan ini`}
            trend="up"
            className="col-span-2 md:col-span-1"
          />
          <StatCard
            label="Aset Likuid"
            value={formatCompact(mockWealth.liquidWealth)}
            sub="Bisa dicairkan cepat"
          />
          <StatCard
            label="Aset Non-Likuid"
            value={formatCompact(mockWealth.nonLiquidWealth)}
            sub="Properti & barang"
          />
          <StatCard
            label="Delta Hari Ini"
            value={mockWealth.todayDelta >= 0
              ? `+${formatCompact(mockWealth.todayDelta)}`
              : formatCompact(mockWealth.todayDelta)}
            sub="Dibanding kemarin"
            trend={mockWealth.todayDelta >= 0 ? "up" : "down"}
          />
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid md:grid-cols-2 gap-4">
        <WealthAllocationChart
          liquid={mockWealth.liquidWealth}
          nonLiquid={mockWealth.nonLiquidWealth}
        />
        <MonthlyFinanceCard {...mockFinance} />
      </section>
    </div>
  )
}
