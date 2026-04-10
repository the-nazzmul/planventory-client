"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function ChartContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "h-[320px] w-full rounded-md border bg-card p-4 text-card-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string }>
  label?: string | number
  className?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className={cn("rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md", className)}>
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-medium text-foreground">{String(item.value ?? "—")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string }[]
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-xs text-muted-foreground", className)}>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

