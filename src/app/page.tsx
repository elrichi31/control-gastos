import { Navbar, Hero, Features, HowItWorks, CTA, Footer } from "@/components/landing"
import styles from '@/components/landing/landing.module.css'

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  )
}
