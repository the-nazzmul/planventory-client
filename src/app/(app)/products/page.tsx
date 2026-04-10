"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { ProductsCreateForm } from "@/components/record-create-forms"
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
    header: "Name",
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
    header: "Stock",
    cell: (row) => {
      const variants = row.variants as { stock?: number }[] | undefined
      if (!variants?.length) return "—"
      const total = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
      const low = variants.some((v) => (v.stock ?? 0) <= 15)
      return (
        <span className={low ? "font-medium text-amber-500" : ""}>
          {total.toLocaleString()}
        </span>
      )
    },
  },
  {
    header: "Price",
    cell: (row) => {
      const variants = row.variants as { sellingPrice?: number }[] | undefined
      if (!variants?.length) return "—"
      return formatCurrency(variants[0].sellingPrice)
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

export default function ProductsPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)

  return (
    <div className="space-y-4">
      <ProductsCreateForm onCreated={() => shellRef.current?.refresh()} />
      <DataPageShell
        ref={shellRef}
        title="Products"
        description="Manage your product catalog and variant information."
        listPath="/products"
        deletePathBase="/products"
        detailPathBase="/products"
        columns={columns}
      />
    </div>
  )
}
