"use client"

import * as React from "react"

import { DataPageShell, type Column } from "@/components/data-page-shell"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function movementReasonVariant(reason: string): BadgeVariant {
  switch (reason) {
    case "INITIAL":
      return "default"
    case "SALE":
      return "info"
    case "RETURN":
      return "warning"
    case "ADJUSTMENT":
      return "secondary"
    case "PURCHASE":
      return "success"
    case "DAMAGE":
      return "destructive"
    default:
      return "outline"
  }
}

const columns: Column[] = [
  {
    header: "Product",
    cell: (row) => {
      const variant = row.variant as {
        sku?: string
        product?: { name?: string }
      } | undefined
      return (
        <div>
          <div className="font-medium">
            {variant?.product?.name ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {variant?.sku ?? ""}
          </div>
        </div>
      )
    },
  },
  {
    header: "Quantity",
    cell: (row) => {
      const qty = row.quantity as number | undefined
      if (qty == null) return "—"
      const isPositive = qty > 0
      return (
        <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
          {isPositive ? "+" : ""}{qty}
        </span>
      )
    },
  },
  {
    header: "Reason",
    cell: (row) => {
      const reason = String(row.reason ?? "")
      return (
        <Badge variant={movementReasonVariant(reason)}>
          {reason.replace(/_/g, " ")}
        </Badge>
      )
    },
  },
  {
    header: "Notes",
    cell: (row) => (
      <span className="max-w-[250px] truncate text-muted-foreground">
        {String(row.notes ?? "—")}
      </span>
    ),
    className: "max-w-[250px]",
  },
  {
    header: "Performed By",
    cell: (row) => {
      const user = row.user as { name?: string } | undefined
      return user?.name ?? "—"
    },
  },
  {
    header: "Date",
    cell: (row) => formatDate(row.createdAt as string | undefined),
  },
]

export default function StockMovementsPage() {
  return (
    <DataPageShell
      title="Stock Movements"
      description="Review all stock adjustments with reason tracking."
      listPath="/stock-movements"
      columns={columns}
    />
  )
}
