"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { BrandsCreateForm } from "@/components/record-create-forms"
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
]

export default function BrandsPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)
  const { toast } = useToast()
  const [editing, setEditing] = React.useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [logoUrl, setLogoUrl] = React.useState("")

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.id) return
    try {
      setSaving(true)
      await updateResource(`/brands/${String(editing.id)}`, { name, logoUrl: logoUrl || undefined })
      toast({ title: "Brand updated", description: "Brand details saved." })
      setEditing(null)
      await shellRef.current?.refresh()
    } catch (error) {
      toast({
        title: "Update brand failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <BrandsCreateForm onCreated={() => shellRef.current?.refresh()} />
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap items-end gap-3" onSubmit={onSaveEdit}>
              <div className="space-y-2">
                <Label htmlFor="brand-edit-name">Name</Label>
                <Input id="brand-edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-edit-logo">Logo URL (optional)</Label>
                <Input id="brand-edit-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <DataPageShell
        ref={shellRef}
        title="Brands"
        description="Maintain your brand catalog for product attribution."
        listPath="/brands"
        deletePathBase="/brands"
        columns={columns}
        canEdit
        onEditClick={(row) => {
          setEditing(row)
          setName(String(row.name ?? ""))
          setLogoUrl(String(row.logoUrl ?? ""))
        }}
      />
    </div>
  )
}
