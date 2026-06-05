import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("overflow-hidden rounded-2xl border border-po-border bg-white", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionHeader = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Header>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Header>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Header ref={ref} className={cn("w-full", className)} {...props} />
))
AccordionHeader.displayName = "AccordionHeader"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Trigger
    ref={ref}
    className={cn(
      "po-accordion-trigger flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left text-base font-semibold leading-6 text-po-text transition hover:bg-po-surface-muted/70 focus-visible:outline-none focus-visible:shadow-[var(--po-focus-ring)]",
      className
    )}
    {...props}
  >
    <span className="min-w-0 text-pretty">{children}</span>
    <ChevronDown className="po-accordion-icon size-4 shrink-0 text-po-text-muted transition" />
  </AccordionPrimitive.Trigger>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Panel
    ref={ref}
    className={cn("border-t border-po-border/70 px-5 py-4 text-sm leading-7 text-po-text-muted", className)}
    {...props}
  />
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent }
