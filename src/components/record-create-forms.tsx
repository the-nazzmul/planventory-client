"use client"

import * as React from "react"

import { useToast } from "@/components/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createResource, getCollection } from "@/lib/api/resources"

type FormProps = {
  onCreated?: () => void | Promise<void>
}

type LookupOption = {
  id: string
  label: string
}

function LookupInput({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: LookupOption[]
  placeholder?: string
}) {
  const listId = `${id}-list`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId}
        required
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </datalist>
    </div>
  )
}

export function SuppliersCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/suppliers", { name, email, phone })
      toast({ title: "Supplier created", description: "Supplier saved successfully." })
      setName("")
      setEmail("")
      setPhone("")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create supplier failed",
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
        <CardTitle>Create Supplier</CardTitle>
        <CardDescription>Add a supplier with primary contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supplier-name">Name</Label>
            <Input id="supplier-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input id="supplier-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input id="supplier-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create supplier"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ExpensesCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [amount, setAmount] = React.useState("0")
  const [category, setCategory] = React.useState("OPERATIONS")
  const [notes, setNotes] = React.useState("")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/expenses", { amount: Number(amount), category, notes })
      toast({ title: "Expense created", description: "Expense entry recorded." })
      setAmount("0")
      setNotes("")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create expense failed",
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
        <CardTitle>Create Expense</CardTitle>
        <CardDescription>Record an operational expense.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <Input id="expense-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Input id="expense-category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="expense-notes">Notes</Label>
            <Textarea id="expense-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create expense"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProductsCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [brandOptions, setBrandOptions] = React.useState<LookupOption[]>([])
  const [categoryOptions, setCategoryOptions] = React.useState<LookupOption[]>([])
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [brandId, setBrandId] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [costPrice, setCostPrice] = React.useState("0")
  const [sellingPrice, setSellingPrice] = React.useState("0")
  const [stock, setStock] = React.useState("0")

  React.useEffect(() => {
    Promise.all([
      getCollection<{ id: string; name?: string }>("/brands", { limit: 100 }),
      getCollection<{ id: string; name?: string }>("/categories", { limit: 100 }),
    ])
      .then(([brands, categories]) => {
        setBrandOptions(brands.items.map((item) => ({ id: item.id, label: item.name ?? item.id })))
        setCategoryOptions(categories.items.map((item) => ({ id: item.id, label: item.name ?? item.id })))
      })
      .catch(() => {
        setBrandOptions([])
        setCategoryOptions([])
      })
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/products", {
        name,
        description,
        brandId,
        categoryId,
        variants: [
          {
            sku,
            costPrice: Number(costPrice),
            sellingPrice: Number(sellingPrice),
            stock: Number(stock),
          },
        ],
      })
      toast({ title: "Product created", description: "Product has been added." })
      setName("")
      setDescription("")
      setSku("")
      setCostPrice("0")
      setSellingPrice("0")
      setStock("0")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create product failed",
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
        <CardTitle>Create Product</CardTitle>
        <CardDescription>Create a product with one initial variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <LookupInput
            id="product-brand"
            label="Brand"
            value={brandId}
            onChange={setBrandId}
            options={brandOptions}
            placeholder="Select brand"
          />
          <LookupInput
            id="product-category"
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder="Select category"
          />
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-stock">Stock</Label>
            <Input id="product-stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-cost">Cost price</Label>
            <Input id="product-cost" type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-selling">Selling price</Label>
            <Input id="product-selling" type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create product"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function OrdersCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [variantOptions, setVariantOptions] = React.useState<LookupOption[]>([])
  const [customerName, setCustomerName] = React.useState("")
  const [customerEmail, setCustomerEmail] = React.useState("")
  const [variantId, setVariantId] = React.useState("")
  const [quantity, setQuantity] = React.useState("1")
  const [shippingStreet, setShippingStreet] = React.useState("")
  const [shippingCity, setShippingCity] = React.useState("")
  const [shippingState, setShippingState] = React.useState("")
  const [shippingZip, setShippingZip] = React.useState("")
  const [shippingCountry, setShippingCountry] = React.useState("US")

  React.useEffect(() => {
    getCollection<{ id: string; sku?: string; product?: { name?: string } }>("/products", { limit: 100 })
      .then((result) => {
        const mapped: LookupOption[] = []
        for (const product of result.items as unknown as Array<{
          variants?: Array<{ id: string; sku?: string }>
          name?: string
        }>) {
          for (const variant of product.variants ?? []) {
            mapped.push({
              id: variant.id,
              label: `${product.name ?? "Product"} — ${variant.sku ?? variant.id}`,
            })
          }
        }
        setVariantOptions(mapped)
      })
      .catch(() => setVariantOptions([]))
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/orders", {
        customerName,
        customerEmail,
        shippingAddress: {
          street: shippingStreet,
          city: shippingCity,
          state: shippingState,
          zip: shippingZip,
          country: shippingCountry,
        },
        items: [{ variantId, quantity: Number(quantity) }],
        idempotencyKey: crypto.randomUUID(),
      })
      toast({ title: "Order created", description: "Order has been submitted." })
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create order failed",
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
        <CardTitle>Create Order</CardTitle>
        <CardDescription>Create a new sales order with one line item.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2"><Label htmlFor="order-customer-name">Customer name</Label><Input id="order-customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="order-customer-email">Customer email</Label><Input id="order-customer-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required /></div>
          <LookupInput
            id="order-variant-id"
            label="Variant"
            value={variantId}
            onChange={setVariantId}
            options={variantOptions}
            placeholder="Select product variant"
          />
          <div className="space-y-2"><Label htmlFor="order-qty">Quantity</Label><Input id="order-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="order-street">Street</Label><Input id="order-street" value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="order-city">City</Label><Input id="order-city" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="order-state">State</Label><Input id="order-state" value={shippingState} onChange={(e) => setShippingState(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="order-zip">Zip</Label><Input id="order-zip" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="order-country">Country</Label><Input id="order-country" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} required /></div>
          <div className="md:col-span-2"><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create order"}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ReturnsCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [orderOptions, setOrderOptions] = React.useState<LookupOption[]>([])
  const [variantOptions, setVariantOptions] = React.useState<LookupOption[]>([])
  const [orderId, setOrderId] = React.useState("")
  const [variantId, setVariantId] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [quantity, setQuantity] = React.useState("1")
  const [refundAmount, setRefundAmount] = React.useState("0")

  React.useEffect(() => {
    Promise.all([
      getCollection<{ id: string; orderNumber?: string; customerName?: string }>("/orders", { limit: 100 }),
      getCollection<{ id: string; name?: string; variants?: Array<{ id: string; sku?: string }> }>("/products", { limit: 100 }),
    ])
      .then(([orders, products]) => {
        setOrderOptions(
          orders.items.map((order) => ({
            id: order.id,
            label: `${order.orderNumber ?? order.id} — ${order.customerName ?? "Customer"}`,
          })),
        )
        const mappedVariants: LookupOption[] = []
        for (const product of products.items as unknown as Array<{
          variants?: Array<{ id: string; sku?: string }>
          name?: string
        }>) {
          for (const variant of product.variants ?? []) {
            mappedVariants.push({
              id: variant.id,
              label: `${product.name ?? "Product"} — ${variant.sku ?? variant.id}`,
            })
          }
        }
        setVariantOptions(mappedVariants)
      })
      .catch(() => {
        setOrderOptions([])
        setVariantOptions([])
      })
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/returns", {
        orderId,
        reason,
        items: [{ variantId, quantity: Number(quantity), reason }],
        restocked: true,
        refundAmount: Number(refundAmount),
      })
      toast({ title: "Return created", description: "Return request has been recorded." })
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create return failed",
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
        <CardTitle>Create Return</CardTitle>
        <CardDescription>Record a return and refund details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <LookupInput
            id="return-order-id"
            label="Order"
            value={orderId}
            onChange={setOrderId}
            options={orderOptions}
            placeholder="Select order"
          />
          <LookupInput
            id="return-variant-id"
            label="Variant"
            value={variantId}
            onChange={setVariantId}
            options={variantOptions}
            placeholder="Select variant"
          />
          <div className="space-y-2 md:col-span-2"><Label htmlFor="return-reason">Reason</Label><Textarea id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="return-qty">Quantity</Label><Input id="return-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="return-refund">Refund amount</Label><Input id="return-refund" type="number" min={0} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} required /></div>
          <div className="md:col-span-2"><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create return"}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

