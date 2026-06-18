import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for GoalsGuild Coach, including usage conditions and user responsibilities.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    url: "/terms",
    title: "Terms of Service | GoalsGuild Coach",
    description:
      "Review the legal terms and acceptable-use policies for GoalsGuild Coach.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | GoalsGuild Coach",
    description:
      "Review the legal terms and acceptable-use policies for GoalsGuild Coach.",
    images: ["/og-image.png"],
  },
};

export default function TermsPage() {
  return (
    <main>
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Now" />
      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h1 className="section-title">Terms of Service</h1>
          <p className="section-subtitle">By using GoalsGuild Coach, you agree to lawful and responsible use.</p>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
