"use client"

import { useEffect, useState, useMemo } from "react"
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
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Clock,
  Check,
  X,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const MAINTENANCE_KEY = "kekayaan-id-maintenance-mode"
const UPGRADE_KEY = "kekayaan-id-upgrading-system"

interface UserRoleData {
  user_id: string
  email: string
  role: string
  created_at: string
}

interface CategoryData {
  id: string
  name: string
  type: "income" | "expense"
  user_id: string | null
}

interface RoleChangeRequest {
  id: string
  requested_by: string
  user_id: string
  requested_role: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export function SettingsPanel() {
  const { t } = useAppPreferences()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("user")
  const [loadingRole, setLoadingRole] = useState(true)

  // System settings states
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceData, setMaintenanceData] = useState<any>(null)
  const [upgradingSystem, setUpgradingSystem] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [pendingToggleType, setPendingToggleType] = useState<"maintenance" | "upgrade" | null>(null)
  const [pendingToggleValue, setPendingToggleValue] = useState<boolean>(false)

  // Maintenance activation form states
  const [showMaintenanceOnModal, setShowMaintenanceOnModal] = useState(false)
  const [maintenanceType, setMaintenanceType] = useState<"instant" | "scheduled">("instant")
  const [scheduledStart, setScheduledStart] = useState("")
  const [scheduledEnd, setScheduledEnd] = useState("")
  const [onDescription, setOnDescription] = useState("")

  // Maintenance deactivation form states
  const [showMaintenanceOffModal, setShowMaintenanceOffModal] = useState(false)
  const [offDescription, setOffDescription] = useState("")
  const [confirmationText, setConfirmationText] = useState("")

  const [maintenanceActionLoading, setMaintenanceActionLoading] = useState(false)

  // Categories management states
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [catActionLoading, setCatActionLoading] = useState<string | null>(null)

