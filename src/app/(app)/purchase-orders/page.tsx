"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { PurchaseOrdersCreateForm } from "@/components/record-create-forms"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function poStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PENDING":
      return "warning"
    case "ORDERED":
      return "info"
    case "RECEIVED":
      return "success"
    case "CANCELLED":
      return "destructive"
    default:
      return "secondary"
  }
}

const columns: Column[] = [
  {
    header: "Supplier",
    cell: (row) => {
      const supplier = row.supplier as { name?: string } | undefined
      return (
        <span className="font-medium">
          {supplier?.name ?? "—"}
        </span>
      )
    },
  },
  {
    header: "Status",
    cell: (row) => {
      const s = String(row.status ?? "")
      return <Badge variant={poStatusVariant(s)}>{s.replace(/_/g, " ")}</Badge>
    },
  },
  {
    header: "Total",
    cell: (row) => (
      <span className="font-medium">
        {formatCurrency(row.totalAmount as number | undefined)}
      </span>
    ),
  },
  {
    header: "Items",
    cell: (row) => {
      const items = row.items as unknown[] | undefined
      return String(items?.length ?? 0)
    },
  },
  {
    header: "Ordered",
    cell: (row) => formatDate(row.orderedAt as string | undefined),
  },
  {
    header: "Received",
    cell: (row) => formatDate(row.receivedAt as string | undefined),
  },
]

export default function PurchaseOrdersPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)

  return (
    <div className="space-y-4">
      <PurchaseOrdersCreateForm onCreated={() => shellRef.current?.refresh()} />
      <DataPageShell
        ref={shellRef}
        title="Purchase Orders"
        description="Create and monitor purchase orders against your suppliers."
        listPath="/purchase-orders"
        columns={columns}
      />
    </div>
  )
}
