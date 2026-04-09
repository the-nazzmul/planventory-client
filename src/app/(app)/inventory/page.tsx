import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      <p className="text-muted-foreground">
        Placeholder for stock levels, locations, and movements.
      </p>
    </div>
  );
}
