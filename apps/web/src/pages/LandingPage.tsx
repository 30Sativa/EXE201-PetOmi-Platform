import AdoptionSection from "@/components/landing/AdoptionSection"
import BookingPreview from "@/components/landing/BookingPreview"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"
import Hero from "@/components/landing/Hero"
import Navbar from "@/components/landing/Navbar"
import Services from "@/components/landing/Services"
import Testimonials from "@/components/landing/Testimonials"
import TrustedStats from "@/components/landing/TrustedStats"
import VetConsultation from "@/components/landing/VetConsultation"

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden text-po-text">
      <Navbar />
      <Hero />
      <TrustedStats />
      <Services />
      <BookingPreview />
      <VetConsultation />
      <AdoptionSection />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  )
}
