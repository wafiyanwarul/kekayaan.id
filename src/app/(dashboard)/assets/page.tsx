import { createClient } from "@/lib/supabase/server"
import { AssetListClient } from "@/features/assets/components/AssetListClient"

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })

  return <AssetListClient initialAssets={assets ?? []} userId={user?.id ?? ""} />
}
