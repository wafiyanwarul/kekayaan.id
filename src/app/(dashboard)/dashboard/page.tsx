"use client"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Banknote, Droplets, Gauge, WalletCards, TrendingUp, Loader2 } from "lucide-react"
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome"
import { StatCard } from "@/components/shared/StatCard"
import { WealthAllocationChart } from "@/features/assets/components/WealthAllocationChart"
import { NetWorthTrendChart } from "@/features/assets/components/NetWorthTrendChart"
import { MonthlyFinanceCard } from "@/features/finance/components/MonthlyFinanceCard"
import { CashFlowBarChart } from "@/features/finance/components/CashFlowBarChart"
import { getCycleRange, summarizeTransactions, toDateInputValue } from "@/features/finance/utils"
import { createClient } from "@/lib/supabase/client"
import { AnimatedCounter } from "@/components/shared/AnimatedCounter"

export default function DashboardPage() {
  const [email, setEmail] = useState("")
  const [wealth, setWealth] = useState({ totalWealth: 0, liquidWealth: 0, nonLiquidWealth: 0, investmentWealth: 0 })
  const [assetCount, setAssetCount] = useState(0)
  const [finance, setFinance] = useState({ income: 0, expense: 0, surplus: 0, savingsRate: 0, investments: 0 })
  const [activeCycle, setActiveCycle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? "")
        const userId = user.id

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

        const currentActiveCycle = getCycleRange(new Date(), cycle ?? { start_day: 25, end_day: 24 })
        setActiveCycle(currentActiveCycle)

        const { data: cycleTransactions } = await supabase
          .from("transactions")
          .select("amount,type,transaction_date,category:transaction_categories(name)")
          .eq("user_id", userId)
          .gte("transaction_date", toDateInputValue(currentActiveCycle.start))
          .lte("transaction_date", toDateInputValue(currentActiveCycle.end))

        const calculatedWealth = (assets ?? []).reduce(
          (acc, asset) => {
            const val = Number(asset.current_value) || 0
            acc.totalWealth += val
            if (asset.is_liquid) {
              acc.liquidWealth += val
            } else {
              acc.nonLiquidWealth += val
            }
            const investmentCategories = ["stocks", "mutual_funds", "bonds", "crypto", "gold", "investasi"]
            if (investmentCategories.includes(asset.category)) {
              acc.investmentWealth += val
            }
            return acc
          },
          { totalWealth: 0, liquidWealth: 0, nonLiquidWealth: 0, investmentWealth: 0 }
        )

        const currentFinance = summarizeTransactions(
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

        setWealth(calculatedWealth)
        setAssetCount(assets?.length ?? 0)
        setFinance(currentFinance)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !activeCycle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardWelcome email={email} />

      {/* Wealth Summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Total Kekayaan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Total Kekayaan"
            value={<AnimatedCounter value={wealth.totalWealth} formatter="compact" />}
            sub={`${assetCount} aset tercatat`}
            trend="neutral"
            icon={WalletCards}
            className="col-span-2 md:col-span-1"
          />
          <StatCard
            label="Aset Likuid"
            value={<AnimatedCounter value={wealth.liquidWealth} formatter="compact" />}
            sub="Bisa dicairkan cepat"
            icon={Droplets}
          />
          <StatCard
            label="Aset Non-Likuid"
            value={<AnimatedCounter value={wealth.nonLiquidWealth} formatter="compact" />}
            sub="Properti & barang"
            icon={Banknote}
          />
          <StatCard
            label="Total Investasi"
            value={<AnimatedCounter value={wealth.investmentWealth} formatter="compact" />}
            sub={wealth.totalWealth > 0
              ? `${((wealth.investmentWealth / wealth.totalWealth) * 100).toFixed(1)}% dari total aset`
              : "0% dari total aset"}
            icon={TrendingUp}
          />
          <StatCard
            label="Rasio Likuid"
            value={wealth.totalWealth > 0
              ? <AnimatedCounter value={((wealth.liquidWealth / wealth.totalWealth) * 100)} formatter="percent" />
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
