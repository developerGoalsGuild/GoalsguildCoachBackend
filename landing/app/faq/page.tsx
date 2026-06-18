import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "FAQ: Licensing, Setup, and LLM Requirements",
  description:
    "Read detailed FAQs about licensing, trial activation, LLM provider requirements, security, refunds, and platform support for GoalsGuild Coach.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    url: "/faq",
    title: "FAQ: Licensing, Setup, and LLM Requirements",
    description:
      "Answers about trial/full license flows, LLM provider setup, security, refunds, and platform support.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ: Licensing, Setup, and LLM Requirements",
    description:
      "Answers about trial/full license flows, LLM provider setup, security, refunds, and platform support.",
    images: ["/og-image.png"],
  },
};

const faq = [
  {
    q: "What is GoalsGuild Coach exactly?",
    a: "GoalsGuild Coach is a desktop interview coaching app that provides live guidance during interviews, then generates post-call summary, action items, and feedback to help you improve round after round.",
  },
  {
    q: "How does the 7-day trial work?",
    a: "Start on the trial page with your email, verify it, then activate the trial token inside the app. The trial is machine-bound and runs for 7 days.",
  },
  {
    q: "Can I upgrade from trial to a full license?",
    a: "Yes. Purchase via checkout and your account/license is upgraded. The flow is built to handle repeat webhook events safely.",
  },
  {
    q: "Is payment a subscription?",
    a: "No. The current model is one-time purchase for a lifetime license unless your sales policy changes later.",
  },
  {
    q: "What happens if the license API is temporarily unavailable?",
    a: "The app supports a limited cached-validation fallback path so short outages do not immediately block usage.",
  },
  {
    q: "What platforms are supported?",
    a: "Current packaging and release flow includes macOS and Windows artifacts, distributed via versioned release paths.",
  },
  {
    q: "Does the app store my interview content in the cloud?",
    a: "Core session and output handling is local-first. Cloud license services are used for activation/validation and related operational controls.",
  },
  {
    q: "How is license abuse prevented?",
    a: "The backend enforces machine/email checks for trial abuse prevention, secret-protected provisioning/admin endpoints, and revoke flows.",
  },
  {
    q: "What security controls are included?",
    a: "The current stack includes encrypted prompt bundles, runtime integrity guards, signed cached validation blobs, and admin revoke capability.",
  },
  {
    q: "How do refunds/disputes affect access?",
    a: "Refund/dispute events can trigger admin lookup by payment intent and revoke the corresponding license.",
  },
  {
    q: "Can I use my own LLM provider?",
    a: "Yes. You can configure an API-key provider (OpenAI, Anthropic, Gemini, Groq, OpenRouter) or run Ollama locally. At least one LLM backend is required for coaching/generation features.",
  },
  {
    q: "What if I do not configure any API key and do not run Ollama?",
    a: "Then generation-dependent features (live suggestions, summaries, practice feedback, and career text tools) will not work. Configure a provider API key or start a local Ollama model first.",
  },
  {
    q: "Where can I get legal and download links?",
    a: "Use the footer links for Terms, Privacy, and Download pages from the main landing experience.",
  },
];

export default function FAQPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (href: string) => {
    if (!href.startsWith("/")) return href;
    const [pathPart, hashPart] = href.split("#");
    const hash = hashPart ? `#${hashPart}` : "";
    if (pathPart === "/") return `${basePath}/index.html${hash}`;
    const normalized = pathPart.endsWith(".html") ? pathPart : `${pathPart}.html`;
    return `${basePath}${normalized}${hash}`;
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Lifetime Access" />
      <section className="section section-alt">
        <div className="container">
          <h1 className="section-title">Detailed FAQ</h1>
          <p className="section-subtitle">
            Everything most candidates and teams ask before adopting GoalsGuild Coach.
          </p>
          <div className="cards">
            {faq.map((item) => (
              <article className="card" key={item.q}>
                <h2>{item.q}</h2>
                <p>{item.a}</p>
              </article>
            ))}
          </div>

          <section style={{ marginTop: 28 }}>
            <h2>Related Pages</h2>
            <p>
              Use these pages for setup, installation, and legal details.
            </p>
            <p>
              <a href={withBase("/tutorial")}>Setup tutorial</a> {" · "}
              <a href={withBase("/setup-mac")}>Mac setup</a> {" · "}
              <a href={withBase("/setup-windows")}>Windows setup</a> {" · "}
              <a href={withBase("/terms")}>Terms</a> {" · "}
              <a href={withBase("/privacy")}>Privacy</a>
            </p>
          </section>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
