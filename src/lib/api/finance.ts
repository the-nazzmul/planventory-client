import { apiClient, unwrapEnvelope } from "@/lib/api-client"
import type { ApiEnvelope } from "@/lib/types"

export type FinanceOverviewRaw = {
  revenue?: { total?: number; thisMonth?: number; lastMonth?: number }
  expenses?: { total?: number; byCategory?: unknown[] }
  netProfit?: number
  grossProfit?: number
  grossMargin?: number
  cogs?: number
  orders?: { total?: number; pending?: number; delivered?: number; cancelled?: number }
  [key: string]: unknown
}

export type FinanceOverview = {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalOrders: number
  grossProfit: number
  grossMargin: number
}

export type FinanceReportItem = {
  month?: string
  revenue?: number
  expenses?: number
  profit?: number
  [key: string]: unknown
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  const raw = await unwrapEnvelope(
    apiClient.get<ApiEnvelope<FinanceOverviewRaw>>("/finance/overview"),
  )
  return {
    totalRevenue: raw.revenue?.total ?? 0,
    totalExpenses: raw.expenses?.total ?? 0,
    netProfit: raw.netProfit ?? 0,
    totalOrders: raw.orders?.total ?? 0,
    grossProfit: raw.grossProfit ?? 0,
    grossMargin: raw.grossMargin ?? 0,
  }
}

export async function getFinanceReport(year: number, period: "monthly" | "yearly" = "monthly") {
  const data = await unwrapEnvelope(
    apiClient.get<ApiEnvelope<{ rows?: FinanceReportItem[]; [key: string]: unknown } | FinanceReportItem[]>>(
      "/finance/reports",
      {
        params: { year, period },
      },
    ),
  )
  if (Array.isArray(data)) return data
  if (Array.isArray(data.rows)) return data.rows
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value as FinanceReportItem[]
  }
  return []
}
