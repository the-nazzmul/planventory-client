"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { OrdersCreateForm } from "@/components/record-create-forms"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PENDING":
      return "warning"
    case "CONFIRMED":
    case "PROCESSING":
    case "SHIPPED":
      return "info"
    case "DELIVERED":
      return "success"
    case "CANCELLED":
      return "destructive"
    default:
      return "secondary"
  }
}

const columns: Column[] = [
  {
    header: "Order #",
    cell: (row) => (
      <span className="font-medium">{String(row.orderNumber ?? "—")}</span>
    ),
  },
  {
    header: "Customer",
    cell: (row) => (
      <div>
        <div className="font-medium">{String(row.customerName ?? "—")}</div>
        <div className="text-xs text-muted-foreground">
          {String(row.customerEmail ?? "")}
        </div>
      </div>
    ),
  },
  {
    header: "Status",
    cell: (row) => {
      const s = String(row.status ?? "")
      return <Badge variant={orderStatusVariant(s)}>{s.replace(/_/g, " ")}</Badge>
    },
  },
  {
    header: "Total",
    cell: (row) => formatCurrency(row.totalAmount as number | undefined),
  },
  {
    header: "Date",
    cell: (row) => formatDate(row.createdAt as string | undefined),
  },
]

export default function OrdersPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)

  return (
    <div className="space-y-4">
      <OrdersCreateForm onCreated={() => shellRef.current?.refresh()} />
      <DataPageShell
        ref={shellRef}
        title="Orders"
        description="Track customer orders and update statuses."
        listPath="/orders"
        detailPathBase="/orders"
        columns={columns}
      />
    </div>
  )
}
