import { cn } from "@/lib/utils"

interface TabFilterProps<T extends string> {
  tabs: { value: T; label: string }[]
  activeTab: T
  onChange: (tab: T) => void
  className?: string
}

export default function TabFilter<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: TabFilterProps<T>) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-2xl border border-po-border bg-po-surface-muted p-1.5",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-xl px-4 py-1.5 text-xs font-semibold transition",
            activeTab === tab.value
              ? "bg-white text-po-primary shadow-sm"
              : "text-po-text-muted hover:text-po-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
