"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getResource } from "@/lib/api/resources"
import { formatCurrency, formatDate } from "@/lib/format"

type ReturnItem = {
  variantId: string
  quantity: number
  reason: string
}

type ReturnRecord = {
  id: string
  orderId: string
  reason: string
  items: ReturnItem[]
  refundAmount: number
  restocked: boolean
  processedBy?: string
  createdAt: string
  order?: {
    id: string
    orderNumber: string
    status: string
  }
}

export default function ReturnDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [record, setRecord] = React.useState<ReturnRecord | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    getResource<ReturnRecord>(`/returns/${params.id}`)
      .then(setRecord)
      .catch((error) =>
        toast({
          title: "Failed to load return",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false))
  }, [params.id, toast])

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!record) {
    return (
      <Card>
        <CardHeader><CardTitle>Return Not Found</CardTitle></CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Return Details</CardTitle>
              <CardDescription>
                Order: {record.order?.orderNumber ?? record.orderId}
              </CardDescription>
            </div>
            <Badge variant={record.restocked ? "success" : "warning"}>
              {record.restocked ? "Restocked" : "Not Restocked"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Refund Amount</dt>
              <dd className="text-lg font-bold">{formatCurrency(record.refundAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Order Status</dt>
              <dd>
                <Badge variant="outline">
                  {record.order?.status?.replace(/_/g, " ") ?? "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{formatDate(record.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Items</dt>
              <dd className="font-medium">{record.items.length}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-md border p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Reason</p>
            <p className="text-sm">{record.reason}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Returned Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">
                      {item.variantId}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
