import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Banknote, CircleDollarSign, Droplets, Gauge, WalletCards } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { WealthAllocationChart } from "@/features/assets/components/WealthAllocationChart"
import { MonthlyFinanceCard } from "@/features/finance/components/MonthlyFinanceCard"
import { getCycleRange, summarizeTransactions, toDateInputValue } from "@/features/finance/utils"
import { createClient } from "@/lib/supabase/server"
import { formatCompact } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id ?? ""
  const displayName = getDisplayName(user?.email)

  const [{ data: assets }, { data: cycle }] = await Promise.all([
    supabase
      .from("assets")
      .select("current_value,is_liquid")
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
    .select("amount,type,transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", toDateInputValue(activeCycle.start))
    .lte("transaction_date", toDateInputValue(activeCycle.end))

  const wealth = (assets ?? []).reduce(
    (summary, asset) => {
      const value = Number(asset.current_value) || 0

      if (asset.is_liquid) summary.liquidWealth += value
      else summary.nonLiquidWealth += value

      summary.totalWealth += value
      return summary
    },
    {
      totalWealth: 0,
      liquidWealth: 0,
      nonLiquidWealth: 0,
    }
  )
  const assetCount = assets?.length ?? 0
  const finance = summarizeTransactions(
    (cycleTransactions ?? []).map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      category_id: null,
      created_at: "",
      id: "",
      notes: null,
      title: "",
      user_id: userId,
    }))
  )

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Welcome back</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Hi, {displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your wealth cockpit is synced with the latest asset and finance data.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <CircleDollarSign className="h-7 w-7" />
          </div>
        </div>
      </section>

      {/* Wealth Summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Total Kekayaan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            label="Rasio Likuid"
            value={wealth.totalWealth > 0
              ? `${((wealth.liquidWealth / wealth.totalWealth) * 100).toFixed(1)}%`
              : "0%"}
            sub="Dari total aset"
            icon={Gauge}
          />
        </div>
      </section>

      {/* Charts Row */}
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
          cycleStart={format(activeCycle.start, "d MMM", { locale: id })}
          cycleEnd={format(activeCycle.end, "d MMM", { locale: id })}
        />
      </section>
    </div>
  )
}

function getDisplayName(email?: string | null) {
  if (!email) return "there"

  return email.split("@")[0]
}
