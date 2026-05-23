import { z } from "zod"

export const assetSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  currentValue: z.coerce.number().min(0, "Nilai harus positif"),
  isLiquid: z.boolean().default(true),
  notes: z.string().optional(),
})
export type AssetFormValues = z.infer<typeof assetSchema>

export const transactionSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  amount: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().optional(),
  transactionDate: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
})
export type TransactionFormValues = z.infer<typeof transactionSchema>

export const goalSchema = z.object({
  title: z.string().min(1, "Nama goal wajib diisi"),
  targetAmount: z.coerce.number().min(1, "Target harus lebih dari 0"),
  targetDate: z.string().min(1, "Tanggal target wajib diisi"),
  goalType: z.string().min(1, "Tipe goal wajib dipilih"),
})
export type GoalFormValues = z.infer<typeof goalSchema>
