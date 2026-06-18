import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Interview Coaching Features and Career Tools",
  description:
    "Explore GoalsGuild Coach features: live interview coaching, post-call intelligence, practice mode, career optimization, and security controls.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    url: "/features",
    title: "Interview Coaching Features and Career Tools",
    description:
      "Detailed breakdown of live coaching, practice mode, career toolkit, licensing, and security features.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Coaching Features and Career Tools",
    description:
      "Detailed breakdown of live coaching, practice mode, career toolkit, licensing, and security features.",
    images: ["/og-image.png"],
  },
};

const featureGroups = [
  {
    title: "LLM Provider Requirement",
    items: [
      "You must connect at least one LLM backend for coaching features to work",
      "Use API-key providers like OpenAI, Anthropic, Gemini, Groq, or OpenRouter",
      "Or run a local Ollama model if you prefer local inference",
      "Without a configured provider or local Ollama model, generation features are unavailable",
    ],
  },
  {
    title: "Live Interview Coaching",
    items: [
      "Real-time suggestions while the interview is active",
      "Context-aware guidance using recent transcript windows",
      "Question focus detection to help you answer what was actually asked",
      "Low-friction overlay/dashboard delivery without interrupting your flow",
    ],
  },
  {
    title: "Post-Call Intelligence",
    items: [
      "Automatic interview summary with key moments and strengths",
      "Action plan extraction with concrete next steps",
      "Structured feedback on communication and response quality",
      "Session artifacts saved for review and continuous improvement",
    ],
  },
  {
    title: "Practice Mode",
    items: [
      "Mock interview loops for repeated drilling",
      "Question-driven practice across role-specific scenarios",
      "Evaluation output to identify weak spots before real interviews",
      "Practical coaching feedback focused on execution, not theory",
    ],
  },
  {
    title: "Career Optimization Toolkit",
    items: [
      "CV reshape for ATS alignment and clarity",
      "Cover letter generation tailored to target roles",
      "JD match analysis to expose skill and keyword gaps",
      "LinkedIn optimization for stronger recruiter conversion",
    ],
  },
  {
    title: "License and Reliability",
    items: [
      "Secure license validation and heartbeat-based revocation checks",
      "Trial and paid flows with upgrade support",
      "Cached validation path for short backend interruptions",
      "Machine-binding and anti-abuse checks for fair usage",
    ],
  },
  {
    title: "Security and Integrity",
    items: [
      "Prompt-bundle encryption and runtime decryption controls",
      "Distributed runtime guards across execution paths",
      "Admin revoke and lookup flows for operational control",
      "Build-time protected pipeline integration for release artifacts",
    ],
  },
];

export default function FeaturesPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (href: string) => {
    if (!href.startsWith("/")) return href;
    const [pathPart, hashPart] = href.split("#");
    const hash = hashPart ? `#${hashPart}` : "";
    if (pathPart === "/") return `${basePath}/index.html${hash}`;
    const normalized = pathPart.endsWith(".html") ? pathPart : `${pathPart}.html`;
    return `${basePath}${normalized}${hash}`;
  };

  return (
    <main>
      <SiteNav ctaHref="/trial" ctaLabel="Start 7-Day Trial" />
      <section className="section">
        <div className="container">
          <h1 className="section-title">Detailed Features</h1>
          <p className="section-subtitle">
            A complete view of how GoalsGuild Coach helps you prepare, perform, and improve in high-stakes interviews.
          </p>
          <div className="cards">
            {featureGroups.map((group) => (
              <article className="card" key={group.title}>
                <h2>{group.title}</h2>
                <ul className="detail-list">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <section style={{ marginTop: 28 }}>
            <h2>Related Guides</h2>
            <p>
              Learn how to set up your machine, tune Ollama models, and complete onboarding faster.
            </p>
            <p>
              <a href={withBase("/tutorial")}>Complete setup tutorial</a> {" · "}
              <a href={withBase("/setup-mac")}>Mac setup</a> {" · "}
              <a href={withBase("/setup-windows")}>Windows setup</a> {" · "}
              <a href={withBase("/download")}>Download</a>
            </p>
          </section>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
