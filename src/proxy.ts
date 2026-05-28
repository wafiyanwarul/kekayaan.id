import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase/env"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { key, url } = getSupabaseConfig()

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Fetch maintenance mode state from database
  const { data: settingsData } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "maintenance")
    .maybeSingle()

  const maintenance = settingsData?.value as {
    is_active?: boolean
    type?: string
    scheduled_start?: string
    scheduled_end?: string
  } | undefined
  const isMaintenanceActive = maintenance?.is_active || (
    maintenance?.type === "scheduled" &&
    maintenance?.scheduled_start &&
    maintenance?.scheduled_end &&
    Date.now() >= new Date(maintenance.scheduled_start).getTime() &&
    Date.now() <= new Date(maintenance.scheduled_end).getTime()
  )

  // Public routes accessible without a session
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth", "/verify-otp", "/maintenance", "/api/auth"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If maintenance is active, restrict access for non-admin users
  if (isMaintenanceActive && pathname !== "/maintenance") {
    let isAdmin = false
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
      isAdmin = roleData?.role === "admin" || roleData?.role === "super_admin"
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/maintenance", request.url))
    }
  }

  // If maintenance is NOT active but they try to visit /maintenance, redirect them away
  if (!isMaintenanceActive && pathname === "/maintenance") {
    return NextResponse.redirect(new URL(user ? "/dashboard" : "/login", request.url))
  }

  // Auth-only routes (logged-in users should be redirected away)
  const authOnlyRoutes = ["/login", "/register", "/forgot-password"]
  const isAuthOnlyRoute = authOnlyRoutes.some((route) => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
