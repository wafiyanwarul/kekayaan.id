"use client"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Languages, LogOut, Moon, Sun } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAppPreferences, type AppLanguage } from "@/components/providers/AppPreferencesProvider"

const titleKeys: Record<string, Parameters<ReturnType<typeof useAppPreferences>["t"]>[0]> = {
  "/dashboard": "nav.dashboard",
  "/assets": "nav.assets",
  "/goals": "nav.goals",
  "/finance": "nav.finance",
  "/settings": "nav.settings",
}

function getTodayLabel(language: AppLanguage) {
  const locale = language === "ja" ? "ja-JP" : language === "en" ? "en-US" : "id-ID"

  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, setTheme, t, theme } = useAppPreferences()
  const base = "/" + pathname.split("/")[1]
  const [todayLabel, setTodayLabel] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setTodayLabel(getTodayLabel(language))
  }, [language])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="border-b bg-card px-4 md:px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* App logo on mobile instead of menu toggle */}
        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10 overflow-hidden shrink-0">
          <img src="/android-chrome-192x192.png" alt="logo" className="h-6 w-6 object-contain" />
        </div>
        <h1 className="text-base font-semibold">{t(titleKeys[base] ?? "nav.dashboard")}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e2235] text-muted-foreground transition hover:bg-white/5 hover:text-foreground cursor-pointer"
          title={t("topbar.theme")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <label className="relative inline-flex items-center">
          <Languages className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as AppLanguage)}
            className="h-9 rounded-lg border border-[#1e2235] bg-card pl-9 pr-8 text-xs font-semibold text-foreground outline-none transition hover:bg-white/5 cursor-pointer"
            title={t("topbar.language")}
          >
            <option value="id">ID</option>
            <option value="en">EN</option>
            <option value="ja">日本語</option>
          </select>
        </label>

        <span className="hidden text-xs text-muted-foreground lg:inline">{todayLabel}</span>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 dark:border-red-500/20 px-3 text-xs font-semibold text-red-600 dark:text-red-300 transition hover:bg-red-500/10 dark:hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >

          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{loggingOut ? "..." : t("topbar.logout")}</span>
        </button>
      </div>
    </header>
  )
}
