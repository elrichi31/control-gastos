import { Navbar, Hero, Features, HowItWorks, CTA, Footer } from "@/components/landing"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-card">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
