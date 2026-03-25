"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";

const INPUT = "w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all text-sm";

export default function ContactPage() {
  const [form, setForm]     = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <section className="pt-36 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-500 mb-4 block">Get in touch</span>
            <h1 className="text-4xl md:text-5xl font-black text-[var(--fg)] mb-4">We&apos;d love to hear from you</h1>
            <p className="text-[var(--fg-soft)] text-lg max-w-xl mx-auto">Have a question, need a demo, or want to discuss enterprise options? Drop us a message.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Info */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {[
                { icon: Mail,    title: "Email us",      body: "hello@advisorai.app",         sub: "We reply within 24 hours"         },
                { icon: MapPin,  title: "Headquarters",  body: "Kigali, Rwanda",               sub: "KG 11 Ave, Kicukiro"              },
                { icon: Clock,   title: "Business hours",body: "Mon – Fri, 9 am – 6 pm EAT",  sub: "UTC+2 / Nairobi time"             },
              ].map(({ icon: Icon, title, body, sub }) => (
                <div key={title} className="flex gap-4 p-5 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon size={18} className="text-violet-500 group-hover:rotate-12 transition-transform" />
                  </div>
                  <div>
                    <p className="text-[var(--fg)] font-semibold text-sm">{title}</p>
                    <p className="text-[var(--fg-soft)] text-sm mt-0.5">{body}</p>
                    <p className="text-[var(--fg-muted)] text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3 p-8 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] hover:shadow-lg transition-all duration-300">
              {sent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="text-[var(--fg)] text-xl font-bold mb-2">Message sent!</h3>
                  <p className="text-[var(--fg-muted)] text-sm max-w-xs">Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  <button type="button" onClick={() => { setSent(false); setForm({ name:"", email:"", company:"", message:"" }); }}
                    className="mt-6 text-violet-500 hover:text-violet-400 text-sm font-medium transition-colors">
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h2 className="text-[var(--fg)] text-lg font-bold mb-1">Send us a message</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--fg-muted)] text-xs font-semibold uppercase tracking-wide mb-2">Your name</label>
                      <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                        placeholder="Alice Uwimana" required className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-[var(--fg-muted)] text-xs font-semibold uppercase tracking-wide mb-2">Email</label>
                      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                        placeholder="alice@company.com" required className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs font-semibold uppercase tracking-wide mb-2">Company</label>
                    <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)}
                      placeholder="TechVentures Ltd (optional)" className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[var(--fg-muted)] text-xs font-semibold uppercase tracking-wide mb-2">Message</label>
                    <textarea value={form.message} onChange={(e) => set("message", e.target.value)}
                      placeholder="Tell us what you need…" required rows={5}
                      className={INPUT + " resize-none"} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-105">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                      : <><Send size={15} /> Send message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
