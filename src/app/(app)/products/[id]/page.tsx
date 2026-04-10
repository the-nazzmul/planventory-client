"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCollection, getResource, updateResource } from "@/lib/api/resources"
import { formatCurrency, formatDate } from "@/lib/format"

type Variant = {
  id: string
  sku: string
  size?: string | null
  color?: string | null
  colorHex?: string | null
  costPrice: number
  sellingPrice: number
  stock: number
  lowStockAlert: number
}

type Product = {
  id: string
  sku: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
  tags?: string[]
  brand?: { name: string } | null
  category?: { name: string } | null
  variants: Variant[]
  createdAt: string
  updatedAt: string
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [product, setProduct] = React.useState<Product | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [brandId, setBrandId] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [brandOptions, setBrandOptions] = React.useState<Array<{ id: string; name?: string }>>([])
  const [categoryOptions, setCategoryOptions] = React.useState<Array<{ id: string; name?: string }>>([])

  React.useEffect(() => {
    setLoading(true)
    getResource<Product>(`/products/${params.id}`)
      .then(setProduct)
      .then((data) => {
        setName(data.name)
        setDescription(data.description ?? "")
      })
      .catch((error) =>
        toast({
          title: "Failed to load product",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false))
  }, [params.id, toast])

  React.useEffect(() => {
    Promise.all([
      getCollection<{ id: string; name?: string }>("/brands", { limit: 100 }),
      getCollection<{ id: string; name?: string }>("/categories", { limit: 100 }),
    ])
      .then(([brands, categories]) => {
        setBrandOptions(brands.items)
        setCategoryOptions(categories.items)
      })
      .catch(() => {
        setBrandOptions([])
        setCategoryOptions([])
      })
  }, [])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    try {
      setSaving(true)
      await updateResource(`/products/${product.id}`, {
        name,
        description,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
      })
      toast({ title: "Product updated", description: "Product details saved." })
      const refreshed = await getResource<Product>(`/products/${params.id}`)
      setProduct(refreshed)
      setName(refreshed.name)
      setDescription(refreshed.description ?? "")
      setBrandId("")
      setCategoryId("")
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>Update core product details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSave}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-product-name">Name</Label>
              <Input id="edit-product-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea id="edit-product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-brand">Brand</Label>
              <Input id="edit-product-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} list="edit-brand-list" placeholder="Keep empty to preserve current" />
              <datalist id="edit-brand-list">
                {brandOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name ?? item.id}</option>
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-category">Category</Label>
              <Input id="edit-product-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} list="edit-category-list" placeholder="Keep empty to preserve current" />
              <datalist id="edit-category-list">
                {categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name ?? item.id}</option>
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>
                SKU: {product.sku} · {product.brand?.name ?? "No brand"} · {product.category?.name ?? "Uncategorized"}
              </CardDescription>
            </div>
            <Badge variant={product.isActive ? "success" : "destructive"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Total Stock</dt>
              <dd className="font-medium text-lg">{totalStock.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Variants</dt>
              <dd className="font-medium text-lg">{product.variants.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(product.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium">{formatDate(product.updatedAt)}</dd>
            </div>
          </dl>
          {product.description && (
            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Stock levels and pricing for each variant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Selling</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.sku}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {v.colorHex && (
                          <span
                            className="inline-block size-3 rounded-full border"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        {v.color ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>{v.size ?? "—"}</TableCell>
                    <TableCell>
                      {v.stock <= v.lowStockAlert ? (
                        <Badge variant="warning">{v.stock} (Low)</Badge>
                      ) : (
                        <span className="font-medium">{v.stock}</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(v.costPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(v.sellingPrice)}</TableCell>
                    <TableCell className="text-muted-foreground">{v.lowStockAlert}</TableCell>
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
