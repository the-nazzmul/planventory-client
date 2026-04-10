"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { CategoriesCreateForm } from "@/components/record-create-forms"
import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateResource } from "@/lib/api/resources"

const columns: Column[] = [
  {
    header: "Name",
    cell: (row) => (
      <span className="font-medium">{String(row.name ?? "—")}</span>
    ),
  },
  {
    header: "Slug",
    cell: (row) => (
      <span className="text-muted-foreground">{String(row.slug ?? "—")}</span>
    ),
  },
  {
    header: "Products",
    cell: (row) => {
      const count = (row._count as { products?: number } | undefined)
      return String(count?.products ?? 0)
    },
  },
  {
    header: "Parent",
    cell: (row) => {
      const parent = row.parent as { name?: string } | null | undefined
      return parent?.name ?? "—"
    },
  },
]

export default function CategoriesPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)
  const { toast } = useToast()
  const [editing, setEditing] = React.useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.id) return
    try {
      setSaving(true)
      await updateResource(`/categories/${String(editing.id)}`, { name })
      toast({ title: "Category updated", description: "Category details saved." })
      setEditing(null)
      await shellRef.current?.refresh()
    } catch (error) {
      toast({
        title: "Update category failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <CategoriesCreateForm onCreated={() => shellRef.current?.refresh()} />
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap items-end gap-3" onSubmit={onSaveEdit}>
              <div className="space-y-2">
                <Label htmlFor="category-edit-name">Name</Label>
                <Input id="category-edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <DataPageShell
        ref={shellRef}
        title="Categories"
        description="Organize products with hierarchical categories."
        listPath="/categories"
        deletePathBase="/categories"
        columns={columns}
        canEdit
        onEditClick={(row) => {
          setEditing(row)
          setName(String(row.name ?? ""))
        }}
      />
    </div>
  )
}