export function CategoriesCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/categories", { name })
      toast({ title: "Category created", description: "Category has been added." })
      setName("")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create category failed",
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
        <CardTitle>Create Category</CardTitle>
        <CardDescription>Add a new product category.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" placeholder="e.g. Electronics" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create category"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function BrandsCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [logoUrl, setLogoUrl] = React.useState("")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/brands", { name, logoUrl: logoUrl || undefined })
      toast({ title: "Brand created", description: "Brand has been added." })
      setName("")
      setLogoUrl("")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create brand failed",
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
        <CardTitle>Create Brand</CardTitle>
        <CardDescription>Add a new brand to the catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="brand-name">Name</Label>
            <Input id="brand-name" placeholder="e.g. Acme Corp" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-logo">Logo URL (optional)</Label>
            <Input id="brand-logo" placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create brand"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function UsersCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState("MANAGER")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/users", { name, email, password, role })
      toast({ title: "User created", description: "User account has been created." })
      setName("")
      setEmail("")
      setPassword("")
      setRole("MANAGER")
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create user failed",
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
        <CardTitle>Create User</CardTitle>
        <CardDescription>Add a new team member with role-based access.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="user-name">Full name</Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="MANAGER">Manager</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create user"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function PurchaseOrdersCreateForm({ onCreated }: FormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [supplierOptions, setSupplierOptions] = React.useState<LookupOption[]>([])
  const [variantOptions, setVariantOptions] = React.useState<LookupOption[]>([])
  const [supplierId, setSupplierId] = React.useState("")
  const [expectedDate, setExpectedDate] = React.useState("")
  const [variantId, setVariantId] = React.useState("")
  const [quantity, setQuantity] = React.useState("1")
  const [unitPrice, setUnitPrice] = React.useState("0")

  React.useEffect(() => {
    Promise.all([
      getCollection<{ id: string; name?: string }>("/suppliers", { limit: 100 }),
      getCollection<{ id: string; name?: string; variants?: Array<{ id: string; sku?: string }> }>("/products", { limit: 100 }),
    ])
      .then(([suppliers, products]) => {
        setSupplierOptions(suppliers.items.map((item) => ({ id: item.id, label: item.name ?? item.id })))
        const mappedVariants: LookupOption[] = []
        for (const product of products.items as unknown as Array<{
          variants?: Array<{ id: string; sku?: string }>
          name?: string
        }>) {
          for (const variant of product.variants ?? []) {
            mappedVariants.push({
              id: variant.id,
              label: `${product.name ?? "Product"} — ${variant.sku ?? variant.id}`,
            })
          }
        }
        setVariantOptions(mappedVariants)
      })
      .catch(() => {
        setSupplierOptions([])
        setVariantOptions([])
      })
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      await createResource("/purchase-orders", {
        supplierId,
        expectedDate,
        items: [{ variantId, quantity: Number(quantity), unitPrice: Number(unitPrice) }],
      })
      toast({ title: "Purchase order created", description: "Purchase order has been submitted." })
      await onCreated?.()
    } catch (error) {
      toast({
        title: "Create purchase order failed",
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
        <CardTitle>Create Purchase Order</CardTitle>
        <CardDescription>Create a PO with supplier and item details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <LookupInput
            id="po-supplier-id"
            label="Supplier"
            value={supplierId}
            onChange={setSupplierId}
            options={supplierOptions}
            placeholder="Select supplier"
          />
          <div className="space-y-2"><Label htmlFor="po-expected-date">Expected date</Label><Input id="po-expected-date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} required /></div>
          <LookupInput
            id="po-variant-id"
            label="Variant"
            value={variantId}
            onChange={setVariantId}
            options={variantOptions}
            placeholder="Select variant"
          />
          <div className="space-y-2"><Label htmlFor="po-qty">Quantity</Label><Input id="po-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="po-unit-price">Unit price</Label><Input id="po-unit-price" type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required /></div>
          <div className="md:col-span-2"><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create purchase order"}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}
