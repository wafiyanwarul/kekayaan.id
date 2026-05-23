"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatRupiah, formatCompact } from "@/lib/utils"
import { ASSET_CATEGORIES } from "@/lib/constants"
import { AssetFormModal } from "./AssetFormModal"

interface Asset {
  id: string; user_id: string; name: string; category: string
  current_value: number; is_liquid: boolean; notes?: string; created_at: string
}

interface Props { initialAssets: Asset[]; userId: string }

export function AssetListClient({ initialAssets, userId }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [showModal, setShowModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null)

  const totalLiquid = assets.filter(a => a.is_liquid).reduce((s, a) => s + Number(a.current_value), 0)
  const totalNonLiquid = assets.filter(a => !a.is_liquid).reduce((s, a) => s + Number(a.current_value), 0)
  const totalWealth = totalLiquid + totalNonLiquid

  async function handleDelete(asset: Asset) {
    setDeleting(asset.id)
    const supabase = createClient()
    await supabase.from("assets").delete().eq("id", asset.id)
    setAssets(prev => prev.filter(a => a.id !== asset.id))
    setDeleting(null)
    setPendingDelete(null)
  }

  function handleSaved(asset: Asset, isEdit: boolean) {
    if (isEdit) setAssets(prev => prev.map(a => a.id === asset.id ? asset : a))
    else setAssets(prev => [asset, ...prev])
    setShowModal(false)
    setEditingAsset(null)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Aset", value: formatCompact(totalWealth), color: "text-indigo-400" },
          { label: "Likuid", value: formatCompact(totalLiquid), color: "text-emerald-400" },
          { label: "Non-Likuid", value: formatCompact(totalNonLiquid), color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#1e2235] bg-[#1a1d2e] p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{assets.length} aset tercatat</p>
        <button onClick={() => { setEditingAsset(null); setShowModal(true) }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition cursor-pointer">
          + Tambah Aset
        </button>
      </div>

      {/* List */}
      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1e2235] p-12 text-center">
          <div className="text-4xl mb-3">💼</div>
          <p className="text-slate-400 text-sm">Belum ada aset. Tambahkan aset pertamamu!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1e2235] bg-[#1a1d2e] overflow-hidden">
          <ul className="divide-y divide-[#1e2235]">
            {assets.map(asset => (
              <li key={asset.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition group">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${asset.is_liquid ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{asset.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{asset.category.replace("_", " ")} · {asset.is_liquid ? "Likuid" : "Non-Likuid"}</p>
                    {asset.notes && <p className="text-xs text-slate-500 mt-0.5 italic">{asset.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{formatRupiah(Number(asset.current_value))}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingAsset(asset); setShowModal(true) }}
                      className="px-2.5 py-1 text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md transition cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => setPendingDelete(asset)} disabled={deleting === asset.id}
                      className="px-2.5 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      {deleting === asset.id ? "..." : "Hapus"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <AssetFormModal
          userId={userId}
          asset={editingAsset}
          onClose={() => { setShowModal(false); setEditingAsset(null) }}
          onSaved={handleSaved}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Hapus Aset?</h2>
              <p className="text-sm text-slate-400">
                Aset <span className="text-slate-200 font-medium">{pendingDelete.name}</span> akan dihapus dari daftar.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting === pendingDelete.id}
                className="flex-1 rounded-lg border border-[#1e2235] py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                disabled={deleting === pendingDelete.id}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === pendingDelete.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
