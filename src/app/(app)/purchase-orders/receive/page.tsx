"use client"

import * as React from "react"

import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, unwrapEnvelope } from "@/lib/api-client"
import type { ApiEnvelope } from "@/lib/types"

export default function ReceivePurchaseOrderPage() {
  const { toast } = useToast()
  const [purchaseOrderId, setPurchaseOrderId] = React.useState("")
  const [variantId, setVariantId] = React.useState("")
  const [receivedQty, setReceivedQty] = React.useState("1")
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await unwrapEnvelope(
        apiClient.post<ApiEnvelope<{ received: boolean }>>(
          `/purchase-orders/${purchaseOrderId}/receive`,
          {
            items: [
              {
                variantId,
                receivedQty: Number(receivedQty),
              },
            ],
          },
        ),
      )
      toast({
        title: "Purchase order received",
        description: "Stock has been updated from received quantity.",
      })
      setVariantId("")
      setReceivedQty("1")
    } catch (error) {
      toast({
        title: "Receive failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Purchase Order</CardTitle>
        <CardDescription>
          Confirm received inventory quantities against a purchase order ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:max-w-xl" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="po-id">Purchase Order ID</Label>
            <Input
              id="po-id"
              value={purchaseOrderId}
              onChange={(event) => setPurchaseOrderId(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant-id">Variant ID</Label>
            <Input
              id="variant-id"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="received-qty">Received Quantity</Label>
            <Input
              id="received-qty"
              type="number"
              min={1}
              value={receivedQty}
              onChange={(event) => setReceivedQty(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Receive items"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
