import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Banknote, Droplets, Gauge, WalletCards, TrendingUp } from "lucide-react"
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome"
import { StatCard } from "@/components/shared/StatCard"
import { WealthAllocationChart } from "@/features/assets/components/WealthAllocationChart"
import { NetWorthTrendChart } from "@/features/assets/components/NetWorthTrendChart"
import { MonthlyFinanceCard } from "@/features/finance/components/MonthlyFinanceCard"
import { CashFlowBarChart } from "@/features/finance/components/CashFlowBarChart"
import { getCycleRange, summarizeTransactions, toDateInputValue } from "@/features/finance/utils"
import { createClient } from "@/lib/supabase/server"
import { formatCompact } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? ""

  const [{ data: assets }, { data: cycle }] = await Promise.all([
    supabase
      .from("assets")
      .select("current_value,is_liquid,category")
      .eq("user_id", userId),
    supabase
      .from("monthly_cycles")
      .select("start_day,end_day")
      .eq("user_id", userId)
      .maybeSingle(),
  ])
  const activeCycle = getCycleRange(new Date(), cycle ?? { start_day: 25, end_day: 24 })
  const { data: cycleTransactions } = await supabase
    .from("transactions")
    .select("amount,type,transaction_date,category:transaction_categories(name)")
    .eq("user_id", userId)
    .gte("transaction_date", toDateInputValue(activeCycle.start))
    .lte("transaction_date", toDateInputValue(activeCycle.end))

  const wealth = (assets ?? []).reduce(
    (summary, asset) => {
      const value = Number(asset.current_value) || 0

      if (asset.is_liquid) summary.liquidWealth += value
      else summary.nonLiquidWealth += value

      // Calculate investment assets: stocks, mutual_funds, bonds, crypto, gold
      const investmentCategories = ["stocks", "mutual_funds", "bonds", "crypto", "gold"]
      if (investmentCategories.includes(asset.category)) {
        summary.investmentWealth += value
      }

      summary.totalWealth += value
      return summary
    },
    {
      totalWealth: 0,
      liquidWealth: 0,
      nonLiquidWealth: 0,
      investmentWealth: 0,
    }
  )
  const assetCount = assets?.length ?? 0
  const finance = summarizeTransactions(
    (cycleTransactions ?? []).map((transaction: any) => ({
      ...transaction,
      amount: Number(transaction.amount),
      category_id: null,
      created_at: "",
      id: "",
      notes: null,
      title: "",
      user_id: userId,
      category: transaction.category,
    }))
  )

  return (
    <div className="space-y-6">
      <DashboardWelcome email={user?.email} />

      {/* Wealth Summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Total Kekayaan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Total Kekayaan"
            value={formatCompact(wealth.totalWealth)}
            sub={`${assetCount} aset tercatat`}
            trend="neutral"
            icon={WalletCards}
            className="col-span-2 md:col-span-1"
          />
          <StatCard
            label="Aset Likuid"
            value={formatCompact(wealth.liquidWealth)}
            sub="Bisa dicairkan cepat"
            icon={Droplets}
          />
          <StatCard
            label="Aset Non-Likuid"
            value={formatCompact(wealth.nonLiquidWealth)}
            sub="Properti & barang"
            icon={Banknote}
          />
          <StatCard
            label="Total Investasi"
            value={formatCompact(wealth.investmentWealth)}
            sub={wealth.totalWealth > 0
              ? `${((wealth.investmentWealth / wealth.totalWealth) * 100).toFixed(1)}% dari total aset`
              : "0% dari total aset"}
            icon={TrendingUp}
          />
          <StatCard
            label="Rasio Likuid"
            value={wealth.totalWealth > 0
              ? `${((wealth.liquidWealth / wealth.totalWealth) * 100).toFixed(1)}%`
              : "0%"}
            sub="Dari total aset"
            icon={Gauge}
          />
        </div>
      </section>

      {/* Historical Trend Charts */}
      <section className="grid md:grid-cols-2 gap-4">
        <NetWorthTrendChart />
        <CashFlowBarChart />
      </section>

      {/* Current Allocation & Monthly Breakdown */}
      <section className="grid md:grid-cols-2 gap-4">
        <WealthAllocationChart
          liquid={wealth.liquidWealth}
          nonLiquid={wealth.nonLiquidWealth}
        />
        <MonthlyFinanceCard
          totalIncome={finance.income}
          totalExpense={finance.expense}
          surplus={finance.surplus}
          savingsRate={finance.savingsRate}
          totalInvestments={finance.investments}
          cycleStart={format(activeCycle.start, "d MMM", { locale: id })}
          cycleEnd={format(activeCycle.end, "d MMM", { locale: id })}
        />
      </section>
    </div>
  )
}

