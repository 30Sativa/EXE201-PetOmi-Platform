import { CalendarDays, Clock, MapPin, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Slot {
  time: string
  label: string
}

const slots: Slot[] = [
  { time: "09:30", label: "Morning" },
  { time: "11:00", label: "Late morning" },
  { time: "16:45", label: "Afternoon" },
]

export default function BookingPreview() {
  return (
    <section id="booking" className="py-16">
      <div className="mx-auto grid w-[min(100%-24px,1200px)] gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Pet booking preview</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">A booking flow that feels calm.</h2>
          <p className="mt-4 text-base leading-7 text-po-text-muted">
            Owners see availability, reviews, and care highlights in one place. Clinics receive structured intakes that
            reduce no-shows.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { icon: MapPin, title: "Nearby clinics", text: "Smart matching based on care needs." },
              { icon: ShieldCheck, title: "Verified reviews", text: "Transparent quality signals." },
              { icon: CalendarDays, title: "Flexible slots", text: "Real-time availability." },
              { icon: Clock, title: "Fast intake", text: "Pre-filled history & symptoms." },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border border-po-border bg-white p-4">
                  <Icon className="size-5 text-po-primary" />
                  <p className="mt-2 text-sm font-semibold text-po-text">{item.title}</p>
                  <p className="text-xs text-po-text-muted">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-[32px] border border-po-border bg-white p-6 shadow-xl">
          <div className="rounded-[24px] bg-po-surface-muted p-5">
            <p className="text-xs font-semibold uppercase text-po-text-subtle">Appointment</p>
            <h3 className="mt-2 text-lg font-semibold text-po-text">Paw & Pines Veterinary</h3>
            <p className="text-xs text-po-text-muted">District 2, 2.1 km away</p>
            <div className="mt-4 space-y-2">
              {slots.map((slot) => (
                <div key={slot.time} className="flex items-center justify-between rounded-2xl border border-po-border bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-po-text">{slot.time}</span>
                  <span className="text-xs text-po-text-muted">{slot.label}</span>
                </div>
              ))}
            </div>
            <Button className="mt-5 h-10 w-full rounded-full bg-po-primary text-sm font-semibold text-white hover:bg-po-primary-hover">
              Confirm booking
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
