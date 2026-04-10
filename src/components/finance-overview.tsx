"use client"

import * as React from "react"
import Link from "next/link"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { getFinanceOverview, getFinanceReport, type FinanceOverview, type FinanceReportItem } from "@/lib/api/finance"
import { formatCurrency } from "@/lib/format"
import { exportPrintableDocument } from "@/lib/print-export"

export function FinanceOverviewSection() {
  const { toast } = useToast()
  const [year, setYear] = React.useState("2025")
  const [overview, setOverview] = React.useState<FinanceOverview | null>(null)
  const [report, setReport] = React.useState<FinanceReportItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const [overviewData, reportData] = await Promise.all([
        getFinanceOverview(),
        getFinanceReport(Number(year), "monthly"),
      ])
      setOverview(overviewData)
      setReport(reportData)
    } catch (error) {
      toast({
        title: "Finance overview failed to load",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, year])

  React.useEffect(() => {
    load()
  }, [load])

  const kpis = [
    {
      label: "Revenue",
      value: overview ? formatCurrency(overview.totalRevenue) : "—",
      icon: DollarSign,
    },
    {
      label: "Expenses",
      value: overview ? formatCurrency(overview.totalExpenses) : "—",
      icon: TrendingDown,
    },
    {
      label: "Net Profit",
      value: overview ? formatCurrency(overview.netProfit) : "—",
      icon: TrendingUp,
    },
    {
      label: "Total Orders",
      value: overview ? String(overview.totalOrders) : "—",
      icon: ShoppingCart,
    },
  ]

  const chartData = report.map((row) => ({
    month: row.month ?? "",
    Revenue: (row.revenue ?? 0) / 100,
    Expenses: (row.expenses ?? 0) / 100,
  }))

  function onExportReport() {
    const rows = report
      .map((row) => {
        const expenses = row.expenses ?? 0
        const revenue = row.revenue ?? 0
        const profit = revenue - expenses
        return `<tr><td>${row.month ?? "—"}</td><td>${formatCurrency(revenue)}</td><td>${formatCurrency(expenses)}</td><td>${formatCurrency(profit)}</td></tr>`
      })
      .join("")
    exportPrintableDocument(
      `Financial Report ${year}`,
      `
      <h1>Financial Report — ${year}</h1>
      <p class="muted">Generated from Planventory dashboard</p>
      <h2>KPIs</h2>
      <p class="kpi">Revenue: ${overview ? formatCurrency(overview.totalRevenue) : "—"}</p>
      <p class="kpi">Expenses: ${overview ? formatCurrency(overview.totalExpenses) : "—"}</p>
      <p class="kpi">Net Profit: ${overview ? formatCurrency(overview.netProfit) : "—"}</p>
      <p class="kpi">Total Orders: ${overview ? overview.totalOrders : "—"}</p>
      <h2>Monthly Breakdown</h2>
      <table>
        <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Profit</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      `,
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <kpi.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Financial Report</CardTitle>
          <CardDescription>Revenue vs expenses breakdown by month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={2000}
                max={2099}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-24"
              />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/expenses">View expenses</Link>
            </Button>
            <Button variant="outline" onClick={onExportReport} disabled={loading || report.length === 0}>
              Export PDF
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No financial data for {year}.
            </div>
          ) : (
            <div className="h-[320px] w-full rounded-md border p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <YAxis className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius)",
                      color: "var(--color-foreground)",
                    }}
                    formatter={(value) =>
                      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value ?? 0))
                    }
                  />
                  <Bar dataKey="Revenue" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
