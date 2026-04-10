"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Toast = {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextValue = {
  toast: (payload: Omit<Toast, "id">) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      const id = crypto.randomUUID()
      setItems((current) => [...current, { id, title, description, variant }])
      window.setTimeout(() => removeToast(id), 4000)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex w-[360px] max-w-[90vw] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border bg-card p-3 shadow-sm",
              item.variant === "destructive" && "border-destructive/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => removeToast(item.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }
  return context
}
