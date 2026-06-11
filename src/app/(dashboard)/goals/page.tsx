"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GoalsListClient } from "@/features/goals/components/GoalsListClient"
import { getHistoricalData } from "@/features/assets/utils/history"
import { Loader2 } from "lucide-react"

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [userId, setUserId] = useState("")
  const [averageSurplus, setAverageSurplus] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // 1. Fetch user's financial goals
        const { data: goalsData } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setGoals(goalsData ?? [])

        // 2. Fetch history of past 3 cycles and calculate average surplus
        try {
          const historicalData = await getHistoricalData(supabase, user.id, 3)
          if (Array.isArray(historicalData) && historicalData.length > 0) {
            const activeCycles = historicalData.filter(p => (p.income ?? 0) > 0 || (p.expense ?? 0) > 0)
            if (activeCycles.length > 0) {
              const totalSurplus = activeCycles.reduce((sum, p) => sum + (p.surplus ?? 0), 0)
              setAverageSurplus(totalSurplus / activeCycles.length)
            } else {
              setAverageSurplus(historicalData[historicalData.length - 1]?.surplus ?? 0)
            }
          }
        } catch (err) {
          console.error("Failed to calculate average surplus for goals projection:", err)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <GoalsListClient
      initialGoals={goals}
      userId={userId}
      averageSurplus={Math.max(0, averageSurplus)}
    />
  )
}