  // Master Users management states
  const [users, setUsers] = useState<UserRoleData[]>([])
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null)

  // User search & pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Custom alert & confirmation modals states
  const [successModal, setSuccessModal] = useState<{ title: string; message: string } | null>(null)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null)
  const [showAddCatConfirm, setShowAddCatConfirm] = useState(false)
  const [showDeleteCatConfirm, setShowDeleteCatConfirm] = useState<{ id: string; name: string } | null>(null)
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState<{ userId: string; email: string; role: string } | null>(null)
  const [showApprovalConfirm, setShowApprovalConfirm] = useState<{ requestId: string; email: string; decision: "approved" | "rejected" } | null>(null)

  const supabase = createClient()

  async function fetchMaintenanceStatus() {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle()

    if (data && data.value) {
      const val = data.value as any
      setMaintenanceData(val)
      const hasConfig = val.is_active || val.scheduled_start !== null
      setMaintenanceMode(hasConfig)
    }
  }

  // Fetch current user and their role on mount
  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()
        if (data) {
          setUserRole(data.role)
        }
      }
      setLoadingRole(false)
    }

    initUser()
    fetchMaintenanceStatus()
    setUpgradingSystem(localStorage.getItem(UPGRADE_KEY) === "true")
  }, [])

  // Fetch lists for Admin/Super Admin
  useEffect(() => {
    if (userRole === "admin" || userRole === "super_admin") {
      fetchCategories()
      fetchUsersAndRequests()
    }
  }, [userRole])

  async function fetchCategories() {
    setLoadingCategories(true)
    const { data, error } = await supabase
      .from("transaction_categories")
      .select("*")
      .order("name", { ascending: true })
    
    if (!error && data) {
      setCategories(data)
    }
    setLoadingCategories(false)
  }

  async function fetchUsersAndRequests() {
    setLoadingUsers(true)
    const [usersRes, requestsRes] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("role_change_requests").select("*")
    ])

    if (!usersRes.error && usersRes.data) {
      setUsers(usersRes.data)
    }
    if (!requestsRes.error && requestsRes.data) {
      setRoleRequests(requestsRes.data)
    }
    setLoadingUsers(false)
  }

  // Dynamic status text for maintenance mode toggle
  const maintenanceStatusText = useMemo(() => {
    if (!maintenanceData || (!maintenanceData.is_active && !maintenanceData.scheduled_start)) {
      return "Sistem Berjalan Normal (Tersedia)"
    }
    if (maintenanceData.type === "instant") {
      return "Pemeliharaan Instan Aktif (Akses Dikunci)"
    }
    
    // Scheduled maintenance
    const now = Date.now()
    const start = new Date(maintenanceData.scheduled_start).getTime()
    const end = new Date(maintenanceData.scheduled_end).getTime()
    
    if (now < start) {
      const diffMin = Math.round((start - now) / 60000)
      return `Pemeliharaan Terjadwal (Mulai dalam ${diffMin} menit)`
    }
    if (now >= start && now <= end) {
      const diffMin = Math.round((end - now) / 60000)
      return `Sedang Berjalan (Selesai dalam ${diffMin} menit)`
    }
    return "Jadwal Selesai (Menunggu Laporan & Penutupan Manual)"
  }, [maintenanceData])

  // Categories split (income/expense)
  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === "income"),
    [categories]
  )

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === "expense"),
    [categories]
  )

  // User search, sorting & pagination memo
  const filteredAndSortedUsers = useMemo(() => {
    const rolePriority: Record<string, number> = {
      super_admin: 1,
      admin: 2,
      user: 3
    }

    // First filter by search term
    const filtered = users.filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Then sort by role priority, and then email alphabetically
    return filtered.sort((a, b) => {
      const priorityA = rolePriority[a.role] || 99
      const priorityB = rolePriority[b.role] || 99
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return a.email.localeCompare(b.email)
    })
  }, [users, searchTerm])

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedUsers, currentPage])

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // System settings triggers
  function handleToggleClick(type: "maintenance" | "upgrade", currentValue: boolean) {
    if (type === "maintenance") {
      if (currentValue) {
        setConfirmationText("")
        setOffDescription("")
        setShowMaintenanceOffModal(true)
      } else {
        setOnDescription("")
        setMaintenanceType("instant")
        const now = new Date()
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
        const formatLocal = (d: Date) => {
          const pad = (n: number) => n.toString().padStart(2, '0')
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        setScheduledStart(formatLocal(now))
        setScheduledEnd(formatLocal(oneHourLater))
        setShowMaintenanceOnModal(true)
      }
    } else {
      setPendingToggleType("upgrade")
      setPendingToggleValue(!currentValue)
      setShowWarningModal(true)
    }
  }

  async function handleActivateMaintenance(e: React.FormEvent) {
    e.preventDefault()
    if (maintenanceType === "scheduled") {
      if (!scheduledStart || !scheduledEnd) {
        setErrorModal({ title: "Jadwal Tidak Valid", message: "Waktu mulai dan selesai wajib diisi." })
        return
      }
      if (new Date(scheduledStart).getTime() >= new Date(scheduledEnd).getTime()) {
        setErrorModal({ title: "Jadwal Tidak Valid", message: "Waktu selesai harus setelah waktu mulai." })
        return
      }
    }
    if (!onDescription.trim() || onDescription.trim().length < 10) {
      setErrorModal({ title: "Deskripsi Kurang Lengkap", message: "Deskripsi rencana pemeliharaan wajib diisi minimal 10 karakter." })
      return
    }

    setMaintenanceActionLoading(true)

    const payload = {
      is_active: maintenanceType === "instant",
      type: maintenanceType,
      scheduled_start: maintenanceType === "scheduled" ? new Date(scheduledStart).toISOString() : null,
      scheduled_end: maintenanceType === "scheduled" ? new Date(scheduledEnd).toISOString() : null,
      active_since: maintenanceType === "instant" ? new Date().toISOString() : null,
      description: onDescription.trim()
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert({
        key: "maintenance",
        value: payload,
        updated_at: new Date().toISOString()
      })

    setMaintenanceActionLoading(false)

    if (error) {
      setErrorModal({ title: "Gagal Mengaktifkan Pemeliharaan", message: error.message })
    } else {
      setShowMaintenanceOnModal(false)
      fetchMaintenanceStatus()
      setSuccessModal({
        title: "Mode Pemeliharaan Diaktifkan",
        message: maintenanceType === "instant" 
          ? "Sistem sekarang dalam mode pemeliharaan instan. Semua user biasa akan segera dialihkan."
          : `Sistem dijadwalkan untuk pemeliharaan pada ${new Date(scheduledStart).toLocaleString("id-ID")} WIB.`
      })
    }
  }

  async function handleDeactivateMaintenance(e: React.FormEvent) {
    e.preventDefault()
    if (confirmationText !== "maintenance-well-done") {
      setErrorModal({ title: "Konfirmasi Salah", message: "Silakan ketik 'maintenance-well-done' secara tepat untuk konfirmasi." })
      return
    }
    if (!offDescription.trim() || offDescription.trim().length < 10) {
      setErrorModal({ title: "Laporan Kurang Lengkap", message: "Laporan hasil pemeliharaan wajib diisi minimal 10 karakter." })
      return
    }

    setMaintenanceActionLoading(true)

    const startedAt = maintenanceData?.active_since || maintenanceData?.scheduled_start || new Date().toISOString()
    const endedAt = new Date().toISOString()
    const durationSeconds = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000))

    const { error: logError } = await supabase
      .from("maintenance_logs")
      .insert({
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        description: offDescription.trim(),
        performed_by: currentUser.id
      })

    if (logError) {
      setMaintenanceActionLoading(false)
      setErrorModal({ title: "Gagal Menyimpan Log Pemeliharaan", message: logError.message })
      return
    }

    const resetPayload = {
      is_active: false,
      type: "instant",
      scheduled_start: null,
      scheduled_end: null,
      active_since: null,
      description: null
    }

    const { error: settingsError } = await supabase
      .from("system_settings")
      .upsert({
        key: "maintenance",
        value: resetPayload,
        updated_at: new Date().toISOString()
      })

    setMaintenanceActionLoading(false)

    if (settingsError) {
      setErrorModal({ title: "Gagal Menonaktifkan Pemeliharaan", message: settingsError.message })
    } else {
      setShowMaintenanceOffModal(false)
      fetchMaintenanceStatus()
      setSuccessModal({
        title: "Mode Pemeliharaan Dinonaktifkan",
        message: "Sistem berhasil dinonaktifkan dari mode pemeliharaan dan kembali normal untuk seluruh user. Log audit pemeliharaan telah berhasil disimpan."
      })
    }
  }

  function confirmToggleChange() {
    if (pendingToggleType === "upgrade") {
      setUpgradingSystem(pendingToggleValue)
      localStorage.setItem(UPGRADE_KEY, String(pendingToggleValue))
      setSuccessModal({
        title: "Peningkatan Diperbarui",
        message: `Upgrading System berhasil diubah menjadi ${pendingToggleValue ? "AKTIF" : "NONAKTIF"} secara lokal.`
      })
    }
    setShowWarningModal(false)
    setPendingToggleType(null)
  }

  // Categories handlers
  function triggerAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setShowAddCatConfirm(true)
  }

  async function confirmAddCategory() {
    setShowAddCatConfirm(false)
    setCatActionLoading("add")

    const { error } = await supabase
      .from("transaction_categories")
      .insert({
        name: newCatName.trim(),
        type: newCatType,
        user_id: null
      })

    if (error) {
      setErrorModal({ title: "Gagal Menambah Kategori", message: error.message })
    } else {
      setSuccessModal({
        title: "Kategori Ditambahkan",
        message: `Kategori global "${newCatName.trim()}" (${newCatType === "income" ? "Pemasukan" : "Pengeluaran"}) berhasil dibuat.`
      })
      setNewCatName("")
      fetchCategories()
    }
    setCatActionLoading(null)
  }

  async function confirmDeleteCategory() {
    if (!showDeleteCatConfirm) return
    const { id, name } = showDeleteCatConfirm
    setShowDeleteCatConfirm(null)
    setCatActionLoading(`delete-${id}`)

    const { error } = await supabase
      .from("transaction_categories")
      .delete()
      .eq("id", id)

    if (error) {
      setErrorModal({
        title: "Gagal Menghapus Kategori",
        message: `Kategori "${name}" tidak bisa dihapus. Kemungkinan karena kategori ini masih direferensikan oleh data transaksi aktif. Detail: ${error.message}`
      })
    } else {
      setSuccessModal({
        title: "Kategori Dihapus",
        message: `Kategori global "${name}" berhasil dihapus dari sistem.`
      })
      fetchCategories()
    }
    setCatActionLoading(null)
  }

  // Users & Roles handlers
  async function confirmSuperAdminChangeRole() {
    if (!showRoleChangeConfirm) return
    const { userId, email, role } = showRoleChangeConfirm
    setShowRoleChangeConfirm(null)
    setUserActionLoading(userId)

    const { error } = await supabase
      .from("user_roles")
      .update({ role })
      .eq("user_id", userId)

    if (error) {
      setErrorModal({ title: "Gagal Mengubah Role", message: error.message })
    } else {
      setSuccessModal({
        title: "Role Diperbarui",
        message: `Role untuk ${email} berhasil diubah menjadi ${role.toUpperCase()}.`
      })
      fetchUsersAndRequests()
    }
    setUserActionLoading(null)
  }

  async function handleAdminRequestPromotion(targetUserId: string, targetEmail: string) {
    setUserActionLoading(targetUserId)
    const existing = roleRequests.find(r => r.user_id === targetUserId && r.status === "pending")
    if (existing) {
      setErrorModal({
        title: "Pengajuan Ganda",
        message: `Pengangkatan role untuk ${targetEmail} saat ini sedang berstatus pending menunggu persetujuan.`
      })
      setUserActionLoading(null)
      return
    }

    const { error } = await supabase
      .from("role_change_requests")
      .insert({
        requested_by: currentUser.id,
        user_id: targetUserId,
        requested_role: "admin",
        status: "pending"
      })

    if (error) {
      setErrorModal({ title: "Gagal Mengajukan Role", message: error.message })
    } else {
      setSuccessModal({
        title: "Pengajuan Dikirim",
        message: `Permintaan promosi ${targetEmail} menjadi ADMIN telah berhasil diajukan ke Super Admin.`
      })
      fetchUsersAndRequests()
    }
    setUserActionLoading(null)
  }

  async function confirmProcessApproval() {
    if (!showApprovalConfirm) return
    const { requestId, email, decision } = showApprovalConfirm
    setShowApprovalConfirm(null)
    setUserActionLoading(`approve-${requestId}`)

    const { error } = await supabase
      .from("role_change_requests")
      .update({ status: decision })
      .eq("id", requestId)

    if (error) {
      setErrorModal({ title: "Gagal Memproses Approval", message: error.message })
    } else {
      setSuccessModal({
        title: decision === "approved" ? "Pengajuan Disetujui" : "Pengajuan Ditolak",
        message: `Permintaan pengangkatan role untuk ${email} telah berhasil ${decision === "approved" ? "DISETUJUI (Sekarang menjadi ADMIN)" : "DITOLAK"}.`
      })
      fetchUsersAndRequests()
    }
    setUserActionLoading(null)
  }

  if (loadingRole) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdminOrSuper = userRole === "admin" || userRole === "super_admin"

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("settings.subtitle")}</p>
              {isAdminOrSuper && (
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  userRole === "super_admin" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25" : "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25"
                )}>
                  {userRole}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">{t("settings.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("settings.copy")}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <CloudCog className="h-7 w-7" />
          </div>
        </div>
      </section>

      {/* ── Change Password (Everyone) ────────────────────────────────────── */}
      <ChangePasswordCard />

      {/* ── Admin & Super Admin Sections ──────────────────────────────────── */}
      {isAdminOrSuper && (
        <>
          {/* Maintenance / Upgrading System toggles */}
          <div className="grid gap-4 xl:grid-cols-2">
            <SettingToggleCard
              checked={maintenanceMode}
              description="Mengaktifkan gerbang pemeliharaan sistem sehingga pengguna biasa tidak dapat mengakses aplikasi selama ada pembaruan database atau server."
              icon={Wrench}
              label={t("settings.maintenance")}
              onChange={() => handleToggleClick("maintenance", maintenanceMode)}
              statusText={maintenanceStatusText}
              tone="warning"
            />
            <SettingToggleCard
              checked={upgradingSystem}
              description="Menandai sistem sedang ditingkatkan kapasitasnya. Digunakan untuk integrasi deployment pipelining di masa mendatang."
              icon={ShieldCheck}
              label={t("settings.upgrading")}
              onChange={() => handleToggleClick("upgrade", upgradingSystem)}
              statusText={upgradingSystem ? t("settings.upgradeOn") : t("settings.noUpgrade")}
              tone="info"
            />
          </div>

          {/* Pending Approvals Panel (Super Admin only) */}
          {userRole === "super_admin" && (
            <section className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Permintaan Persetujuan Role (Admin)</h3>
                  <p className="text-sm text-muted-foreground">Proses permintaan promosi admin baru dari admin lain</p>
                </div>
              </div>

              {roleRequests.filter(r => r.status === "pending").length === 0 ? (
                <p className="text-sm text-slate-400">Tidak ada permintaan persetujuan aktif saat ini.</p>
              ) : (
                <div className="space-y-3">
                  {roleRequests
                    .filter(r => r.status === "pending")
                    .map(request => {
                      const targetUser = users.find(u => u.user_id === request.user_id)
                      const requester = users.find(u => u.user_id === request.requested_by)
                      return (
                        <div key={request.id} className="flex flex-col gap-3 rounded-lg border border-[#1e2235] bg-[#0f1117] p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">Target User: {targetUser?.email || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">Diajukan oleh: {requester?.email || "Unknown"} pada {new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowApprovalConfirm({ requestId: request.id, email: targetUser?.email || "", decision: "approved" })}
                              disabled={userActionLoading === `approve-${request.id}`}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Setujui
                            </button>
                            <button
                              onClick={() => setShowApprovalConfirm({ requestId: request.id, email: targetUser?.email || "", decision: "rejected" })}
                              disabled={userActionLoading === `approve-${request.id}`}
                              className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 cursor-pointer"
                            >
                              <X className="h-3 w-3" /> Tolak
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </section>
          )}

          {/* Categories Management Panel (Left / Right Table dual view) */}
          <section className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Manajemen Kategori Finansial</h3>
                <p className="text-sm text-muted-foreground">Kelola kategori default global yang dapat diakses oleh seluruh pengguna</p>
              </div>
            </div>

            {/* Add Category Form */}
            <form onSubmit={triggerAddCategory} className="mb-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Nama kategori baru"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <select
                value={newCatType}
                onChange={e => setNewCatType(e.target.value as "income" | "expense")}
                className="px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="expense">Pengeluaran (Expense)</option>
                <option value="income">Pemasukan (Income)</option>
              </select>
              <button
                type="submit"
                disabled={catActionLoading === "add"}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {catActionLoading === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Tambah Global
              </button>
            </form>

            {loadingCategories ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Table: Income Categories */}
                <div className="rounded-lg border border-slate-200 dark:border-[#1e2235] bg-slate-50 dark:bg-[#0b0c10] overflow-hidden">
                  <div className="bg-slate-100 dark:bg-[#0f1117] px-4 py-3 border-b border-slate-200 dark:border-[#1e2235]">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Kategori Pemasukan (Income)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100/80 dark:bg-[#0f1117]/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2235]">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2">Nama</th>
                          <th className="px-4 py-2">Tipe</th>
                          <th className="px-4 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#1e2235] bg-white dark:bg-[#0b0c10]">
                        {incomeCategories.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-slate-500 text-xs">Tidak ada kategori.</td>
                          </tr>
                        ) : (
                          incomeCategories.map((cat, idx) => (
                            <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-[#131622] transition-colors">
                              <td className="px-4 py-2 text-center text-slate-500 text-xs">{idx + 1}</td>
                              <td className="px-4 py-2 font-semibold text-white">{cat.name}</td>
                              <td className="px-4 py-2">
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  cat.user_id === null ? "bg-indigo-500/15 text-indigo-400" : "bg-purple-500/15 text-purple-400"
                                )}>
                                  {cat.user_id === null ? "Global" : "Kustom"}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {userRole === "super_admin" ? (
                                  <button
                                    onClick={() => setShowDeleteCatConfirm({ id: cat.id, name: cat.name })}
                                    disabled={catActionLoading === `delete-${cat.id}`}
                                    className="rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 italic">Hapus (Super)</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Table: Expense Categories */}
                <div className="rounded-lg border border-slate-200 dark:border-[#1e2235] bg-slate-50 dark:bg-[#0b0c10] overflow-hidden">
                  <div className="bg-slate-100 dark:bg-[#0f1117] px-4 py-3 border-b border-slate-200 dark:border-[#1e2235]">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Kategori Pengeluaran (Expense)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100/80 dark:bg-[#0f1117]/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2235]">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2">Nama</th>
                          <th className="px-4 py-2">Tipe</th>
                          <th className="px-4 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#1e2235] bg-white dark:bg-[#0b0c10]">
                        {expenseCategories.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-slate-500 text-xs">Tidak ada kategori.</td>
                          </tr>
                        ) : (
                          expenseCategories.map((cat, idx) => (
                            <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-[#131622] transition-colors">
                              <td className="px-4 py-2 text-center text-slate-500 text-xs">{idx + 1}</td>
                              <td className="px-4 py-2 font-semibold text-white">{cat.name}</td>
                              <td className="px-4 py-2">
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  cat.user_id === null ? "bg-indigo-500/15 text-indigo-400" : "bg-purple-500/15 text-purple-400"
                                )}>
                                  {cat.user_id === null ? "Global" : "Kustom"}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {userRole === "super_admin" ? (
                                  <button
                                    onClick={() => setShowDeleteCatConfirm({ id: cat.id, name: cat.name })}
                                    disabled={catActionLoading === `delete-${cat.id}`}
                                    className="rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 italic">Hapus (Super)</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Master Users Data Table with Search and Pagination */}
          <section className="rounded-xl border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Master Data User</h3>
                  <p className="text-sm text-muted-foreground">Lihat dan atur level hak akses pengguna aplikasi</p>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari email user..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#1e2235]">
                  <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-[#0f1117] text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2235]">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">No</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Terdaftar Sejak</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#1e2235] bg-white dark:bg-[#0b0c10]">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Tidak ada user ditemukan.</td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user, idx) => {
                          const number = (currentPage - 1) * itemsPerPage + idx + 1
                          const request = roleRequests.find(r => r.user_id === user.user_id && r.status === "pending")
                          return (
                            <tr key={user.user_id} className="hover:bg-slate-50 dark:hover:bg-[#131622] transition-colors">
                              <td className="px-4 py-3 text-center text-slate-500 text-xs">{number}</td>
                              <td className="px-4 py-3 font-medium text-white">{user.email}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                  user.role === "super_admin"
                                    ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
                                    : user.role === "admin"
                                    ? "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25"
                                    : "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25"
                                )}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-right">
                                {user.user_id === currentUser?.id ? (
                                  <span className="text-xs text-muted-foreground/60 italic">Akun Anda</span>
                                ) : userRole === "super_admin" ? (
                                  <select
                                    value={user.role}
                                    disabled={userActionLoading === user.user_id}
                                    onChange={e => setShowRoleChangeConfirm({ userId: user.user_id, email: user.email, role: e.target.value })}
                                    className="px-2 py-1 rounded bg-[#0f1117] border border-[#1e2235] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                  </select>
                                ) : user.role === "user" ? (
                                  request ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleAdminRequestPromotion(user.user_id, user.email)}
                                      disabled={userActionLoading === user.user_id}
                                      className="inline-flex items-center gap-1 rounded bg-indigo-600/20 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition disabled:opacity-50 cursor-pointer"
                                    >
                                      Ajukan Jadi Admin
                                    </button>
                                  )
                                ) : (
                                  <span className="text-xs text-muted-foreground/60">Tidak ada aksi</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[#1e2235] pt-4">
                    <p className="text-xs text-slate-400">
                      Menampilkan <span className="text-white font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white font-semibold">{Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}</span> dari <span className="text-white font-semibold">{filteredAndSortedUsers.length}</span> user
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center rounded-lg border border-[#1e2235] bg-[#0f1117] p-2 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-white">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center rounded-lg border border-[#1e2235] bg-[#0f1117] p-2 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── CUSTOM ALERT & DIALOG MODALS ────────────────────────────────────── */}

      {/* SUCCESS MODAL */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/25 bg-[#0e1713] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{successModal.title}</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{successModal.message}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSuccessModal(null)}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-500/25 bg-[#170e0e] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{errorModal.title}</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{errorModal.message}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="rounded-lg bg-red-600 hover:bg-red-500 transition px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARNING MODAL FOR SYSTEM TOGGLES */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#16131c] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Danger Area: Konfirmasi Perubahan Sistem</h3>
            <p className="mt-3 text-sm text-slate-200 leading-relaxed">
              {pendingToggleValue
                ? "Apakah Anda yakin ingin MENGAKTIFKAN mode peningkatan sistem? Beberapa fungsi server akan dinonaktifkan sementara untuk penyesuaian."
                : "Apakah Anda yakin ingin MENONAKTIFKAN mode peningkatan sistem? Pastikan proses pembaharuan modul system/pipeline telah selesai sepenuhnya."
              }
            </p>
            <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/15 p-3.5 text-xs text-red-400">
              Perhatian: Pengaturan ini bersifat global dan mempengaruhi seluruh pengguna aplikasi kekayaan.id.
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#2a2335] pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false)
                  setPendingToggleType(null)
                }}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmToggleChange}
                className="rounded-lg bg-red-600 hover:bg-red-500 transition px-6 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE ACTIVATION ON MODAL */}
      {showMaintenanceOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/25 bg-[#17140f] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Aktivasi Mode Pemeliharaan</h3>
            <p className="mt-1 text-xs text-slate-400">Setup konfigurasi dan waktu pemeliharaan server secara terintegrasi.</p>
            
            <form onSubmit={handleActivateMaintenance} className="mt-4 space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipe Pemeliharaan</label>
                <select
                  value={maintenanceType}
                  onChange={e => setMaintenanceType(e.target.value as "instant" | "scheduled")}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                >
                  <option value="instant">Instan (Seketika Saat Ini Juga)</option>
                  <option value="scheduled">Terjadwal (Gunakan Rentang Waktu)</option>
                </select>
              </div>

              {/* Scheduled Inputs */}
              {maintenanceType === "scheduled" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Waktu Mulai</label>
                    <input
                      type="datetime-local"
                      value={scheduledStart}
                      onChange={e => setScheduledStart(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Waktu Selesai</label>
                    <input
                      type="datetime-local"
                      value={scheduledEnd}
                      onChange={e => setScheduledEnd(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Plan description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Rencana Perubahan & Deskripsi</label>
                <textarea
                  placeholder="Contoh: Migrasi skema database versi 1.2 dan optimasi query tabel transaksi..."
                  value={onDescription}
                  onChange={e => setOnDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
                <span className="text-[10px] text-slate-500">
                  Minimal 10 karakter. Terhitung: {onDescription.trim().length} karakter.
                </span>
              </div>

              {/* Warnings info */}
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 text-[11px] text-amber-300 leading-relaxed">
                {maintenanceType === "instant" 
                  ? "Peringatan: Seluruh user biasa yang sedang aktif akan langsung dikeluarkan secara real-time dan dipindahkan ke halaman pemeliharaan."
                  : "Info: Banner pemberitahuan terjadwal akan dimunculkan di atas halaman dashboard seluruh user secara real-time hingga waktu pemeliharaan tiba."
                }
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#29221a]">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceOnModal(false)}
                  disabled={maintenanceActionLoading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-55"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={maintenanceActionLoading || onDescription.trim().length < 10}
                  className="rounded-lg bg-amber-600 hover:bg-amber-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {maintenanceActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Aktifkan Pemeliharaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAINTENANCE DEACTIVATION OFF MODAL */}
      {showMaintenanceOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-[#0f1712] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Deaktivasi Mode Pemeliharaan</h3>
            <p className="mt-1 text-xs text-slate-400">Lengkapi laporan perubahan untuk menutup pemeliharaan sistem.</p>
            
            <form onSubmit={handleDeactivateMaintenance} className="mt-4 space-y-4">
              {/* Report description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Laporan Hasil Pemeliharaan (Hasil Perbaikan)</label>
                <textarea
                  placeholder="Contoh: Sukses mengoptimasi indeks tabel transaksi dan memperbarui versi schema..."
                  value={offDescription}
                  onChange={e => setOffDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
                <span className="text-[10px] text-slate-500">
                  Minimal 10 karakter. Terhitung: {offDescription.trim().length} karakter.
                </span>
              </div>

              {/* Security confirmation keyword */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Konfirmasi Keamanan (Copy-Paste Dinonaktifkan)</label>
                <input
                  type="text"
                  placeholder="Ketik: maintenance-well-done"
                  value={confirmationText}
                  onChange={e => setConfirmationText(e.target.value)}
                  onPaste={e => {
                    e.preventDefault()
                    setErrorModal({
                      title: "Proteksi Keamanan",
                      message: "Fitur copy-paste dinonaktifkan pada input ini. Silakan ketik secara manual."
                    })
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm select-none"
                />
                <span className="text-[10px] text-slate-500">
                  Ketik persis: <code className="bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.5 rounded text-emerald-400 font-mono">maintenance-well-done</code>
                </span>
              </div>

              {/* Warnings info */}
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 text-[11px] text-emerald-300 leading-relaxed">
                Info: Seluruh durasi pengerjaan akan dihitung secara otomatis dan disimpan dalam audit log sistem.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1a291e]">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceOffModal(false)}
                  disabled={maintenanceActionLoading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-55"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    maintenanceActionLoading || 
                    offDescription.trim().length < 10 || 
                    confirmationText !== "maintenance-well-done"
                  }
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {maintenanceActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Ya, Matikan Mode Pemeliharaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ADD CATEGORY MODAL */}
      {showAddCatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/20 bg-[#121420] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Tambah Kategori Global</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menambahkan kategori global{" "}
              <span className="font-semibold text-white bg-indigo-500/15 border border-indigo-500/35 px-1.5 py-0.5 rounded text-xs mx-0.5">
                {newCatName}
              </span>{" "}
              berjenis{" "}
              <span className={cn(
                "font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5",
                newCatType === "income"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/35"
              )}>
                {newCatType === "income" ? "Pemasukan (Income)" : "Pengeluaran (Expense)"}
              </span>
              ? Kategori ini akan langsung dapat diakses dan digunakan oleh seluruh pengguna aplikasi.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddCatConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmAddCategory}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Ya, Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CATEGORY MODAL */}
      {showDeleteCatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#201212] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Konfirmasi Hapus Kategori</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori global{" "}
              <span className="font-semibold text-white bg-rose-500/15 border border-rose-500/35 px-1.5 py-0.5 rounded text-xs mx-0.5">
                {showDeleteCatConfirm.name}
              </span>
              ? Tindakan ini sangat krusial dan dapat memicu kegagalan relasi pada data transaksi pengguna yang sudah menggunakan kategori ini sebelumnya.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteCatConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="rounded-lg bg-red-600 hover:bg-red-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ROLE CHANGE MODAL */}
      {showRoleChangeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/20 bg-[#121420] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Ubah Role Pengguna</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin mengubah hak akses role untuk{" "}
              <span className="font-semibold text-white bg-[#1e2235] border border-slate-500/30 px-1.5 py-0.5 rounded text-xs mx-0.5">
                {showRoleChangeConfirm.email}
              </span>{" "}
              menjadi{" "}
              <span className={cn(
                "font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5",
                showRoleChangeConfirm.role === "super_admin"
                  ? "bg-red-500/15 text-red-400 border border-red-500/35"
                  : showRoleChangeConfirm.role === "admin"
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35"
                  : "bg-slate-500/15 text-slate-400 border border-slate-500/35"
              )}>
                {showRoleChangeConfirm.role.toUpperCase()}
              </span>
              ? Perubahan hak akses akan segera aktif saat pengguna mengakses halaman dashboard berikutnya.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRoleChangeConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSuperAdminChangeRole}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Ya, Ubah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM APPROVAL MODAL */}
      {showApprovalConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/20 bg-[#121420] p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <UserPlus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Proses Permintaan Role</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin{" "}
              <span className={cn(
                "font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5",
                showApprovalConfirm.decision === "approved"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                  : "bg-red-500/15 text-red-400 border border-red-500/35"
              )}>
                {showApprovalConfirm.decision === "approved" ? "MENYETUJUI" : "MENOLAK"}
              </span>{" "}
              pengajuan promosi role{" "}
              <span className="font-semibold text-indigo-400 bg-indigo-500/15 border border-indigo-500/35 px-1.5 py-0.5 rounded text-xs mx-0.5">
                ADMIN
              </span>{" "}
              untuk pengguna{" "}
              <span className="font-semibold text-white bg-[#1e2235] border border-slate-500/30 px-1.5 py-0.5 rounded text-xs mx-0.5">
                {showApprovalConfirm.email}
              </span>
              ?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApprovalConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmProcessApproval}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("Tidak dapat menemukan akun.")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error("Password saat ini salah.")

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

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password berhasil diubah!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-slate-50 transition duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
  onChange: () => void
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
          onClick={onChange}
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
