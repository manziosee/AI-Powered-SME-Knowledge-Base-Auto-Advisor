import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Information We Collect",
    body: `When you register for AdvisorAI, we collect your name, email address, company name, and country. When you upload documents, those files are stored securely in your private, isolated tenant environment. We also collect usage data (page views, feature usage, query counts) to improve the product.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use your information solely to provide and improve the AdvisorAI service. Your uploaded documents are processed by our AI pipeline to answer your queries. We do not use your documents or queries to train any shared or public AI model. Your data belongs to you.`,
  },
  {
    title: "3. Data Storage & Security",
    body: `All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Each company's data is stored in isolated database schemas — no cross-tenant data access is possible. We maintain regular encrypted backups with a 30-day retention window.`,
  },
  {
    title: "4. Data Sharing",
    body: `We do not sell, rent, or share your personal data with third parties for marketing. We share data only with infrastructure providers (AWS, Supabase) strictly necessary to deliver the service, all under binding data processing agreements. We may disclose data if required by law.`,
  },
  {
    title: "5. Your GDPR Rights",
    body: `If you are located in the EU/EEA, you have the right to access, correct, export, or delete your personal data at any time. You may also restrict or object to certain processing. To exercise these rights, contact us at privacy@advisorai.app. We will respond within 30 days.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain your account data for as long as your account is active. Uploaded documents are retained until you delete them. If you close your account, all your data is permanently deleted within 30 days.`,
  },
  {
    title: "7. Cookies",
    body: `We use only essential cookies required to keep you logged in. We do not use tracking, advertising, or analytics cookies. You can disable cookies in your browser settings, though this may affect functionality.`,
  },
  {
    title: "8. Contact",
    body: `For privacy-related questions, email us at privacy@advisorai.app or write to: AdvisorAI, KG 11 Ave, Kicukiro, Kigali, Rwanda.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4 block">Legal</span>
          <h1 className="text-4xl font-black text-[var(--fg)] mb-3">Privacy Policy</h1>
          <p className="text-[var(--fg-muted)] text-sm mb-12">Last updated: March 2026</p>

          <p className="text-[var(--fg-soft)] leading-relaxed mb-10">
            AdvisorAI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy.
            This policy explains how we collect, use, and protect your information when you use our platform.
          </p>

          <div className="flex flex-col gap-8">
            {sections.map((s) => (
              <div key={s.title} className="p-6 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)]">
                <h2 className="text-[var(--fg)] font-bold mb-3">{s.title}</h2>
                <p className="text-[var(--fg-soft)] text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
