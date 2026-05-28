import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseConfig } from "@/lib/supabase/env"
import { getHistoricalData } from "@/features/assets/utils/history"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const monthsParam = requestUrl.searchParams.get("months")
  const months = monthsParam ? parseInt(monthsParam, 10) : 6

  if (isNaN(months) || months <= 0 || months > 36) {
    return NextResponse.json({ error: "Invalid months parameter" }, { status: 400 })
  }

  const { url, key } = getSupabaseConfig()
  const cookieStore = await cookies()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // No-op for read-only auth check in API route
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await getHistoricalData(user.id, months)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Failed to fetch historical dashboard data:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
