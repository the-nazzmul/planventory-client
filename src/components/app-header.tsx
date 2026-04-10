"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggler } from "@/components/theme-toggler";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/products": "Products",
  "/categories": "Categories",
  "/brands": "Brands",
  "/orders": "Orders",
  "/returns": "Returns",
  "/suppliers": "Suppliers",
  "/purchase-orders": "Purchase Orders",
  "/purchase-orders/receive": "Receive Purchase Orders",
  "/stock-movements": "Stock Movements",
  "/users": "Users",
  "/settings": "Settings",
  "/expenses": "Expenses",
  "/finance": "Financial Overview",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Planventory";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ThemeToggler />
    </header>
  );
}
