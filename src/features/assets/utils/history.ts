import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getPrisma } from "@/lib/prisma/client"
import { getCycleRange, summarizeTransactions } from "@/features/finance/utils"

export interface HistoricalDataPoint {
  label: string         // e.g. "Mei 26"
  netWorth: number
  income: number
  expense: number
  surplus: number
  savingsRate: number
  changePercent: number // Growth rate vs previous cycle
  startDate: string
  endDate: string
}

export async function getHistoricalData(
  userId: string,
  monthsRange: number = 6
): Promise<HistoricalDataPoint[]> {
  const prisma = getPrisma()

  // 1. Get monthly cycle settings for the user
  const cycleSetting = await prisma.monthlyCycle.findUnique({
    where: { userId },
  })
  const startDay = cycleSetting?.startDay ?? 25
  const endDay = cycleSetting?.endDay ?? 24

  // 2. Generate the last N billing cycles
  const now = new Date()
  const cycles: Array<{ start: Date; end: Date; label: string }> = []
  
  for (let i = 0; i < monthsRange; i++) {
    // Generate a date in the middle of target month to avoid timezone boundary issues
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 15)
    const range = getCycleRange(targetDate, { start_day: startDay, end_day: endDay })
    const label = format(range.end, "MMM yy", { locale: id })
    
    cycles.push({
      start: range.start,
      end: range.end,
      label,
    })
  }
  
  // Sort oldest to newest for chronological chart order
  cycles.reverse()

  // 3. Fetch assets and snapshots
  const assets = await prisma.asset.findMany({
    where: { userId },
    include: {
      snapshots: {
        orderBy: {
          snapshotDate: "desc",
        },
      },
    },
  })

  // 4. Fetch transactions within the history range
  const oldestCycleStart = cycles[0].start
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: oldestCycleStart,
      },
    },
  })

  // 5. Calculate data points for each cycle
  const dataPoints: HistoricalDataPoint[] = []

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i]
    
    // A. Reconstruct Net Worth at the end of the cycle
    let netWorth = 0
    for (const asset of assets) {
      // Find latest snapshot on or before cycle end
      const latestSnapshot = asset.snapshots.find(
        (s: { snapshotDate: Date; value: any }) => new Date(s.snapshotDate) <= cycle.end
      )
      
      if (latestSnapshot) {
        netWorth += Number(latestSnapshot.value)
      } else {
        // Fallback: If asset was created before/during this cycle, use the oldest snapshot or current value
        if (new Date(asset.createdAt) <= cycle.end) {
          const oldestSnapshot = asset.snapshots[asset.snapshots.length - 1]
          netWorth += oldestSnapshot ? Number(oldestSnapshot.value) : Number(asset.currentValue)
        }
      }
    }

    // B. Calculate income/expense for this cycle
    const cycleTransactions = transactions.filter((t: { transactionDate: Date }) => {
      const date = new Date(t.transactionDate)
      return date >= cycle.start && date <= cycle.end
    })

    const summary = summarizeTransactions(
      cycleTransactions.map((t: { amount: any; type: any; transactionDate: any }) => ({
        amount: Number(t.amount),
        type: t.type as "income" | "expense",
        transaction_date: format(t.transactionDate, "yyyy-MM-dd"),
        category_id: null,
        created_at: "",
        id: "",
        notes: null,
        title: "",
        user_id: userId,
      }))
    )

    // C. Calculate growth percent compared to previous cycle in dataPoints
    let changePercent = 0
    if (i > 0) {
      const prevNetWorth = dataPoints[i - 1].netWorth
      changePercent = prevNetWorth > 0 ? ((netWorth - prevNetWorth) / prevNetWorth) * 100 : 0
    } else {
      // If it's the first data point in our array, try to find a previous snapshot/net worth if possible, otherwise default to 0
      changePercent = 0
    }

    dataPoints.push({
      label: cycle.label,
      netWorth,
      income: summary.income,
      expense: summary.expense,
      surplus: summary.surplus,
      savingsRate: summary.savingsRate,
      changePercent,
      startDate: format(cycle.start, "yyyy-MM-dd"),
      endDate: format(cycle.end, "yyyy-MM-dd"),
    })
  }

  return dataPoints;
}
