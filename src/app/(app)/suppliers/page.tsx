"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { SuppliersCreateForm } from "@/components/record-create-forms"
import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"
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
    header: "Email",
    cell: (row) => (
      <span className="text-muted-foreground">{String(row.email ?? "—")}</span>
    ),
  },
  { header: "Phone", cell: (row) => String(row.phone ?? "—") },
  {
    header: "Purchase Orders",
    cell: (row) => {
      const count = (row._count as { purchaseOrders?: number } | undefined)
      return String(count?.purchaseOrders ?? 0)
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

export default function SuppliersPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)
  const { toast } = useToast()
  const [editing, setEditing] = React.useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing?.id) return
    try {
      setSaving(true)
      await updateResource(`/suppliers/${String(editing.id)}`, { name, email, phone })
      toast({ title: "Supplier updated", description: "Supplier details saved." })
      setEditing(null)
      await shellRef.current?.refresh()
    } catch (error) {
      toast({
        title: "Update supplier failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SuppliersCreateForm onCreated={() => shellRef.current?.refresh()} />
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveEdit}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplier-edit-name">Name</Label>
                <Input id="supplier-edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-edit-email">Email</Label>
                <Input id="supplier-edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-edit-phone">Phone</Label>
                <Input id="supplier-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
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
        title="Suppliers"
        description="Manage supplier records and contact details."
        listPath="/suppliers"
        deletePathBase="/suppliers"
        columns={columns}
        canEdit
        onEditClick={(row) => {
          setEditing(row)
          setName(String(row.name ?? ""))
          setEmail(String(row.email ?? ""))
          setPhone(String(row.phone ?? ""))
        }}
      />
    </div>
  )
}
