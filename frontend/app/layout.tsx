import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: {
    default:  "AdvisorAI — AI Knowledge Base & Auto Advisor for SMEs",
    template: "%s | AdvisorAI",
  },
  description:
    "AI-powered document management, compliance engine, and auto-advisor for small and medium enterprises. Upload your business documents and get instant, cited answers.",
  keywords: [
    "AI knowledge base", "SME compliance", "document management",
    "LangChain RAG", "business advisor", "compliance software",
    "Africa SME", "automated compliance",
  ],
  authors:  [{ name: "AdvisorAI" }],
  creator:  "AdvisorAI",
  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple:    '/favicon.svg',
    other:    [{ rel: 'icon', url: '/favicon.svg' }],
  },
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         "https://advisorai.app",
    title:       "AdvisorAI — AI Knowledge Base & Auto Advisor for SMEs",
    description: "Upload documents. Ask questions. Stay compliant.",
    siteName:    "AdvisorAI",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AdvisorAI — AI Knowledge Base for SMEs",
    description: "AI-powered document search, compliance alerts, and business advisor.",
    creator:     "@advisorai",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
