"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type AppLanguage = "id" | "en" | "ja"
export type AppTheme = "dark" | "light"

type TranslationKey =
  | "app.tagline"
  | "nav.dashboard"
  | "nav.assets"
  | "nav.goals"
  | "nav.finance"
  | "nav.settings"
  | "topbar.theme"
  | "topbar.language"
  | "topbar.logout"
  | "dashboard.welcome"
  | "dashboard.synced"
  | "dashboard.totalWealth"
  | "dashboard.liquidAssets"
  | "dashboard.nonLiquidAssets"
  | "dashboard.liquidRatio"
  | "dashboard.assetCount"
  | "dashboard.quickCash"
  | "dashboard.propertyGoods"
  | "dashboard.fromTotal"
  | "dashboard.wealthSection"
  | "goals.title"
  | "goals.subtitle"
  | "goals.copy"
  | "settings.title"
  | "settings.subtitle"
  | "settings.copy"
  | "settings.maintenance"
  | "settings.upgrading"
  | "settings.available"
  | "settings.maintenanceOn"
  | "settings.noUpgrade"
  | "settings.upgradeOn"
  | "settings.note"
  | "settings.noteCopy"

type AppPreferencesContextValue = {
  language: AppLanguage
  originalNameLabel: string
  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
  t: (key: TranslationKey) => string
  theme: AppTheme
  translateName: (name: string) => string
}

