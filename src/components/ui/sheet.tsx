"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/*
  Sheet do shadcn (Dialog do Radix por baixo), escrito à mão em 27/out/2026 (ajustes-97) porque o
  servidor MCP do shadcn não conectou — mesmo código do registro, só com o lado "bottom" que o
  protótipo usa e o tema do Tairu: folha branca (--card), cantos de cima com o raio de folha da
  plataforma (--radius-ios-sheet 16px / --radius-android-sheet 12px) e o puxador no iOS.
  O Radix cuida do foco preso, do Esc e do aria-modal.
*/

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "Fechar",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  showCloseButton?: boolean
  closeLabel?: string
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // de baixo pra cima, largura toda (no desktop, a coluna do celular), sem deslocar a página
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[480px] flex-col bg-card text-foreground shadow-lg outline-none",
          "rounded-t-(--radius-ios-sheet) [[data-platform=android]_&]:rounded-t-(--radius-android-sheet)",
          "pb-[env(safe-area-inset-bottom,0px)]",
          "data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        {/* puxador do iOS (decorativo — fechar é pelo X, pelo Esc ou tocando fora) */}
        <span
          aria-hidden="true"
          className="mx-auto mt-2 hidden h-1 w-9 flex-none rounded-full bg-(--field-border) [[data-platform=ios]_&]:block"
        />
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-5" aria-hidden="true" />
            <span className="visually-hidden">{closeLabel}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 px-4 pt-3 pr-14", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("m-0 text-(length:--text-xl) leading-tight font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("m-0 text-(length:--text-sm) text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription }
