import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses",
};

export default function ExpensesPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
      <p className="text-muted-foreground">
        Placeholder for expense tracking and reports.
      </p>
    </div>
  );
}
