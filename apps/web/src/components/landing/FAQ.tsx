import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FaqItem {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: "Is PetOmi suitable for first-time pet owners?",
    answer: "Yes. The AI guidance and clinic recommendations are designed to keep new owners calm and informed.",
  },
  {
    question: "How do vet partners receive bookings?",
    answer: "Clinics manage availability in PetOmi and receive structured intake notes before every visit.",
  },
  {
    question: "Can I switch clinics after booking?",
    answer: "Absolutely. You can reschedule or change clinics with a single tap in your booking dashboard.",
  },
  {
    question: "Is adoption support included?",
    answer: "PetOmi includes guided adoption plans, with care reminders and access to partner clinics.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1100px)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">FAQ</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Answers for calm pet care planning.</h2>
        </div>
        <Accordion className="mt-8 grid gap-4">
          {faqItems.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionHeader>
                <AccordionTrigger>{item.question}</AccordionTrigger>
              </AccordionHeader>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
