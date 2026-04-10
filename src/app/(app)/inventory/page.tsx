"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

function nested(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((obj, key) => {
    if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key]
    return undefined
  }, row)
}

const columns: Column[] = [
  {
    header: "Product",
    cell: (row) => (
      <span className="font-medium">{String(row.name ?? "—")}</span>
    ),
  },
  { header: "SKU", cell: (row) => String(row.sku ?? "—") },
  {
    header: "Brand",
    cell: (row) => String(nested(row, "brand.name") ?? "—"),
  },
  {
    header: "Category",
    cell: (row) => String(nested(row, "category.name") ?? "—"),
  },
  {
    header: "Total Stock",
    cell: (row) => {
      const variants = row.variants as { stock?: number; lowStockAlert?: number }[] | undefined
      if (!variants?.length) return "—"
      const total = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
      const alertLevel = variants[0]?.lowStockAlert ?? 15
      const low = total <= alertLevel
      return low ? (
        <Badge variant="warning">{total.toLocaleString()} (Low)</Badge>
      ) : (
        <span className="font-medium">{total.toLocaleString()}</span>
      )
    },
  },
  {
    header: "Variants",
    cell: (row) => {
      const variants = row.variants as unknown[] | undefined
      return String(variants?.length ?? 0)
    },
  },
  {
    header: "Value",
    cell: (row) => {
      const variants = row.variants as { stock?: number; costPrice?: number }[] | undefined
      if (!variants?.length) return "—"
      const total = variants.reduce(
        (sum, v) => sum + (v.stock ?? 0) * (v.costPrice ?? 0),
        0,
      )
      return formatCurrency(total)
    },
  },
  {
    header: "Status",
    cell: (row) => (
      <Badge variant={row.isActive ? "success" : "destructive"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
]

export default function InventoryPage() {
  return (
    <DataPageShell
      title="Inventory"
      description="Current stock levels and inventory valuation across all products."
      listPath="/products"
      detailPathBase="/products"
      columns={columns}
    />
  )
}
