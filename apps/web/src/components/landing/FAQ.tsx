import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FaqItem {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: "PetOmi hỗ trợ đăng nhập và bảo mật như thế nào?",
    answer: "Đăng nhập bằng email, có xác minh email, quản lý thiết bị và 2FA cho thao tác nhạy cảm (khi bật).",
  },
  {
    question: "Clinic nhận lịch hẹn theo cách nào?",
    answer: "Lịch hẹn được đồng bộ real-time, kèm pre-visit summary từ AI và trạng thái queue rõ ràng.",
  },
  {
    question: "Chia sẻ hồ sơ thú cưng có an toàn không?",
    answer: "Owner chủ động cấp quyền theo phạm vi và có thể thu hồi bất kỳ lúc nào.",
  },
  {
    question: "Quy trình duyệt clinic hoạt động ra sao?",
    answer: "Clinic tạo hồ sơ và gửi duyệt, admin xác nhận hoặc từ chối với trạng thái minh bạch.",
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1100px)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Câu hỏi thường gặp</p>
          <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">Thông tin nhanh về tài khoản & vận hành.</h2>
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
