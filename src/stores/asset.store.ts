import { create } from "zustand"
import type { Asset } from "@/types"

interface AssetStore {
  assets: Asset[]
  isLoading: boolean
  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, asset: Partial<Asset>) => void
  removeAsset: (id: string) => void
  setLoading: (v: boolean) => void
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  isLoading: false,
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
  updateAsset: (id, updated) =>
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...updated } : a)) })),
  removeAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}))
