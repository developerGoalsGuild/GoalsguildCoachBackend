import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download GoalsGuild Coach and follow installation guides for macOS and Windows.",
  alternates: {
    canonical: "/download",
  },
  openGraph: {
    url: "/download",
    title: "Download | GoalsGuild Coach",
    description:
      "Get the installer and complete setup with macOS and Windows guides.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Download | GoalsGuild Coach",
    description:
      "Get the installer and complete setup with macOS and Windows guides.",
    images: ["/og-image.png"],
  },
};

export default function DownloadPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const macSiliconDownloadHref = `${basePath}/api/download?arch=arm64`;
  const macIntelDownloadHref = `${basePath}/api/download?arch=x86_64`;
  const windowsDownloadHref = `${basePath}/api/download?platform=windows`;
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
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Now" />
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <h1 className="section-title">Download GoalsGuild Coach</h1>
          <p className="section-subtitle">
            Choose Apple Silicon for Macs with an M-series chip. Choose Intel only for older Macs that say
            "Processor: Intel" in About This Mac.
          </p>
          <p style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <a className="btn btn-primary" href={macSiliconDownloadHref}>
              Download for Apple Silicon (M1/M2/M3/M4)
            </a>
            <a className="btn btn-secondary" href={macIntelDownloadHref}>
              Intel Mac only
            </a>
            <a className="btn btn-secondary" href={windowsDownloadHref}>
              Download for Windows
            </a>
          </p>
          <p style={{ color: "#98989f", fontSize: 14 }}>
            If your crash report says <code>X86-64 (Translated)</code>, you opened the Intel build under Rosetta.
            Download the Apple Silicon version instead.
          </p>
          <p>
            After downloading, follow the setup guide for your operating system:
          </p>
          <ul className="detail-list" style={{ textAlign: "left" }}>
            <li>
              <a href={withBase("/setup-mac")}>Mac setup instructions</a>
            </li>
            <li>
              <a href={withBase("/setup-windows")}>Windows setup instructions</a>
            </li>
            <li>
              <a href={withBase("/tutorial")}>Complete setup tutorial (BlackHole, settings, Ollama)</a>
            </li>
          </ul>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
