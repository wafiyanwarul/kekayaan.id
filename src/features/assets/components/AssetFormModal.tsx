"use client"
import { useState } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ASSET_CATEGORIES } from "@/lib/constants"
import { StyledSelect } from "@/features/finance/components/StyledSelect"

interface Asset {
  id: string; user_id: string; name: string; category: string
  current_value: number; is_liquid: boolean; notes?: string; created_at: string
}
interface Props {
  userId: string
  asset: Asset | null
  onClose: () => void
  onSaved: (asset: Asset, isEdit: boolean) => void
}

const allCategories = [
  ...ASSET_CATEGORIES.liquid.map(c => ({ value: c, label: c.replace("_", " "), liquid: true })),
  ...ASSET_CATEGORIES.non_liquid.map(c => ({ value: c, label: c.replace("_", " "), liquid: false })),
]

export function AssetFormModal({ userId, asset, onClose, onSaved }: Props) {
  const isEdit = !!asset
  const [name, setName] = useState(asset?.name ?? "")
  const [category, setCategory] = useState(asset?.category ?? "bank")
  const [value, setValue] = useState(asset?.current_value?.toString() ?? "")
  const [isLiquid, setIsLiquid] = useState(asset?.is_liquid ?? true)
  const [notes, setNotes] = useState(asset?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handleCategoryChange(val: string) {
    setCategory(val)
    const cat = allCategories.find(c => c.value === val)
    if (cat) setIsLiquid(cat.liquid)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const supabase = createClient()
    const payload = { user_id: userId, name, category, current_value: parseFloat(value), is_liquid: isLiquid, notes: notes || null }

    if (isEdit) {
      const { data, error } = await supabase.from("assets").update(payload).eq("id", asset.id).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      onSaved(data as Asset, true)
    } else {
      const { data, error } = await supabase.from("assets").insert(payload).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      onSaved(data as Asset, false)
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-500/60 transition"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[400px] bg-[#1a1d2e] border border-[#1e2235] rounded-2xl p-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">{isEdit ? "Edit Aset" : "Tambah Aset"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-red-500/15 hover:text-red-200 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Nama Aset</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="cth: BCA Tabungan" required className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Kategori</label>
            <StyledSelect
              value={category}
              onChange={handleCategoryChange}
              maxHeight={180}
              groups={[
                {
                  label: "💧 Likuid",
                  options: ASSET_CATEGORIES.liquid.map(c => ({ value: c, label: c.replace("_", " ") })),
                },
                {
                  label: "🏗️ Non-Likuid",
                  options: ASSET_CATEGORIES.non_liquid.map(c => ({ value: c, label: c.replace("_", " ") })),
                },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Nilai Saat Ini (Rp)</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="cth: 10000000" required min="0" className={inputCls} />
          </div>

          <div className="flex items-center gap-3 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={isLiquid}
              onClick={() => setIsLiquid(!isLiquid)}
              className={`relative h-6 w-12 shrink-0 rounded-full border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1a1d2e] ${
                isLiquid
                  ? "border-indigo-400 bg-indigo-600 hover:bg-indigo-500"
                  : "border-slate-400 bg-slate-600 hover:bg-slate-500"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isLiquid ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-slate-300">{isLiquid ? "Aset Likuid" : "Aset Non-Likuid"}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Catatan <span className="text-slate-500">(opsional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="cth: dibeli Jan 2025" rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#1e2235] text-slate-300 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 text-sm font-medium transition cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Aset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
