import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or using AdvisorAI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. These terms apply to all users, including individuals and companies.`,
  },
  {
    title: "2. Description of Service",
    body: `AdvisorAI provides an AI-powered knowledge base and compliance advisory platform for small and medium enterprises. The Service processes your uploaded documents and answers compliance-related queries using large language models. AdvisorAI is an informational tool and does not constitute legal, financial, or professional advice.`,
  },
  {
    title: "3. Account Registration",
    body: `You must provide accurate information when registering. You are responsible for maintaining the security of your credentials. You may not share your account with others or use the Service on behalf of a third party without their consent. Notify us immediately at hello@advisorai.app if you suspect unauthorized access.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You may use the Service only for lawful purposes. You must not upload documents containing illegal content, attempt to reverse-engineer or scrape the platform, use the Service to harm or deceive others, or resell or redistribute access. We reserve the right to suspend accounts that violate these rules.`,
  },
  {
    title: "5. Intellectual Property",
    body: `AdvisorAI and its underlying technology, including the AI models, UI, and infrastructure, are owned by AdvisorAI Ltd. Your uploaded documents and company data remain your intellectual property. You grant us a limited license to process your data solely to deliver the Service.`,
  },
  {
    title: "6. Subscription & Payments",
    body: `Paid plans are billed monthly or annually in advance. All fees are non-refundable except where required by law. If your payment fails, we may suspend your account after a 7-day grace period. You can cancel at any time; cancellation takes effect at the end of your billing cycle. Prices may change with 30 days' notice.`,
  },
  {
    title: "7. Data & Privacy",
    body: `Your use of the Service is also governed by our Privacy Policy. We store your data in isolated, encrypted environments. We do not use your data to train public AI models. You retain full ownership of your data and may export or delete it at any time.`,
  },
  {
    title: "8. Disclaimers",
    body: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. ADVISORAI MAKES NO WARRANTY THAT AI-GENERATED ANSWERS ARE ACCURATE, COMPLETE, OR LEGALLY BINDING. ALWAYS VERIFY COMPLIANCE DECISIONS WITH A QUALIFIED PROFESSIONAL. TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR LIABILITY IS LIMITED TO THE AMOUNT YOU PAID IN THE LAST 3 MONTHS.`,
  },
  {
    title: "9. Termination",
    body: `We may terminate or suspend your account immediately if you violate these terms. You may close your account at any time from the Settings page. Upon termination, your data will be permanently deleted within 30 days per our data retention policy.`,
  },
  {
    title: "10. Governing Law",
    body: `These terms are governed by the laws of the Republic of Rwanda. Any disputes shall be resolved in the courts of Kigali, Rwanda, unless otherwise required by mandatory local law in your jurisdiction.`,
  },
  {
    title: "11. Changes to Terms",
    body: `We may update these terms at any time. We will notify you by email or in-app notice at least 14 days before material changes take effect. Continued use of the Service after the effective date constitutes acceptance of the revised terms.`,
  },
  {
    title: "12. Contact",
    body: `Questions about these terms? Contact us at hello@advisorai.app or write to: AdvisorAI, KG 11 Ave, Kicukiro, Kigali, Rwanda.`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4 block">Legal</span>
          <h1 className="text-4xl font-black text-[var(--fg)] mb-3">Terms of Service</h1>
          <p className="text-[var(--fg-muted)] text-sm mb-12">Last updated: March 2026</p>

          <p className="text-[var(--fg-soft)] leading-relaxed mb-10">
            Please read these Terms of Service carefully before using AdvisorAI. By accessing or using our platform,
            you agree to be bound by these terms and our{" "}
            <a href="/privacy" className="text-violet-500 hover:text-violet-400 transition-colors underline underline-offset-2">
              Privacy Policy
            </a>.
          </p>

          <div className="flex flex-col gap-8">
            {sections.map((s) => (
              <div key={s.title} className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
                <h2 className="text-[var(--fg)] font-bold mb-3">{s.title}</h2>
                <p className="text-[var(--fg-soft)] text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20 text-center">
            <p className="text-[var(--fg-soft)] text-sm">
              Have questions about these terms?{" "}
              <a href="/contact" className="text-violet-500 hover:text-violet-400 transition-colors font-semibold">
                Contact us →
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
