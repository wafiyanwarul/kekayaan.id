"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AssetListClient } from "@/features/assets/components/AssetListClient"
import { Loader2 } from "lucide-react"

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase
          .from("assets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setAssets(data ?? [])
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

  return <AssetListClient initialAssets={assets} userId={userId} />
}
