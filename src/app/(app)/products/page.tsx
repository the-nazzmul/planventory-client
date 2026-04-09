import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      <p className="text-muted-foreground">
        Placeholder for product catalog and variants.
      </p>
    </div>
  );
}
