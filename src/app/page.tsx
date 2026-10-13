import { Navbar, Hero, Features, HowItWorks, CTA, Footer } from "@/components/landing"
import { LandingMotion } from '@/components/landing/LandingMotion'

export default function LandingPage() {
  return (
    <LandingMotion>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </LandingMotion>
  )
}
