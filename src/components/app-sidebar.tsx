"use client";

import * as React from "react";
import {
  Boxes,
  ChartColumnIncreasing,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageCheck,
  RotateCcw,
  Receipt,
  Settings,
  Shapes,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import { AppBrand } from "@/components/app-brand";
import { NavMain, type NavGroup } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        title: "Inventory",
        url: "/inventory",
        icon: Warehouse,
      },
      {
        title: "Products",
        url: "/products",
        icon: Package,
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Shapes,
      },
      {
        title: "Brands",
        url: "/brands",
        icon: Boxes,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Orders",
        url: "/orders",
        icon: ShoppingCart,
      },
      {
        title: "Returns",
        url: "/returns",
        icon: RotateCcw,
      },
      {
        title: "Suppliers",
        url: "/suppliers",
        icon: Truck,
      },
      {
        title: "Purchase Orders",
        url: "/purchase-orders",
        icon: ClipboardList,
      },
      {
        title: "Stock Movements",
        url: "/stock-movements",
        icon: ListChecks,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Receipt,
      },
      {
        title: "Finance",
        url: "/finance",
        icon: ChartColumnIncreasing,
      },
      {
        title: "Purchase Receive",
        url: "/purchase-orders/receive",
        icon: PackageCheck,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? "User",
            subtitle: user?.email ?? "Not authenticated",
            initials,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
