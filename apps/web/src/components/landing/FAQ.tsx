import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { useInView } from "@/hooks"
import type { FaqItem } from "@/types"

const faqItems: FaqItem[] = [
  {
    question: "PetOmi miễn phí hay có thu phí?",
    answer: "Tư vấn AI và theo dõi hồ sơ thú cưng hoàn toàn miễn phí. Một số tính năng nâng cao dành cho phòng khám có thể có phí trong tương lai.",
  },
  {
    question: "Phòng khám nhận lịch hẹn từ đâu?",
    answer: "Khi bạn đặt lịch, thông tin sẽ được gửi ngay đến phòng khám bạn chọn, kèm theo triệu chứng và lịch sử sức khỏe để bác sĩ nắm rõ trước.",
  },
  {
    question: "Hồ sơ sức khỏe thú cưng có an toàn không?",
    answer: "Rất an toàn. Chỉ có bạn mới có quyền chia sẻ hồ sơ, và bạn có thể thu hồi quyền truy cập bất cứ lúc nào.",
  },
  {
    question: "Tôi có thể dùng PetOmi cho nhiều thú cưng không?",
    answer: "Có, một tài khoản có thể quản lý nhiều thú cưng, mỗi bé có hồ sơ riêng biệt.",
  },
]

export default function FAQ() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="faq" className="bg-white/60 py-20 md:py-24">
      <div className="mx-auto grid w-[calc(100%_-_24px)] max-w-[1100px] gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div className={`transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Câu hỏi thường gặp</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Rõ ràng trước khi bắt đầu.
          </h2>
          <p className="mt-4 text-sm leading-6 text-po-text-muted">
            Một vài điều chủ nuôi và phòng khám thường hỏi trước khi dùng PetOmi.
          </p>
        </div>
        <Accordion className={`grid gap-4 transition-all duration-500 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {faqItems.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className={`rounded-2xl border border-po-border bg-white px-5 transition-all duration-500 hover:shadow-sm ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
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
