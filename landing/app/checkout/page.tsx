import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";
import { CheckoutButton } from "./CheckoutButton";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your one-time purchase of GoalsGuild Coach via secure Stripe Checkout.",
  alternates: {
    canonical: "/checkout",
  },
  openGraph: {
    url: "/checkout",
    title: "Checkout | GoalsGuild Coach",
    description:
      "Secure one-time checkout for lifetime access to GoalsGuild Coach.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Checkout | GoalsGuild Coach",
    description:
      "Secure one-time checkout for lifetime access to GoalsGuild Coach.",
    images: ["/og-image.png"],
  },
};

const includes = [
  "Real-time interview suggestions during sessions",
  "Post-call summary, actions, and feedback",
  "Practice mode and career optimization toolkit",
  "License activation with ongoing updates",
];

export default function CheckoutPage() {
  return (
    <main>
      <SiteNav ctaHref="/trial" ctaLabel="Start 7-Day Trial" />
      <section className="section">
        <div className="container">
          <h1 className="section-title">Checkout</h1>
          <p className="section-subtitle">
            One-time purchase for lifetime access to GoalsGuild Coach.
          </p>
          <div className="price-card">
            <p>GoalsGuild Coach License</p>
            <p className="price">$14.99 one-time</p>
            <p>
              Requires an LLM backend (provider API key or local Ollama model) for
              generation features.
            </p>
            <ul className="detail-list" style={{ textAlign: "left", maxWidth: 560, margin: "18px auto" }}>
              {includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <CheckoutButton />
            <p style={{ marginTop: 12, color: "#666" }}>
              You will be redirected to Stripe Checkout.
            </p>
          </div>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