const LANGUAGE_KEY = "kekayaan-id-language"
const THEME_KEY = "kekayaan-id-theme"

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  id: {
    "app.tagline": "wealth cockpit",
    "nav.dashboard": "Dashboard",
    "nav.assets": "Aset",
    "nav.goals": "Goals",
    "nav.finance": "Keuangan",
    "nav.settings": "Pengaturan",
    "topbar.theme": "Tema",
    "topbar.language": "Bahasa",
    "topbar.logout": "Keluar",
    "dashboard.welcome": "Selamat datang kembali",
    "dashboard.synced": "Kokpit kekayaanmu sudah tersinkron dengan data aset dan keuangan terbaru.",
    "dashboard.totalWealth": "Total Kekayaan",
    "dashboard.liquidAssets": "Aset Likuid",
    "dashboard.nonLiquidAssets": "Aset Non-Likuid",
    "dashboard.liquidRatio": "Rasio Likuid",
    "dashboard.assetCount": "aset tercatat",
    "dashboard.quickCash": "Bisa dicairkan cepat",
    "dashboard.propertyGoods": "Properti & barang",
    "dashboard.fromTotal": "Dari total aset",
    "dashboard.wealthSection": "Total Kekayaan",
    "goals.title": "Goal Planner is in development",
    "goals.subtitle": "Goals",
    "goals.copy": "This section will help you plan future milestones, track target amounts, and connect savings progress with your monthly cash flow.",
    "settings.title": "Operational Control Center",
    "settings.subtitle": "System settings",
    "settings.copy": "These controls are prepared for future deployment and server orchestration workflows.",
    "settings.maintenance": "Maintenance Mode",
    "settings.upgrading": "Upgrading System",
    "settings.available": "Application is available",
    "settings.maintenanceOn": "Maintenance mode prepared",
    "settings.noUpgrade": "No upgrade in progress",
    "settings.upgradeOn": "Upgrade flow prepared",
    "settings.note": "Integration note",
    "settings.noteCopy": "Current toggles are local UI controls. The next implementation step is wiring them to a persistent settings table, then enforcing the state in Proxy/server middleware and deployment hooks.",
  },
  en: {
    "app.tagline": "wealth cockpit",
    "nav.dashboard": "Dashboard",
    "nav.assets": "Assets",
    "nav.goals": "Goals",
    "nav.finance": "Finance",
    "nav.settings": "Settings",
    "topbar.theme": "Theme",
    "topbar.language": "Language",
    "topbar.logout": "Logout",
    "dashboard.welcome": "Welcome back",
    "dashboard.synced": "Your wealth cockpit is synced with the latest asset and finance data.",
    "dashboard.totalWealth": "Total Wealth",
    "dashboard.liquidAssets": "Liquid Assets",
    "dashboard.nonLiquidAssets": "Non-Liquid Assets",
    "dashboard.liquidRatio": "Liquid Ratio",
    "dashboard.assetCount": "assets recorded",
    "dashboard.quickCash": "Available quickly",
    "dashboard.propertyGoods": "Property & goods",
    "dashboard.fromTotal": "From total assets",
    "dashboard.wealthSection": "Total Wealth",
    "goals.title": "Goal Planner is in development",
    "goals.subtitle": "Goals",
    "goals.copy": "This section will help you plan future milestones, track target amounts, and connect savings progress with your monthly cash flow.",
    "settings.title": "Operational Control Center",
    "settings.subtitle": "System settings",
    "settings.copy": "These controls are prepared for future deployment and server orchestration workflows.",
    "settings.maintenance": "Maintenance Mode",
    "settings.upgrading": "Upgrading System",
    "settings.available": "Application is available",
    "settings.maintenanceOn": "Maintenance mode prepared",
    "settings.noUpgrade": "No upgrade in progress",
    "settings.upgradeOn": "Upgrade flow prepared",
    "settings.note": "Integration note",
    "settings.noteCopy": "Current toggles are local UI controls. The next implementation step is wiring them to a persistent settings table, then enforcing the state in Proxy/server middleware and deployment hooks.",
  },
  ja: {
    "app.tagline": "資産コックピット",
    "nav.dashboard": "ダッシュボード",
    "nav.assets": "資産",
    "nav.goals": "目標",
    "nav.finance": "家計",
    "nav.settings": "設定",
    "topbar.theme": "テーマ",
    "topbar.language": "言語",
    "topbar.logout": "ログアウト",
    "dashboard.welcome": "おかえりなさい",
    "dashboard.synced": "資産コックピットは最新の資産と家計データに同期されています。",
    "dashboard.totalWealth": "総資産",
    "dashboard.liquidAssets": "流動資産",
    "dashboard.nonLiquidAssets": "非流動資産",
    "dashboard.liquidRatio": "流動比率",
    "dashboard.assetCount": "件の資産",
    "dashboard.quickCash": "すぐに現金化可能",
    "dashboard.propertyGoods": "不動産・所有物",
    "dashboard.fromTotal": "総資産に対する割合",
    "dashboard.wealthSection": "総資産",
    "goals.title": "目標プランナーは開発中です",
    "goals.subtitle": "目標",
    "goals.copy": "このセクションでは、将来の目標、目標金額、毎月のキャッシュフローと貯蓄進捗を管理できるようになります。",
    "settings.title": "運用コントロールセンター",
    "settings.subtitle": "システム設定",
    "settings.copy": "これらのコントロールは、将来のデプロイとサーバー運用ワークフローのために準備されています。",
    "settings.maintenance": "メンテナンスモード",
    "settings.upgrading": "システムアップグレード",
    "settings.available": "アプリは利用可能です",
    "settings.maintenanceOn": "メンテナンスモード準備中",
    "settings.noUpgrade": "アップグレードはありません",
    "settings.upgradeOn": "アップグレードフロー準備中",
    "settings.note": "連携メモ",
    "settings.noteCopy": "現在のトグルはローカルUIコントロールです。次の実装では永続的な設定テーブルに接続し、Proxyやサーバーミドルウェア、デプロイフックで状態を反映します。",
  },
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null)

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("id")
  const [theme, setThemeState] = useState<AppTheme>("dark")

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null
    const storedTheme = localStorage.getItem(THEME_KEY) as AppTheme | null

    if (storedLanguage && ["id", "en", "ja"].includes(storedLanguage)) setLanguageState(storedLanguage)
    if (storedTheme && ["dark", "light"].includes(storedTheme)) setThemeState(storedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language
    localStorage.setItem(THEME_KEY, theme)
    translateStaticText(language)

    const observer = new MutationObserver(() => translateStaticText(language))
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [language, theme])

  function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage)
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
  }

  function setTheme(nextTheme: AppTheme) {
    setThemeState(nextTheme)
  }

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      language,
      originalNameLabel: language === "ja" ? "original" : "original",
      setLanguage,
      setTheme,
      t: (key) => translations[language][key],
      theme,
      translateName: (name) => {
        if (language !== "ja") return name
        return toJapaneseDisplayName(name)
      },
    }),
    [language, theme]
  )

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext)
  if (!context) throw new Error("useAppPreferences must be used inside AppPreferencesProvider")
  return context
}

