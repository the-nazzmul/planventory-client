"use client"

import { getFinanceOverview, getFinanceReport } from "@/lib/api/finance"
import { getCollection, type CollectionResult } from "@/lib/api/resources"

type ProductVariant = {
  stock?: number
  lowStockAlert?: number
  costPrice?: number
}

type ProductRow = {
  category?: { name?: string }
  variants?: ProductVariant[]
}

type OrderItem = {
  quantity?: number
  totalPrice?: number
  variant?: { product?: { name?: string } }
}

type OrderRow = {
  status?: string
  items?: OrderItem[]
  createdAt?: string
}

type StatusDatum = { name: string; value: number; fill: string }
type TrendDatum = { month: string; revenue: number; expenses: number; profit: number }
type TopProductDatum = { name: string; revenue: number; units: number }
type CategoryDatum = { name: string; value: number; fill: string }

export type DashboardOverviewData = {
  kpis: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalOrders: number
    grossMargin: number
  }
  inventoryStatus: StatusDatum[]
  orderStatus: StatusDatum[]
  monthlyTrend: TrendDatum[]
  topProducts: TopProductDatum[]
  categoryMix: CategoryDatum[]
}

export async function getDashboardAvailableYears(): Promise<number[]> {
  const orders = await fetchAllCollection<OrderRow>("/orders")
  const currentYear = new Date().getFullYear()
  const years = new Set<number>([currentYear])

  for (const order of orders) {
    const raw = order.createdAt
    if (!raw) continue
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) continue
    years.add(parsed.getFullYear())
  }

  return Array.from(years).sort((a, b) => b - a)
}

const PIE_COLORS = [
  "oklch(0.64 0.18 255)",
  "oklch(0.72 0.15 163)",
  "oklch(0.74 0.17 75)",
  "oklch(0.67 0.2 28)",
  "oklch(0.66 0.19 20)",
  "oklch(0.69 0.14 210)",
]

async function fetchAllCollection<T>(path: string, limit = 100): Promise<T[]> {
  let cursor: string | null = null
  let hasMore = true
  const rows: T[] = []
  let pageCount = 0

  while (hasMore && pageCount < 30) {
    const page: CollectionResult<T> = await getCollection<T>(path, {
      limit,
      cursor: cursor ?? undefined,
    })
    rows.push(...page.items)
    cursor = page.meta.cursor
    hasMore = page.meta.hasMore
    pageCount += 1
  }

  return rows
}

export async function getDashboardOverviewData(year: number): Promise<DashboardOverviewData> {
  const [financeOverview, monthlyReport, products, orders] = await Promise.all([
    getFinanceOverview(),
    getFinanceReport(year, "monthly"),
    fetchAllCollection<ProductRow>("/products"),
    fetchAllCollection<OrderRow>("/orders"),
  ])

  let inStock = 0
  let lowStock = 0
  let outOfStock = 0

  const categoryValueMap = new Map<string, number>()

  for (const product of products) {
    const categoryName = product.category?.name?.trim() || "Uncategorized"
    const variants = product.variants ?? []

    for (const variant of variants) {
      const stock = variant.stock ?? 0
      const alert = variant.lowStockAlert ?? 15

      if (stock <= 0) outOfStock += 1
      else if (stock <= alert) lowStock += 1
      else inStock += 1

      const stockValue = (variant.costPrice ?? 0) * stock
      categoryValueMap.set(categoryName, (categoryValueMap.get(categoryName) ?? 0) + stockValue)
    }
  }

  const statusMap = new Map<string, number>()
  const productPerfMap = new Map<string, { revenue: number; units: number }>()

  for (const order of orders) {
    const status = order.status ?? "UNKNOWN"
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)

    for (const item of order.items ?? []) {
      const productName = item.variant?.product?.name?.trim() || "Unknown Product"
      const existing = productPerfMap.get(productName) ?? { revenue: 0, units: 0 }
      existing.revenue += item.totalPrice ?? 0
      existing.units += item.quantity ?? 0
      productPerfMap.set(productName, existing)
    }
  }

  const inventoryStatus: StatusDatum[] = [
    { name: "In stock", value: inStock, fill: PIE_COLORS[1] },
    { name: "Low stock", value: lowStock, fill: PIE_COLORS[3] },
    { name: "Out of stock", value: outOfStock, fill: PIE_COLORS[4] },
  ]

  const orderStatus: StatusDatum[] = Array.from(statusMap.entries()).map(([name, value], index) => ({
    name: name.replaceAll("_", " "),
    value,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }))

  const monthlyTrend: TrendDatum[] = monthlyReport.map((item) => ({
    month: item.month ?? "",
    revenue: (item.revenue ?? 0) / 100,
    expenses: (item.expenses ?? 0) / 100,
    profit: ((item.revenue ?? 0) - (item.expenses ?? 0)) / 100,
  }))

  const topProducts: TopProductDatum[] = Array.from(productPerfMap.entries())
    .map(([name, totals]) => ({
      name,
      revenue: totals.revenue / 100,
      units: totals.units,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const categoryMix: CategoryDatum[] = Array.from(categoryValueMap.entries())
    .map(([name, value], index) => ({
      name,
      value: value / 100,
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return {
    kpis: {
      totalRevenue: financeOverview.totalRevenue,
      totalExpenses: financeOverview.totalExpenses,
      netProfit: financeOverview.netProfit,
      totalOrders: financeOverview.totalOrders,
      grossMargin: financeOverview.grossMargin,
    },
    inventoryStatus,
    orderStatus,
    monthlyTrend,
    topProducts,
    categoryMix,
  }
}

