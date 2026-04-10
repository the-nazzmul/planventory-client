"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { ReturnsCreateForm } from "@/components/record-create-forms"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"

const columns: Column[] = [
  {
    header: "Order",
    cell: (row) => {
      const order = row.order as { orderNumber?: string } | undefined
      return (
        <span className="font-medium">
          {order?.orderNumber ?? "—"}
        </span>
      )
    },
  },
  {
    header: "Reason",
    cell: (row) => (
      <span className="max-w-[250px] truncate text-muted-foreground">
        {String(row.reason ?? "—")}
      </span>
    ),
    className: "max-w-[250px]",
  },
  {
    header: "Refund",
    cell: (row) => (
      <span className="font-medium">
        {formatCurrency(row.refundAmount as number | undefined)}
      </span>
    ),
  },
  {
    header: "Restocked",
    cell: (row) => (
      <Badge variant={row.restocked ? "success" : "outline"}>
        {row.restocked ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    header: "Date",
    cell: (row) => formatDate(row.createdAt as string | undefined),
  },
]

export default function ReturnsPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)

  return (
    <div className="space-y-4">
      <ReturnsCreateForm onCreated={() => shellRef.current?.refresh()} />
      <DataPageShell
        ref={shellRef}
        title="Returns"
        description="Manage return requests and restock operations."
        listPath="/returns"
        detailPathBase="/returns"
        columns={columns}
      />
    </div>
  )
}