function toJapaneseDisplayName(name: string) {
  const normalized = name.toLowerCase()

  if (normalized.includes("wafiyanwarulhikam")) return "ワフィ・アンワルル・ヒカム"

  return normalized
    .replace(/[0-9]/g, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

const staticTextCatalog = [
  { id: "Total Kekayaan", en: "Total Wealth", ja: "総資産" },
  { id: "Aset Likuid", en: "Liquid Assets", ja: "流動資産" },
  { id: "Aset Non-Likuid", en: "Non-Liquid Assets", ja: "非流動資産" },
  { id: "Rasio Likuid", en: "Liquid Ratio", ja: "流動比率" },
  { id: "Bisa dicairkan cepat", en: "Available quickly", ja: "すぐに現金化可能" },
  { id: "Properti & barang", en: "Property & goods", ja: "不動産・所有物" },
  { id: "Dari total aset", en: "From total assets", ja: "総資産に対する割合" },
  { id: "Alokasi Aset", en: "Asset Allocation", ja: "資産配分" },
  { id: "Likuid", en: "Liquid", ja: "流動" },
  { id: "Non-Likuid", en: "Non-Liquid", ja: "非流動" },
  { id: "Keuangan Bulan Ini", en: "This Month's Finance", ja: "今月の家計" },
  { id: "Pemasukan", en: "Income", ja: "収入" },
  { id: "Pengeluaran", en: "Expense", ja: "支出" },
  { id: "Surplus", en: "Surplus", ja: "黒字" },
  { id: "Savings Rate", en: "Savings Rate", ja: "貯蓄率" },
  { id: "Siklus aktif", en: "Active cycle", ja: "有効なサイクル" },
  { id: "Transaksi", en: "Transaction", ja: "取引" },
  { id: "Riwayat Transaksi", en: "Transaction History", ja: "取引履歴" },
  { id: "Semua", en: "All", ja: "すべて" },
  { id: "Harian", en: "Daily", ja: "日別" },
  { id: "Bulanan", en: "Monthly", ja: "月別" },
  { id: "Tahunan", en: "Yearly", ja: "年別" },
  { id: "Item", en: "Item", ja: "項目" },
  { id: "Import Mutasi PDF", en: "Import Bank Statement PDF", ja: "明細PDFを取り込む" },
  { id: "Belum aktif", en: "Not active yet", ja: "未有効" },
  { id: "Pengaturan", en: "Settings", ja: "設定" },
  { id: "Keuangan", en: "Finance", ja: "家計" },
  { id: "Aset", en: "Assets", ja: "資産" },
] satisfies Array<Record<AppLanguage, string>>

function translateStaticText(language: AppLanguage) {
  if (typeof document === "undefined" || language === "id") return

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text)
  }

  nodes.forEach((node) => {
    const value = node.nodeValue?.trim()
    if (!value) return
    const translated = translateStaticPhrase(value, language)
    if (!translated || node.nodeValue === translated) return

    node.nodeValue = node.nodeValue?.replace(value, translated) ?? translated
  })
}

function translateStaticPhrase(value: string, language: AppLanguage) {
  const entry = staticTextCatalog.find((item) => item.id === value || item.en === value || item.ja === value)
  return entry?.[language]
}
