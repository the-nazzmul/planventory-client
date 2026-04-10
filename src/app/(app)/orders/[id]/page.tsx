"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient, unwrapEnvelope } from "@/lib/api-client"
import { getResource } from "@/lib/api/resources"
import { exportPrintableDocument } from "@/lib/print-export"
import type { ApiEnvelope } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"

type OrderItem = {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variant?: {
    sku?: string
    color?: string
    product?: { name?: string }
  }
}

type Order = {
  id: string
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  shippingAddress?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingCost: number
  totalAmount: number
  notes?: string | null
  trackingNumber?: string | null
  items: OrderItem[]
  processor?: { name?: string } | null
  createdAt: string
}

type BadgeVariant = NonNullable<Parameters<typeof Badge>[0]["variant"]>

function statusVariant(s: string): BadgeVariant {
  switch (s) {
    case "PENDING": return "warning"
    case "CONFIRMED": case "PROCESSING": case "SHIPPED": return "info"
    case "DELIVERED": return "success"
    case "CANCELLED": return "destructive"
    default: return "secondary"
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState("PROCESSING")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [updating, setUpdating] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    getResource<Order>(`/orders/${params.id}`)
      .then((data) => {
        setOrder(data)
        setStatus(data.status)
      })
      .catch((error) =>
        toast({
          title: "Failed to load order",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false))
  }, [params.id, toast])

  React.useEffect(() => {
    load()
  }, [load])

  async function onUpdateStatus(e: React.FormEvent) {
    e.preventDefault()
    try {
      setUpdating(true)
      await unwrapEnvelope(
        apiClient.patch<ApiEnvelope<unknown>>(`/orders/${params.id}/status`, {
          status,
          trackingNumber: trackingNumber || undefined,
        }),
      )
      toast({ title: "Order updated", description: "Status has been changed." })
      load()
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  function onExportInvoice() {
    if (!order) return
    const rows = order.items
      .map(
        (item) => `
          <tr>
            <td>${item.variant?.product?.name ?? "—"}</td>
            <td>${item.variant?.sku ?? "—"}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.totalPrice)}</td>
          </tr>
        `,
      )
      .join("")

    exportPrintableDocument(
      `${order.orderNumber} Invoice`,
      `
      <h1>Invoice — ${order.orderNumber}</h1>
      <p class="muted">${order.customerName} · ${order.customerEmail} · ${formatDate(order.createdAt)}</p>
      <h2>Totals</h2>
      <p class="kpi">Subtotal: ${formatCurrency(order.subtotal)}</p>
      <p class="kpi">Tax: ${formatCurrency(order.taxAmount)}</p>
      <p class="kpi">Discount: ${formatCurrency(order.discountAmount)}</p>
      <p class="kpi">Shipping: ${formatCurrency(order.shippingCost)}</p>
      <p class="kpi"><strong>Total: ${formatCurrency(order.totalAmount)}</strong></p>
      <h2>Items</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      `,
    )
  }

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

  if (!order) {
    return (
      <Card>
        <CardHeader><CardTitle>Order Not Found</CardTitle></CardHeader>
      </Card>
    )
  }

  const addr = order.shippingAddress

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{order.orderNumber}</CardTitle>
              <CardDescription>
                {order.customerName} · {order.customerEmail}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExportInvoice}>Export PDF</Button>
              <Badge variant={statusVariant(order.status)}>
                {order.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatCurrency(order.taxAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Discount</dt>
              <dd>{formatCurrency(order.discountAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{formatCurrency(order.shippingCost)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="text-lg font-bold">{formatCurrency(order.totalAmount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Processed By</dt>
              <dd>{order.processor?.name ?? "—"}</dd>
            </div>
            {order.trackingNumber && (
              <div>
                <dt className="text-muted-foreground">Tracking</dt>
                <dd className="font-medium">{order.trackingNumber}</dd>
              </div>
            )}
          </dl>

          {addr && (
            <div className="mt-4 rounded-md border p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Shipping Address</p>
              <p className="text-sm">
                {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
              </p>
            </div>
          )}

          {order.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>{order.items.length} line item{order.items.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.variant?.product?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.variant?.sku ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{item.variant?.color ?? ""}</div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>Change the order status and optionally add a tracking number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={onUpdateStatus}>
            <div className="space-y-2">
              <Label htmlFor="order-status">Status</Label>
              <select
                id="order-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-tracking">Tracking number</Label>
              <Input
                id="order-tracking"
                placeholder="Optional"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={updating}>
              {updating ? "Updating..." : "Update status"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
