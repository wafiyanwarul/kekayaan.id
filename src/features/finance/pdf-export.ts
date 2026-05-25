import type { FinanceCycle, FinanceTransaction } from "./types"
import { formatCycleLabel, isInRange, summarizeTransactions } from "./utils"

// ─── helpers ────────────────────────────────────────────────────────────────

function rp(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function short(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function pct(value: number, total: number) {
  if (total === 0) return "0%"
  return `${((value / total) * 100).toFixed(1)}%`
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function exportCashflowPdf(
  transactions: FinanceTransaction[],
  cycle: FinanceCycle,
  selectedStart: Date,
  selectedEnd: Date
) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const label = formatCycleLabel(selectedStart, selectedEnd)
  const filtered = transactions.filter((t) =>
    isInRange(t.transaction_date, selectedStart, selectedEnd)
  )
  const summary = summarizeTransactions(filtered)

  const incomeItems = filtered
    .filter((t) => t.type === "income")
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  const expenseItems = filtered
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))

  // Category breakdown
  const categoryMap = (type: "income" | "expense") => {
    const map = new Map<string, number>()
    filtered
      .filter((t) => t.type === type)
      .forEach((t) => {
        const name = t.category?.name ?? "Tanpa Kategori"
        map.set(name, (map.get(name) ?? 0) + t.amount)
      })
    const total = [...map.values()].reduce((s, v) => s + v, 0)
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => [name, rp(amount), pct(amount, total)])
  }

  const cycleDays =
    Math.round((selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const makananTotal = expenseItems
    .filter((t) => (t.category?.name ?? "").toLowerCase().includes("makanan"))
    .reduce((s, t) => s + t.amount, 0)
  const transportasiTotal = expenseItems
    .filter((t) => (t.category?.name ?? "").toLowerCase().includes("transportasi"))
    .reduce((s, t) => s + t.amount, 0)

  // ── Colour palette (light/professional) ───────────────────────────────────
  const C = {
    white:     [255, 255, 255] as [number, number, number],
    pageGrey:  [248, 249, 252] as [number, number, number],  // very light page bg
    cardGrey:  [241, 243, 248] as [number, number, number],  // card bg
    lineGrey:  [220, 224, 235] as [number, number, number],  // table alt row
    border:    [210, 214, 228] as [number, number, number],
    textDark:  [22, 28, 48]   as [number, number, number],   // near-black heading
    textMed:   [71, 85, 105]  as [number, number, number],   // slate-600
    textLight: [148, 163, 184] as [number, number, number],  // slate-400
    primary:   [79, 70, 229]  as [number, number, number],   // indigo-600
    primaryBg: [238, 242, 255] as [number, number, number],  // indigo-50
    income:    [5, 150, 105]  as [number, number, number],   // emerald-600
    incomeBg:  [209, 250, 229] as [number, number, number],  // emerald-100
    expense:   [220, 38, 38]  as [number, number, number],   // red-600
    expenseBg: [254, 226, 226] as [number, number, number],  // red-100
    amber:     [180, 110, 0]  as [number, number, number],
    amberBg:   [254, 243, 199] as [number, number, number],
    sky:       [2, 132, 199]  as [number, number, number],
    skyBg:     [224, 242, 254] as [number, number, number],
    surplusBg: (v: number) => v >= 0 ? [209, 250, 229] as [number, number, number] : [254, 226, 226] as [number, number, number],
  }

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentW = pageW - margin * 2

  // ── Helper: fill entire page white (called for every page via didDrawPage) ──
  function fillPageBg() {
    doc.setFillColor(...C.pageGrey)
    doc.rect(0, 0, pageW, pageH, "F")
  }

  // Page 1 background
  fillPageBg()

  let y = 0

  // ── HEADER BANNER ─────────────────────────────────────────────────────────
  const bannerH = 36
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pageW, bannerH, "F")

  // Accent top strip
  doc.setFillColor(99, 90, 255)
  doc.rect(0, 0, pageW, 3, "F")

  doc.setTextColor(...C.white)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("kekayaan.id", margin, 15)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(210, 220, 255)
  doc.text("Laporan Arus Kas Bulanan", margin, 23)
  doc.text(`Periode: ${label}`, margin, 29)
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    pageW - margin, 29, { align: "right" }
  )

  y = bannerH + 8

  // ── SUMMARY CARDS ─────────────────────────────────────────────────────────
  const cardW = (contentW - 9) / 4
  const cardH = 26

  const summaryCards = [
    { label: "PEMASUKAN",    value: rp(summary.income),  bg: C.incomeBg,  accent: C.income,  text: C.income },
    { label: "PENGELUARAN",  value: rp(summary.expense), bg: C.expenseBg, accent: C.expense, text: C.expense },
    { label: "SURPLUS",      value: rp(summary.surplus), bg: C.surplusBg(summary.surplus), accent: summary.surplus >= 0 ? C.income : C.expense, text: summary.surplus >= 0 ? C.income : C.expense },
    { label: "SAVINGS RATE", value: `${summary.savingsRate.toFixed(1)}%`, bg: C.primaryBg, accent: C.primary, text: C.primary },
  ]

  summaryCards.forEach((card, i) => {
    const x = margin + i * (cardW + 3)
    doc.setFillColor(...card.bg)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F")
    doc.setDrawColor(...card.accent)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "S")
    // left accent bar
    doc.setFillColor(...card.accent)
    doc.rect(x, y, 2.5, cardH, "F")

    doc.setTextColor(...C.textMed)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text(card.label, x + 6, y + 8)

    doc.setTextColor(...card.text)
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "bold")
    doc.text(card.value, x + 6, y + 19)
  })

  y += cardH + 8

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── CATEGORY BREAKDOWN ────────────────────────────────────────────────────
  const halfW = (contentW - 5) / 2

  // Income header
  doc.setFillColor(...C.incomeBg)
  doc.roundedRect(margin, y - 1, halfW, 7, 1, 1, "F")
  doc.setTextColor(...C.income)
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.text("(+)  Kategori Pemasukan", margin + 3, y + 4.5)

  // Expense header
  doc.setFillColor(...C.expenseBg)
  doc.roundedRect(margin + halfW + 5, y - 1, halfW, 7, 1, 1, "F")
  doc.setTextColor(...C.expense)
  doc.text("(-)  Kategori Pengeluaran", margin + halfW + 8, y + 4.5)

  const incomeCats = categoryMap("income")

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin + halfW + 5 },
    head: [["Kategori", "Total", "Porsi"]],
    body: incomeCats.length ? incomeCats : [["—", "—", "—"]],
    theme: "plain",
    headStyles: {
      fillColor: [5, 100, 70],
      textColor: C.white,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 2 },
    },
    bodyStyles: {
      fillColor: C.white,
      textColor: C.textDark,
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 2 },
    },
    alternateRowStyles: { fillColor: C.cardGrey },
    columnStyles: {
      1: { halign: "right", textColor: C.textMed },
      2: { halign: "right", textColor: C.income, fontStyle: "bold" },
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    didDrawPage: fillPageBg,
  })

  const catTableEndY = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin + halfW + 5, right: margin },
    head: [["Kategori", "Total", "Porsi"]],
    body: categoryMap("expense").length ? categoryMap("expense") : [["—", "—", "—"]],
    theme: "plain",
    headStyles: {
      fillColor: [160, 25, 25],
      textColor: C.white,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 2 },
    },
    bodyStyles: {
      fillColor: C.white,
      textColor: C.textDark,
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 2 },
    },
    alternateRowStyles: { fillColor: C.cardGrey },
    columnStyles: {
      1: { halign: "right", textColor: C.textMed },
      2: { halign: "right", textColor: C.expense, fontStyle: "bold" },
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    didDrawPage: fillPageBg,
  })

  y = Math.max(catTableEndY, (doc as any).lastAutoTable.finalY) + 8

  // ── DAILY ESSENTIAL BOX ───────────────────────────────────────────────────
  const essentialH = 24
  doc.setFillColor(...C.cardGrey)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, contentW, essentialH, 2, 2, "FD")

  doc.setTextColor(...C.textMed)
  doc.setFontSize(6.5)
  doc.setFont("helvetica", "bold")
  doc.text("PENGELUARAN HARIAN POKOK (ESTIMASI RATA-RATA)", margin + 4, y + 6)

  // Makanan
  doc.setFillColor(...C.amber)
  doc.rect(margin + 4, y + 9, 2.5, 10, "F")
  doc.setTextColor(...C.textMed)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Makanan", margin + 9, y + 14)
  doc.setTextColor(...C.amber)
  doc.setFont("helvetica", "bold")
  doc.text(`${rp(makananTotal / cycleDays)}/hari  (total ${rp(makananTotal)})`, margin + 9, y + 20)

  // Transportasi
  const midX = margin + contentW / 2 + 4
  doc.setFillColor(...C.sky)
  doc.rect(midX, y + 9, 2.5, 10, "F")
  doc.setTextColor(...C.textMed)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Transportasi", midX + 5, y + 14)
  doc.setTextColor(...C.sky)
  doc.setFont("helvetica", "bold")
  doc.text(`${rp(transportasiTotal / cycleDays)}/hari  (total ${rp(transportasiTotal)})`, midX + 5, y + 20)

  y += essentialH + 8

  // ── INCOME TABLE ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.incomeBg)
  doc.roundedRect(margin, y - 1, 55, 7, 1, 1, "F")
  doc.setTextColor(...C.income)
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.text("(+)  Daftar Pemasukan", margin + 3, y + 4.5)

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Tanggal", "Sumber", "Kategori", "Catatan", "Jumlah"]],
    body: incomeItems.map((t) => [
      short(t.transaction_date),
      t.title,
      t.category?.name ?? "—",
      t.notes ?? "—",
      rp(t.amount),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [5, 100, 70],
      textColor: C.white,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fillColor: C.white,
      textColor: C.textDark,
      fontSize: 7.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: C.cardGrey },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 40 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
      4: { halign: "right", cellWidth: 30, textColor: C.income, fontStyle: "bold" },
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    foot: [[{
      content: `Total Pemasukan: ${rp(summary.income)}`,
      colSpan: 5,
      styles: { halign: "right", textColor: C.income, fontStyle: "bold", fontSize: 8, fillColor: C.incomeBg },
    }]],
    footStyles: { fillColor: C.incomeBg },
    didDrawPage: fillPageBg,
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── EXPENSE TABLE ─────────────────────────────────────────────────────────
  doc.setFillColor(...C.expenseBg)
  doc.roundedRect(margin, y - 1, 55, 7, 1, 1, "F")
  doc.setTextColor(...C.expense)
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.text("(-)  Daftar Pengeluaran", margin + 3, y + 4.5)

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Tanggal", "Item", "Kategori", "Catatan", "Jumlah"]],
    body: expenseItems.map((t) => [
      short(t.transaction_date),
      t.title,
      t.category?.name ?? "—",
      t.notes ?? "—",
      rp(t.amount),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [160, 25, 25],
      textColor: C.white,
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fillColor: C.white,
      textColor: C.textDark,
      fontSize: 7.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: C.cardGrey },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 40 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
      4: { halign: "right", cellWidth: 30, textColor: C.expense, fontStyle: "bold" },
    },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
    foot: [[{
      content: `Total Pengeluaran: ${rp(summary.expense)}`,
      colSpan: 5,
      styles: { halign: "right", textColor: C.expense, fontStyle: "bold", fontSize: 8, fillColor: C.expenseBg },
    }]],
    footStyles: { fillColor: C.expenseBg },
    didDrawPage: fillPageBg,
  })

  // ── FOOTER ON EVERY PAGE ─────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    // Footer strip
    doc.setFillColor(...C.primary)
    doc.rect(0, pageH - 9, pageW, 9, "F")
    doc.setTextColor(...C.white)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text("kekayaan.id — Laporan Arus Kas", margin, pageH - 3)
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW - margin, pageH - 3, { align: "right" })
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const fileName = `laporan-keuangan_${selectedStart.toISOString().slice(0, 10)}_${selectedEnd.toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
