import Seo from "@/components/common/Seo"
import AdminSection from "@/components/landing/AdminSection"
import AnimatedBackground from "@/components/landing/AnimatedBackground"
import BookingPreview from "@/components/landing/BookingPreview"
import FAQ, { faqItems } from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"
import Hero from "@/components/landing/Hero"
import Navbar from "@/components/landing/Navbar"
import PainPoints from "@/components/landing/PainPoints"
import Services from "@/components/landing/Services"
import Testimonials from "@/components/landing/Testimonials"
import TrustedStats from "@/components/landing/TrustedStats"
import VetConsultation from "@/components/landing/VetConsultation"
import { useSmoothScroll } from "@/hooks"
import {
  buildFaqSchema,
  organizationSchema,
  softwareSchema,
  websiteSchema,
} from "@/config/structuredData"

export default function LandingPage() {
  useSmoothScroll(88)

  return (
    <main className="relative min-h-screen overflow-x-hidden text-po-text">
      <Seo
        title="Trợ lý AI chăm sóc sức khỏe thú cưng"
        description="PetOmi giúp chủ nuôi nhận biết dấu hiệu bất thường ở thú cưng, lưu hồ sơ sức khỏe, đặt lịch và kết nối với phòng khám thú y đã xác thực. Tư vấn triệu chứng 24/7."
        path="/"
        jsonLd={[
          organizationSchema,
          websiteSchema,
          softwareSchema,
          buildFaqSchema(faqItems),
        ]}
      />
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <TrustedStats />
        <PainPoints />
        <Services />
        <BookingPreview />
        <VetConsultation />
        <AdminSection />
        <Testimonials />
        <FAQ />
        <Footer />
      </div>
    </main>
  )
}
