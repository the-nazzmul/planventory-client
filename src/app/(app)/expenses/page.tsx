"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { ExpensesCreateForm } from "@/components/record-create-forms"
import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateResource } from "@/lib/api/resources"
import { formatCurrency, formatDate } from "@/lib/format"

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function expenseCategoryVariant(cat: string): BadgeVariant {
  switch (cat) {
    case "OPERATIONAL":
      return "secondary"
    case "INVENTORY":
      return "info"
    case "MARKETING":
      return "warning"
    case "PAYROLL":
      return "default"
    case "UTILITIES":
      return "outline"
    default:
      return "secondary"
  }
}

const columns: Column[] = [
  {
    header: "Reference",
    cell: (row) => (
      <span className="font-medium">{String(row.reference ?? "—")}</span>
    ),
  },
  {
    header: "Category",
    cell: (row) => {
      const cat = String(row.category ?? "")
      return (
        <Badge variant={expenseCategoryVariant(cat)}>
          {cat.replace(/_/g, " ")}
        </Badge>
      )
    },
  },
  {
    header: "Amount",
    cell: (row) => (
      <span className="font-medium">
        {formatCurrency(row.amount as number | undefined)}
      </span>
    ),
  },
  {
    header: "Description",
    cell: (row) => (
      <span className="max-w-[300px] truncate text-muted-foreground">
        {String(row.description ?? "—")}
      </span>
    ),
    className: "max-w-[300px]",
  },
  {
    header: "Date",
    cell: (row) => formatDate(row.date as string | undefined),
  },
]

export default function ExpensesPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)
  const { toast } = useToast()
  const [editing, setEditing] = React.useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [amount, setAmount] = React.useState("0")
  const [category, setCategory] = React.useState("OPERATIONAL")
  const [description, setDescription] = React.useState("")

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.id) return
    try {
      setSaving(true)
      await updateResource(`/expenses/${String(editing.id)}`, {
        amount: Number(amount),
        category,
        description,
      })
      toast({ title: "Expense updated", description: "Expense details saved." })
      setEditing(null)
      await shellRef.current?.refresh()
    } catch (error) {
      toast({
        title: "Update expense failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <ExpensesCreateForm onCreated={() => shellRef.current?.refresh()} />
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveEdit}>
              <div className="space-y-2">
                <Label htmlFor="expense-edit-amount">Amount</Label>
                <Input id="expense-edit-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-edit-category">Category</Label>
                <Input id="expense-edit-category" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expense-edit-description">Description</Label>
                <Textarea id="expense-edit-description" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataPageShell
        ref={shellRef}
        title="Expenses"
        description="Track expense entries and monitor operational spending."
        listPath="/expenses"
        columns={columns}
        canEdit
        onEditClick={(row) => {
          setEditing(row)
          setAmount(String(row.amount ?? "0"))
          setCategory(String(row.category ?? "OPERATIONAL"))
          setDescription(String(row.description ?? ""))
        }}
      />
    </div>
  )
}
