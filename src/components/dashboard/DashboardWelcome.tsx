"use client"

import { CircleDollarSign } from "lucide-react"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"

export function DashboardWelcome({ email }: { email?: string | null }) {
  const { language, originalNameLabel, t, translateName } = useAppPreferences()
  const originalName = email?.split("@")[0] ?? "there"
  const displayName = translateName(originalName)

  return (
    <section className="relative rounded-xl border bg-card p-5">
      <div className="pr-14 sm:pr-16">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.welcome")}</p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white break-words">Hi, {displayName}</h2>
        {language === "ja" && displayName !== originalName && (
          <p className="mt-1 text-xs text-muted-foreground">{originalNameLabel}: {originalName}</p>
        )}
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("dashboard.synced")}</p>
      </div>
      <div className="absolute top-5 right-5 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 shrink-0">
        <CircleDollarSign className="h-5.5 w-5.5 sm:h-7 sm:w-7" />
      </div>
    </section>
  )
}
