import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getCycleRange, summarizeTransactions } from "@/features/finance/utils"

export interface HistoricalDataPoint {
  label: string
  netWorth: number
  income: number
  expense: number
  surplus: number
  savingsRate: number
  changePercent: number
  startDate: string
  endDate: string
}

export async function getHistoricalData(
  supabase: SupabaseClient,
  userId: string,
  monthsRange: number = 6
): Promise<HistoricalDataPoint[]> {
  // 1. Get monthly cycle settings
  const { data: cycleSetting } = await supabase
    .from("monthly_cycles")
    .select("start_day, end_day")
    .eq("user_id", userId)
    .maybeSingle()

  const startDay = cycleSetting?.start_day ?? 25
  const endDay = cycleSetting?.end_day ?? 24

  // 2. Generate the last N billing cycles (oldest → newest)
  const now = new Date()
  const cycles: Array<{ start: Date; end: Date; label: string }> = []

  for (let i = monthsRange - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 15)
    const range = getCycleRange(targetDate, { start_day: startDay, end_day: endDay })
    cycles.push({
      start: range.start,
      end: range.end,
      label: format(range.end, "MMM yy", { locale: id }),
    })
  }

  const oldestStart = format(cycles[0].start, "yyyy-MM-dd")
  const newestEnd = format(cycles[cycles.length - 1].end, "yyyy-MM-dd")

  // 3. Fetch all user assets
  const { data: assets } = await supabase
    .from("assets")
    .select("id, current_value, created_at")
    .eq("user_id", userId)

  const assetIds = (assets ?? []).map((a: { id: string }) => a.id)

  // 4. Fetch all snapshots for user's assets within the range
  const { data: snapshots } = assetIds.length > 0
    ? await supabase
        .from("asset_snapshots")
        .select("asset_id, value, snapshot_date")
        .in("asset_id", assetIds)
        .gte("snapshot_date", oldestStart)
        .lte("snapshot_date", newestEnd)
        .order("snapshot_date", { ascending: false })
    : { data: [] }

  // 5. Fetch all transactions in the range
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, type, transaction_date, category:transaction_categories(name)")
    .eq("user_id", userId)
    .gte("transaction_date", oldestStart)
    .lte("transaction_date", newestEnd)

  // 6. Build data points per cycle
  const dataPoints: HistoricalDataPoint[] = []

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i]
    const cycleEndStr = format(cycle.end, "yyyy-MM-dd")

    // A. Reconstruct Net Worth: for each asset, take the latest snapshot on or before cycle end
    let netWorth = 0
    for (const asset of assets ?? []) {
      const snap = (snapshots ?? []).find(
        (s: { asset_id: string; snapshot_date: string }) =>
          s.asset_id === asset.id && s.snapshot_date <= cycleEndStr
      )
      if (snap) {
        netWorth += Number(snap.value)
      } else {
        // Asset existed before cycle end but has no snapshot yet — use current_value as fallback
        if (asset.created_at <= cycle.end.toISOString()) {
          netWorth += Number(asset.current_value)
        }
      }
    }

    // B. Cash flow for this cycle
    const cycleStartStr = format(cycle.start, "yyyy-MM-dd")
    const cycleTransactions = (transactions ?? []).filter(
      (t: { transaction_date: string }) =>
        t.transaction_date >= cycleStartStr && t.transaction_date <= cycleEndStr
    )

    const summary = summarizeTransactions(
      cycleTransactions.map((t: any) => ({
        amount: Number(t.amount),
        type: t.type as "income" | "expense",
        transaction_date: t.transaction_date,
        category_id: null,
        created_at: "",
        id: "",
        notes: null,
        title: "",
        user_id: userId,
        category: t.category,
      }))
    )

    // C. Growth % vs previous cycle
    const prevNetWorth = i > 0 ? dataPoints[i - 1].netWorth : 0
    const changePercent =
      prevNetWorth > 0 ? ((netWorth - prevNetWorth) / prevNetWorth) * 100 : 0

    dataPoints.push({
      label: cycle.label,
      netWorth,
      income: summary.income,
      expense: summary.expense,
      surplus: summary.surplus,
      savingsRate: summary.savingsRate,
      changePercent,
      startDate: cycleStartStr,
      endDate: cycleEndStr,
    })
  }

  return dataPoints
}
