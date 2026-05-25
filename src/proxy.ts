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

  // Public routes accessible without a session
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

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
