import type { Metadata } from "next";
import { CookieConsent } from "../components/CookieConsent";
import { FAQ } from "../components/FAQ";
import { Features } from "../components/Features";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Pricing } from "../components/Pricing";
import { SiteNav } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Real-Time Interview Coaching That Gets You Hired",
  description:
    "GoalsGuild Coach helps you prepare for interviews with live AI guidance, post-call summaries, and practical career tools.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Real-Time Interview Coaching That Gets You Hired",
    description:
      "Live interview suggestions, post-call summaries, and career optimization tools for serious candidates.",
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/og-image.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real-Time Interview Coaching That Gets You Hired",
    description:
      "Live interview suggestions, post-call summaries, and career optimization tools for serious candidates.",
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/og-image.png`],
  },
};

export default function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.goalsguild.com";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (href: string) => {
    if (!href.startsWith("/")) return href;
    const [pathPart, hashPart] = href.split("#");
    const hash = hashPart ? `#${hashPart}` : "";
    if (pathPart === "/") return `${basePath}/index.html${hash}`;
    const normalized = pathPart.endsWith(".html") ? pathPart : `${pathPart}.html`;
    return `${basePath}${normalized}${hash}`;
  };
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GoalsGuild Coach",
    url: appUrl,
    logo: `${appUrl}${basePath}/goalsguild-logo.png`,
  };
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GoalsGuild Coach",
    applicationCategory: "BusinessApplication",
    operatingSystem: "macOS, Windows",
    offers: {
      "@type": "Offer",
      price: "14.99",
      priceCurrency: "USD",
      category: "One-time purchase",
    },
    description:
      "Desktop interview and career coaching app with real-time suggestions, post-call summaries, and optimization tools.",
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <SiteNav ctaHref="/trial" ctaLabel="Start Trial" />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">Setup and Resources</h2>
          <p className="section-subtitle">
            Use these guides to configure your machine quickly and get the best performance.
          </p>
          <div className="cards">
            <article className="card">
              <h3>Complete Setup Tutorial</h3>
              <p>
                BlackHole configuration, full settings walkthrough, Ollama installation, and model recommendations.
              </p>
              <a href={withBase("/tutorial")}>Open tutorial</a>
            </article>
            <article className="card">
              <h3>Platform Setup Guides</h3>
              <p>
                Follow OS-specific installation steps and permission setup for macOS and Windows.
              </p>
              <p>
                <a href={withBase("/setup-mac")}>Mac setup</a> {" · "}
                <a href={withBase("/setup-windows")}>Windows setup</a>
              </p>
            </article>
          </div>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
