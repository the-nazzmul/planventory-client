"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
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

const user = {
  name: "Admin",
  subtitle: "Portfolio Studio",
  initials: "A",
};

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
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
