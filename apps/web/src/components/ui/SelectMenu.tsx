import { Select } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type SelectMenuOption<Value extends string = string> = {
  value: Value
  label: string
  disabled?: boolean
}

type SelectMenuProps<Value extends string> = {
  value: Value
  onChange: (value: Value) => void
  options: ReadonlyArray<SelectMenuOption<Value>>
  ariaLabel: string
  placeholder?: string
  disabled?: boolean
  leadingIcon?: LucideIcon
  className?: string
  triggerClassName?: string
}

export default function SelectMenu<Value extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  disabled,
  leadingIcon: LeadingIcon,
  className,
  triggerClassName,
}: SelectMenuProps<Value>) {
  return (
    <div className={cn("min-w-0", className)}>
      <Select.Root
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onChange(nextValue)
        }}
        items={options}
        disabled={disabled}
      >
        <Select.Trigger
          aria-label={ariaLabel}
          className={cn(
            "group flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-po-border bg-white px-3 text-left text-sm font-semibold text-po-text outline-none transition",
            "hover:border-orange-200 focus-visible:border-po-primary focus-visible:ring-2 focus-visible:ring-po-primary/20",
            "data-[popup-open]:border-po-primary data-[popup-open]:ring-2 data-[popup-open]:ring-po-primary/15",
            "disabled:cursor-not-allowed disabled:bg-po-surface-muted disabled:text-po-text-subtle disabled:opacity-70",
            triggerClassName,
          )}
        >
          {LeadingIcon ? <LeadingIcon className="size-4 shrink-0 text-po-primary" /> : null}
          <Select.Value placeholder={placeholder} className="min-w-0 flex-1 truncate" />
          <Select.Icon className="grid shrink-0 place-items-center text-po-text-subtle">
            <ChevronDown className="size-4 transition-transform duration-150 group-data-[popup-open]:rotate-180" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            sideOffset={6}
            align="start"
            alignItemWithTrigger={false}
            className="z-[120]"
          >
            <Select.Popup
              className={cn(
                "max-h-[min(var(--available-height),20rem)] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-po-border bg-white p-1.5 shadow-xl shadow-emerald-950/10 outline-none",
                "origin-[var(--transform-origin)] transition duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              )}
            >
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      "flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-po-text outline-none transition",
                      "data-[highlighted]:bg-po-primary-soft data-[highlighted]:text-po-primary data-[selected]:text-po-primary",
                      "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45",
                    )}
                  >
                    <Select.ItemText className="min-w-0 flex-1 truncate">{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="grid size-5 shrink-0 place-items-center rounded-md bg-po-primary text-white">
                      <Check className="size-3.5" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
