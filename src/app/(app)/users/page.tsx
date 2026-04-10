"use client"

import * as React from "react"

import { DataPageShell, type Column, type DataPageShellRef } from "@/components/data-page-shell"
import { UsersCreateForm } from "@/components/record-create-forms"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function roleVariant(role: string): BadgeVariant {
  switch (role) {
    case "SUPER_ADMIN":
      return "default"
    case "MANAGER":
      return "info"
    case "WAREHOUSE":
      return "warning"
    case "STAFF":
      return "secondary"
    default:
      return "outline"
  }
}

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
  {
    header: "Role",
    cell: (row) => {
      const role = String(row.role ?? "")
      return (
        <Badge variant={roleVariant(role)}>{role.replace(/_/g, " ")}</Badge>
      )
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
  {
    header: "Joined",
    cell: (row) => formatDate(row.createdAt as string | undefined),
  },
]

export default function UsersPage() {
  const shellRef = React.useRef<DataPageShellRef>(null)

  return (
    <div className="space-y-4">
      <UsersCreateForm onCreated={() => shellRef.current?.refresh()} />
      <DataPageShell
        ref={shellRef}
        title="Users"
        description="Manage user accounts and role-based access."
        listPath="/users"
        columns={columns}
      />
    </div>
  )
}
