"use client";

import Image from "next/image";
import Link from "next/link";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip="Planventory">
          <Link href="/dashboard">
            <div className="relative flex size-8 shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/planventory.png"
                alt="Planventory"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Planventory</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                Inventory management
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
