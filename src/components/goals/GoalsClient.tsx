"use client"

import { Hammer, Target, TrendingUp } from "lucide-react"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"

export function GoalsClient() {
  const { language, t } = useAppPreferences()
  const cards = {
    id: [
      ["Target-based planning", "Set financial goals with target dates, target values, and progress tracking."],
      ["Progress visibility", "See how monthly surplus and asset growth contribute to each goal."],
      ["Coming soon", "Goal creation, editing, reminders, and dashboard integration are planned next."],
    ],
    en: [
      ["Target-based planning", "Set financial goals with target dates, target values, and progress tracking."],
      ["Progress visibility", "See how monthly surplus and asset growth contribute to each goal."],
      ["Coming soon", "Goal creation, editing, reminders, and dashboard integration are planned next."],
    ],
    ja: [
      ["目標ベースの計画", "目標日、目標金額、進捗状況を管理できるようになります。"],
      ["進捗の可視化", "毎月の黒字や資産成長が各目標にどう貢献するか確認できます。"],
      ["近日対応", "目標作成、編集、リマインダー、ダッシュボード連携を予定しています。"],
    ],
  }[language]
  const icons = [Target, TrendingUp, Hammer]

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("goals.subtitle")}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{t("goals.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("goals.copy")}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Target className="h-7 w-7" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([title, text], index) => {
          const Icon = icons[index]

          return (
            <div key={title} className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
