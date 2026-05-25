"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CloudCog,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const MAINTENANCE_KEY = "kekayaan-id-maintenance-mode"
const UPGRADE_KEY = "kekayaan-id-upgrading-system"

export function SettingsPanel() {
  const { t } = useAppPreferences()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [upgradingSystem, setUpgradingSystem] = useState(false)

  useEffect(() => {
    setMaintenanceMode(localStorage.getItem(MAINTENANCE_KEY) === "true")
    setUpgradingSystem(localStorage.getItem(UPGRADE_KEY) === "true")
  }, [])

  function toggleMaintenance(value: boolean) {
    setMaintenanceMode(value)
    localStorage.setItem(MAINTENANCE_KEY, String(value))
  }

  function toggleUpgrade(value: boolean) {
    setUpgradingSystem(value)
    localStorage.setItem(UPGRADE_KEY, String(value))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.subtitle")}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{t("settings.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("settings.copy")}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <CloudCog className="h-7 w-7" />
          </div>
        </div>
      </section>

      {/* Change Password Section */}
      <ChangePasswordCard />

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingToggleCard
          checked={maintenanceMode}
          description="Prepare a future SaaS-wide maintenance gate so deployments, migrations, and urgent fixes can happen with clearer user messaging."
          icon={Wrench}
          label={t("settings.maintenance")}
          onChange={toggleMaintenance}
          statusText={maintenanceMode ? t("settings.maintenanceOn") : t("settings.available")}
          tone="warning"
        />
        <SettingToggleCard
          checked={upgradingSystem}
          description="Mark the app as undergoing an upgrade. In the future, this can integrate with deployment pipelines and server-side release guards."
          icon={ShieldCheck}
          label={t("settings.upgrading")}
          onChange={toggleUpgrade}
          statusText={upgradingSystem ? t("settings.upgradeOn") : t("settings.noUpgrade")}
          tone="info"
        />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/15 p-2 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t("settings.note")}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("settings.noteCopy")}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Change Password Card ───────────────────────────────────────────────────

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("Tidak dapat menemukan akun.")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error("Password saat ini salah.")

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message)

      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Ubah Password</h3>
          <p className="text-sm text-muted-foreground">Perbarui password akun kamu</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        {/* Current password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Password Saat Ini</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Password saat ini"
              required
              className="w-full px-4 py-2.5 pr-11 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Password Baru</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              required
              minLength={6}
              className="w-full px-4 py-2.5 pr-11 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Konfirmasi Password Baru</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              className={cn(
                "w-full px-4 py-2.5 pr-11 rounded-lg bg-[#0f1117] border text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition text-sm",
                confirmPassword && newPassword !== confirmPassword
                  ? "border-red-500/50 focus:ring-red-500"
                  : "border-[#1e2235] focus:ring-indigo-500"
              )}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-400">Password tidak cocok</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password berhasil diubah!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Password Baru"
          )}
        </button>
      </form>
    </section>
  )
}

// ── Toggle Card ────────────────────────────────────────────────────────────

function SettingToggleCard({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
  statusText,
  tone,
}: {
  checked: boolean
  description: string
  icon: typeof Wrench
  label: string
  onChange: (value: boolean) => void
  statusText: string
  tone: "info" | "warning"
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "rounded-lg p-2",
            tone === "warning" ? "bg-amber-500/15 text-amber-300" : "bg-indigo-500/15 text-indigo-300"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative h-7 w-14 shrink-0 rounded-full border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-background",
            checked ? "border-emerald-400 bg-emerald-600" : "border-slate-500 bg-slate-700"
          )}
        >
          <span className={cn(
            "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-7" : "translate-x-0"
          )} />
        </button>
      </div>
      <div className={cn(
        "mt-5 rounded-lg border px-3 py-2 text-sm font-medium",
        checked ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-[#1e2235] bg-[#0f1117] text-slate-400"
      )}>
        {statusText}
      </div>
    </div>
  )
}
