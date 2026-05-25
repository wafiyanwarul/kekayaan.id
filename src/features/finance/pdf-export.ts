import type { FinanceCycle, FinanceTransaction } from "./types"
import { formatCycleLabel, isInRange, summarizeTransactions } from "./utils"

function rp(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function shortDate(value: string) {
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

  // ── Document setup ─────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const M = 18          // margin
  const W = pageW - M * 2 // content width

  // ── Professional colour palette (white bg, dark text) ────────────────────
  const C = {
    pageBg:      [255, 255, 255] as [number, number, number],
    rowAlt:      [249, 250, 251] as [number, number, number],  // gray-50
    sectionBg:   [243, 244, 246] as [number, number, number],  // gray-100
    borderGray:  [229, 231, 235] as [number, number, number],  // gray-200
    textBody:    [17,  24,  39]  as [number, number, number],  // gray-900
    textMed:     [75,  85, 99]   as [number, number, number],  // gray-600
    textLight:   [156,163,175]   as [number, number, number],  // gray-400
    white:       [255,255,255]   as [number, number, number],
    indigo:      [79, 70,229]    as [number, number, number],  // indigo-600
    indigoDark:  [49, 46,129]    as [number, number, number],  // indigo-900
    indigoLight: [238,242,255]   as [number, number, number],  // indigo-50
    green:       [22,163, 74]    as [number, number, number],  // green-600
    greenDark:   [20,  83, 45]   as [number, number, number],
    greenLight:  [220,252,231]   as [number, number, number],  // green-100
    red:         [220, 38, 38]   as [number, number, number],  // red-600
    redDark:     [127, 29, 29]   as [number, number, number],
    redLight:    [254,226,226]   as [number, number, number],  // red-100
    amber:       [180,110,  0]   as [number, number, number],
    amberLight:  [255,251,235]   as [number, number, number],
    sky:         [  2,132,199]   as [number, number, number],
    skyLight:    [224,242,254]   as [number, number, number],
  }

  // ── Fill page background (MUST use addPage event so new pages are filled
  //    BEFORE content is drawn — avoids the "didDrawPage covers content" bug) ──
  function fillBg() {
    doc.setFillColor(...C.pageBg)
    doc.rect(0, 0, pageW, pageH, "F")
  }

  // Fill page 1 immediately
  fillBg()

  // Subscribe so every subsequent page created by autoTable also gets white bg
  ;(doc.internal as any).events.subscribe("addPage", fillBg)

  let y = 0

  // ── HEADER BANNER ─────────────────────────────────────────────────────────
  const BANNER_H = 34
  doc.setFillColor(...C.indigoDark)
  doc.rect(0, 0, pageW, BANNER_H, "F")

  // Top accent stripe
  doc.setFillColor(...C.indigo)
  doc.rect(0, 0, pageW, 3, "F")

  // Brand mark — "K" box
  const BX = M, BY = 7, BW = 10, BH = 10
  doc.setFillColor(...C.indigo)
  doc.roundedRect(BX, BY, BW, BH, 1.5, 1.5, "F")
  doc.setTextColor(...C.white)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("K", BX + BW / 2, BY + BH / 2 + 2.5, { align: "center" })

  // App name + subtitle
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...C.white)
  doc.text("kekayaan.id", BX + BW + 3, BY + 7)
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(196, 196, 255)
  doc.text("Laporan Arus Kas Bulanan", BX + BW + 3, BY + 13)

  // Date info right-aligned
  doc.setFontSize(7)
  doc.setTextColor(196, 196, 255)
  doc.text(`Periode: ${label}`, pageW - M, BY + 6, { align: "right" })
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    pageW - M, BY + 12, { align: "right" }
  )

  y = BANNER_H + 8

  // ── SUMMARY CARDS ─────────────────────────────────────────────────────────
  const CW = (W - 9) / 4
  const CH = 26
  const surplusIsPos = summary.surplus >= 0

  const cards = [
    { label: "PEMASUKAN",    val: rp(summary.income),                  bg: C.greenLight, bar: C.green, txt: C.green },
    { label: "PENGELUARAN",  val: rp(summary.expense),                 bg: C.redLight,   bar: C.red,   txt: C.red },
    { label: "SURPLUS",      val: rp(summary.surplus),                 bg: surplusIsPos ? C.greenLight : C.redLight, bar: surplusIsPos ? C.green : C.red, txt: surplusIsPos ? C.green : C.red },
    { label: "SAVINGS RATE", val: `${summary.savingsRate.toFixed(1)}%`, bg: C.indigoLight,bar: C.indigo,txt: C.indigo },
  ]

  cards.forEach((card, i) => {
    const x = M + i * (CW + 3)
    // Card bg
    doc.setFillColor(...card.bg)
    doc.setDrawColor(...card.bar)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y, CW, CH, 2, 2, "FD")
    // Left bar
    doc.setFillColor(...card.bar)
    doc.roundedRect(x, y, 3, CH, 1, 1, "F")
    // Label
    doc.setTextColor(...C.textMed)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text(card.label, x + 7, y + 8)
    // Value
    doc.setTextColor(...card.txt)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(card.val, x + 7, y + 19)
  })

  y += CH + 8

  // ── SECTION DIVIDER ───────────────────────────────────────────────────────
  doc.setDrawColor(...C.borderGray)
  doc.setLineWidth(0.3)
  doc.line(M, y, pageW - M, y)
  y += 6

  // ── CATEGORY BREAKDOWN (two-column) ───────────────────────────────────────
  const halfW = (W - 5) / 2

  // Income header pill
  doc.setFillColor(...C.greenLight)
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y - 1, halfW, 7, 1.5, 1.5, "FD")
  doc.setTextColor(...C.green)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("(+)  Kategori Pemasukan", M + 4, y + 4.5)

  // Expense header pill
  doc.setFillColor(...C.redLight)
  doc.setDrawColor(...C.red)
  doc.roundedRect(M + halfW + 5, y - 1, halfW, 7, 1.5, 1.5, "FD")
  doc.setTextColor(...C.red)
  doc.text("(-)  Kategori Pengeluaran", M + halfW + 9, y + 4.5)

  const incomeCats = categoryMap("income")
  const expenseCats = categoryMap("expense")

  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M + halfW + 5 },
    head: [["Kategori", "Total", "Porsi"]],
    body: incomeCats.length ? incomeCats : [["(Tidak ada)", "", ""]],
    theme: "plain",
    headStyles: { fillColor: C.greenDark, textColor: C.white, fontSize: 7, fontStyle: "bold", cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 2 } },
    bodyStyles: { fillColor: C.pageBg, textColor: C.textBody, fontSize: 7.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 2 } },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: { 1: { halign: "right", textColor: C.textMed }, 2: { halign: "right", textColor: C.green, fontStyle: "bold" } },
    tableLineColor: C.borderGray,
    tableLineWidth: 0.2,
  })

  const catEndLeft = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: y + 8,
    margin: { left: M + halfW + 5, right: M },
    head: [["Kategori", "Total", "Porsi"]],
    body: expenseCats.length ? expenseCats : [["(Tidak ada)", "", ""]],
    theme: "plain",
    headStyles: { fillColor: C.redDark, textColor: C.white, fontSize: 7, fontStyle: "bold", cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 2 } },
    bodyStyles: { fillColor: C.pageBg, textColor: C.textBody, fontSize: 7.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 2 } },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: { 1: { halign: "right", textColor: C.textMed }, 2: { halign: "right", textColor: C.red, fontStyle: "bold" } },
    tableLineColor: C.borderGray,
    tableLineWidth: 0.2,
  })

  y = Math.max(catEndLeft, (doc as any).lastAutoTable.finalY) + 8

  // ── DAILY ESSENTIAL BOX ───────────────────────────────────────────────────
  const EH = 24
  doc.setFillColor(...C.sectionBg)
  doc.setDrawColor(...C.borderGray)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, W, EH, 2, 2, "FD")

  doc.setTextColor(...C.textMed)
  doc.setFontSize(6.5)
  doc.setFont("helvetica", "bold")
  doc.text("ESTIMASI PENGELUARAN HARIAN POKOK", M + 4, y + 6)

  // Makanan side
  doc.setFillColor(...C.amber)
  doc.rect(M + 4, y + 9, 2.5, 10, "F")
  doc.setTextColor(...C.textMed)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Makanan", M + 10, y + 14)
  doc.setTextColor(...C.amber)
  doc.setFont("helvetica", "bold")
  doc.text(`${rp(makananTotal / cycleDays)}/hari  (total: ${rp(makananTotal)})`, M + 10, y + 20)

  // Transportasi side
  const MX = M + W / 2 + 4
  doc.setFillColor(...C.sky)
  doc.rect(MX, y + 9, 2.5, 10, "F")
  doc.setTextColor(...C.textMed)
  doc.setFont("helvetica", "normal")
  doc.text("Transportasi", MX + 5, y + 14)
  doc.setTextColor(...C.sky)
  doc.setFont("helvetica", "bold")
  doc.text(`${rp(transportasiTotal / cycleDays)}/hari  (total: ${rp(transportasiTotal)})`, MX + 5, y + 20)

  y += EH + 8

  // ── INCOME DETAIL TABLE ───────────────────────────────────────────────────
  doc.setFillColor(...C.greenLight)
  doc.setDrawColor(...C.green)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y - 1, 60, 7, 1.5, 1.5, "FD")
  doc.setTextColor(...C.green)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("(+)  Daftar Pemasukan", M + 4, y + 4.5)

  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    head: [["Tanggal", "Sumber / Keterangan", "Kategori", "Catatan", "Jumlah"]],
    body: incomeItems.length
      ? incomeItems.map((t) => [shortDate(t.transaction_date), t.title, t.category?.name ?? "-", t.notes ?? "-", rp(t.amount)])
      : [["", "(Tidak ada pemasukan di periode ini)", "", "", ""]],
    theme: "plain",
    headStyles: { fillColor: C.greenDark, textColor: C.white, fontSize: 7, fontStyle: "bold", cellPadding: { top: 3, bottom: 3, left: 4, right: 3 } },
    bodyStyles: { fillColor: C.pageBg, textColor: C.textBody, fontSize: 7.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 3 } },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 23 },
      1: { cellWidth: 42 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
      4: { halign: "right", cellWidth: 30, textColor: C.green, fontStyle: "bold" },
    },
    tableLineColor: C.borderGray,
    tableLineWidth: 0.2,
    foot: [[{ content: `Total Pemasukan: ${rp(summary.income)}`, colSpan: 5, styles: { halign: "right", textColor: C.green, fontStyle: "bold", fontSize: 8, fillColor: C.greenLight } }]],
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── EXPENSE DETAIL TABLE ──────────────────────────────────────────────────
  doc.setFillColor(...C.redLight)
  doc.setDrawColor(...C.red)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y - 1, 60, 7, 1.5, 1.5, "FD")
  doc.setTextColor(...C.red)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("(-)  Daftar Pengeluaran", M + 4, y + 4.5)

  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    head: [["Tanggal", "Item / Keterangan", "Kategori", "Catatan", "Jumlah"]],
    body: expenseItems.length
      ? expenseItems.map((t) => [shortDate(t.transaction_date), t.title, t.category?.name ?? "-", t.notes ?? "-", rp(t.amount)])
      : [["", "(Tidak ada pengeluaran di periode ini)", "", "", ""]],
    theme: "plain",
    headStyles: { fillColor: C.redDark, textColor: C.white, fontSize: 7, fontStyle: "bold", cellPadding: { top: 3, bottom: 3, left: 4, right: 3 } },
    bodyStyles: { fillColor: C.pageBg, textColor: C.textBody, fontSize: 7.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 3 } },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 23 },
      1: { cellWidth: 42 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
      4: { halign: "right", cellWidth: 30, textColor: C.red, fontStyle: "bold" },
    },
    tableLineColor: C.borderGray,
    tableLineWidth: 0.2,
    foot: [[{ content: `Total Pengeluaran: ${rp(summary.expense)}`, colSpan: 5, styles: { halign: "right", textColor: C.red, fontStyle: "bold", fontSize: 8, fillColor: C.redLight } }]],
  })

  // ── FOOTER ON EVERY PAGE ─────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...C.indigoDark)
    doc.rect(0, pageH - 8, pageW, 8, "F")
    doc.setTextColor(...C.white)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.text("kekayaan.id — Laporan Arus Kas Bulanan", M, pageH - 2.5)
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW - M, pageH - 2.5, { align: "right" })
  }

  const fileName = `laporan-keuangan_${selectedStart.toISOString().slice(0, 10)}_${selectedEnd.toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
