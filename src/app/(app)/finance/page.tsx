import type { Metadata } from "next"

import { FinanceOverviewSection } from "@/components/finance-overview"

export const metadata: Metadata = {
  title: "Financial Overview",
}

export default function FinancePage() {
  return <FinanceOverviewSection />
}
