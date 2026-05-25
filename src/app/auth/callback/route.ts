import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "@/lib/supabase/env"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  const { url, key } = getSupabaseConfig()
  const cookieStore = await cookies()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })

  // Handle PKCE code exchange (from email confirmation / magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If type is recovery, redirect to reset-password page
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", requestUrl.origin))
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Handle token_hash (from email OTP links — recovery, magic link, etc.)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "magiclink" | "email" | "invite" | "signup",
      token_hash,
    })
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", requestUrl.origin))
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_error", requestUrl.origin)
  )
}
