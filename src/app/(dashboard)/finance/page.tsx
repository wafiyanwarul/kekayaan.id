"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceClient } from "@/features/finance/components/FinanceClient"
import { Loader2 } from "lucide-react"

export default function FinancePage() {
  const [userId, setUserId] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cycle, setCycle] = useState<any>({ start_day: 25, end_day: 24 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const [{ data: txs }, { data: cats }, { data: cyc }] = await Promise.all([
          supabase
            .from("transactions")
            .select("*, category:transaction_categories(*)")
            .eq("user_id", user.id)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("transaction_categories")
            .select("*")
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .order("type", { ascending: false })
            .order("name", { ascending: true }),
          supabase
            .from("monthly_cycles")
            .select("start_day,end_day")
            .eq("user_id", user.id)
            .maybeSingle(),
        ])
        setTransactions((txs ?? []).map((t) => ({ ...t, amount: Number(t.amount) })))
        setCategories(cats ?? [])
        if (cyc) setCycle(cyc)
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
    <FinanceClient
      userId={userId}
      initialTransactions={transactions}
      initialCategories={categories}
      cycle={cycle}
    />
  )
}
