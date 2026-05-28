import { createClient } from "@/lib/supabase/server"
import { GoalsListClient } from "@/features/goals/components/GoalsListClient"
import { getHistoricalData } from "@/features/assets/utils/history"

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 1. Fetch user's financial goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // 2. Fetch history of past 3 cycles to calculate average surplus
  let averageSurplus = 0
  try {
    const historicalData = await getHistoricalData(supabase, user.id, 3)
    if (Array.isArray(historicalData) && historicalData.length > 0) {
      const totalSurplus = historicalData.reduce((sum, p) => sum + (p.surplus ?? 0), 0)
      averageSurplus = totalSurplus / historicalData.length
    }
  } catch (err) {
    console.error("Failed to calculate average surplus for goals projection:", err)
  }

  return (
    <GoalsListClient
      initialGoals={goals ?? []}
      userId={user.id}
      averageSurplus={Math.max(0, averageSurplus)}
    />
  )
}
