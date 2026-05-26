import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseConfig } from "@/lib/supabase/env"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin))
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.error("Google OAuth environment variables are missing.")
    return NextResponse.redirect(new URL("/login?error=google_config_missing", requestUrl.origin))
  }

  try {
    // 1. Exchange code for Google ID token directly
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${requestUrl.origin}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error || !tokenData.id_token) {
      console.error("Google token exchange error:", tokenData)
      return NextResponse.redirect(new URL("/login?error=google_token_error", requestUrl.origin))
    }

    const idToken = tokenData.id_token

    // 2. Sign in to Supabase using the Google ID Token
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
          } catch (e) {
            // Ignored in server component/route context
          }
        },
      },
    })

    const { error: signInError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    })

    if (signInError) {
      console.error("Supabase sign in with ID token error:", signInError)
      return NextResponse.redirect(new URL("/login?error=supabase_signin_error", requestUrl.origin))
    }

    // Success -> redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
  } catch (error) {
    console.error("Google Auth Callback Exception:", error)
    return NextResponse.redirect(new URL("/login?error=callback_exception", requestUrl.origin))
  }
}
