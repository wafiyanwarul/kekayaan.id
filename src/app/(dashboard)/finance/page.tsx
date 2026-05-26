import { FinanceClient } from "@/features/finance/components/FinanceClient"
import { createClient } from "@/lib/supabase/server"

export default async function FinancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ""

  const [{ data: transactions }, { data: categories }, { data: cycle }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:transaction_categories(*)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transaction_categories")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("type", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("monthly_cycles")
      .select("start_day,end_day")
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  return (
    <FinanceClient
      userId={userId}
      initialTransactions={(transactions ?? []).map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      }))}
      initialCategories={categories ?? []}
      cycle={cycle ?? { start_day: 25, end_day: 24 }}
    />
  )
}
