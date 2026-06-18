import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the Privacy Policy for GoalsGuild Coach, including local-first data handling and optional integrations.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    url: "/privacy",
    title: "Privacy Policy | GoalsGuild Coach",
    description:
      "Understand how GoalsGuild Coach handles interview data, storage, and optional integrations.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | GoalsGuild Coach",
    description:
      "Understand how GoalsGuild Coach handles interview data, storage, and optional integrations.",
    images: ["/og-image.png"],
  },
};

export default function PrivacyPage() {
  return (
    <main>
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Now" />
      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h1 className="section-title">Privacy Policy</h1>
          <p className="section-subtitle">GoalsGuild Coach is local-first. Optional integrations are user-controlled.</p>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
