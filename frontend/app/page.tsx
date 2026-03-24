import Navbar    from "@/components/layout/Navbar";
import Footer    from "@/components/layout/Footer";
import Hero      from "@/components/sections/Hero";
import LogoTicker from "@/components/sections/LogoTicker";
import Features  from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Stats     from "@/components/sections/Stats";
import UseCases  from "@/components/sections/UseCases";
import Pricing   from "@/components/sections/Pricing";
import CTA       from "@/components/sections/CTA";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink noise">
      <Navbar />
      <Hero />
      <LogoTicker />
      <Features />
      <HowItWorks />
      <Stats />
      <UseCases />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
