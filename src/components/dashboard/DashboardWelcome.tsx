"use client"

import { CircleDollarSign } from "lucide-react"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"

export function DashboardWelcome({ email }: { email?: string | null }) {
  const { language, originalNameLabel, t, translateName } = useAppPreferences()
  const originalName = email?.split("@")[0] ?? "there"
  const displayName = translateName(originalName)

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.welcome")}</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Hi, {displayName}</h2>
          {language === "ja" && displayName !== originalName && (
            <p className="mt-1 text-xs text-muted-foreground">{originalNameLabel}: {originalName}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.synced")}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
          <CircleDollarSign className="h-7 w-7" />
        </div>
      </div>
    </section>
  )
}
