"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Package, RefreshCw, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react"

import { getDashboardAvailableYears, getDashboardOverviewData, type DashboardOverviewData } from "@/lib/api/dashboard"
import { formatCurrency } from "@/lib/format"
import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const DASHBOARD_CHART_COLORS = [
  "oklch(0.64 0.18 255)",
  "oklch(0.72 0.15 163)",
  "oklch(0.74 0.17 75)",
  "oklch(0.67 0.2 28)",
  "oklch(0.66 0.19 20)",
  "oklch(0.69 0.14 210)",
]

function truncateLabel(label: string, max = 24) {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

function formatMonthShort(value: string) {
  if (!value) return "—"
  const [year, month] = value.split("-")
  if (!year || !month) return value
  return `${year.slice(-2)}-${month}`
}

export function DashboardOverview() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<DashboardOverviewData | null>(null)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [yearOptions, setYearOptions] = React.useState<number[]>([new Date().getFullYear()])

  React.useEffect(() => {
    let active = true
    void getDashboardAvailableYears()
      .then((years) => {
        if (!active || years.length === 0) return
        setYearOptions(years)
        if (!years.includes(year)) setYear(years[0])
      })
      .catch(() => {
        // keep fallback current year
      })
    return () => {
      active = false
    }
  }, [year])

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await getDashboardOverviewData(year)
      setData(response)
    } catch (error) {
      toast({
        title: "Dashboard failed to load",
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
      value: data ? formatCurrency(data.kpis.totalRevenue) : "—",
      icon: TrendingUp,
    },
    {
      label: "Expenses",
      value: data ? formatCurrency(data.kpis.totalExpenses) : "—",
      icon: TrendingDown,
    },
    {
      label: "Net Profit",
      value: data ? formatCurrency(data.kpis.netProfit) : "—",
      icon: TrendingUp,
    },
    {
      label: "Orders",
      value: data ? String(data.kpis.totalOrders) : "—",
      icon: ShoppingCart,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Operational Overview</h2>
          <p className="text-sm text-muted-foreground">Inventory, order flow, category mix, and monthly trend.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription>Inventory Health</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex min-h-10 items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              Gross Margin: {loading || !data ? "—" : `${data.kpis.grossMargin.toFixed(2)}%`}
            </CardTitle>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <kpi.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-bold">{kpi.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>In stock vs low stock vs out of stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !data || data.inventoryStatus.every((row) => row.value === 0) ? (
              <EmptyChartState label="No inventory status data found." />
            ) : (
              <>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent />} formatter={(value: number) => Number(value).toLocaleString()} />
                      <Pie data={data.inventoryStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={100}>
                        {data.inventoryStatus.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <ChartLegend items={data.inventoryStatus.map((row) => ({ label: row.name, color: row.fill }))} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Mix</CardTitle>
            <CardDescription>Distribution of order lifecycle statuses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !data || data.orderStatus.length === 0 ? (
              <EmptyChartState label="No order status data found." />
            ) : (
              <>
                <ChartContainer className="pb-6 sm:pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent />} formatter={(value: number) => Number(value).toLocaleString()} />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Pie data={data.orderStatus} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105}>
                        {data.orderStatus.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Monthly Trend ({year})</CardTitle>
                <CardDescription>Revenue, expenses, and profit over time.</CardDescription>
              </div>
              <select
                aria-label="Select monthly trend year"
                value={String(year)}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {yearOptions.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !data || data.monthlyTrend.length === 0 ? (
              <EmptyChartState label={`No monthly trend data found for ${year}.`} />
            ) : (
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)" }} tickFormatter={formatMonthShort} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)" }} />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(label) => formatMonthShort(String(label))}
                      formatter={(value: number) => currencyFormatter.format(Number(value))}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke={DASHBOARD_CHART_COLORS[0]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke={DASHBOARD_CHART_COLORS[2]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="profit" name="Profit" stroke={DASHBOARD_CHART_COLORS[1]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Highest revenue products from order items.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !data || data.topProducts.length === 0 ? (
              <EmptyChartState label="No product performance data found." />
            ) : (
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)" }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={200}
                      interval={0}
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                      tickFormatter={(value) => truncateLabel(String(value), 28)}
                    />
                    <Tooltip content={<ChartTooltipContent />} formatter={(value: number) => currencyFormatter.format(Number(value))} />
                    <Bar dataKey="revenue" name="Revenue" fill={DASHBOARD_CHART_COLORS[4]} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Mix</CardTitle>
            <CardDescription>Inventory value split by category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !data || data.categoryMix.length === 0 ? (
              <EmptyChartState label="No category mix data found." />
            ) : (
              <>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent />} formatter={(value: number) => currencyFormatter.format(Number(value))} />
                      <Pie data={data.categoryMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={102}>
                        {data.categoryMix.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <ChartLegend items={data.categoryMix.map((row) => ({ label: row.name, color: row.fill }))} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  )
}

