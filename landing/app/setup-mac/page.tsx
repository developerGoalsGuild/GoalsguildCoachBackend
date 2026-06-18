import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Mac Setup Guide",
  description:
    "Step-by-step macOS setup guide for GoalsGuild Coach: install, permissions, and onboarding.",
  alternates: {
    canonical: "/setup-mac",
  },
  openGraph: {
    url: "/setup-mac",
    title: "Mac Setup Guide | GoalsGuild Coach",
    description:
      "Install and configure GoalsGuild Coach on macOS with the official setup guide.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mac Setup Guide | GoalsGuild Coach",
    description:
      "Install and configure GoalsGuild Coach on macOS with the official setup guide.",
    images: ["/og-image.png"],
  },
};

export default function SetupMacPage() {
  return (
    <main>
      <SiteNav ctaHref="/download" ctaLabel="Download App" />
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <h1 className="section-title">Set Up GoalsGuild Coach on Mac</h1>
          <p className="section-subtitle">
            Follow these steps after receiving your download link by email.
          </p>

          <h2>1) Download the app</h2>
          <p>
            Click the download link from your purchase email and save the installer
            or app package to your Downloads folder.
          </p>

          <h2>2) Install to Applications</h2>
          <ol>
            <li>Open the downloaded file.</li>
            <li>Drag <strong>GoalsGuild Coach</strong> into the Applications folder.</li>
            <li>Eject the mounted installer image if one was created.</li>
          </ol>

          <h2>3) Open for the first time</h2>
          <p>
            Open the app from Applications. If macOS shows a security warning,
            right-click the app, choose <strong>Open</strong>, then confirm.
          </p>

          <h2>4) Grant permissions if prompted</h2>
          <p>
            To enable coaching features, macOS may request permission for
            Accessibility, Microphone, or Screen Recording.
          </p>
          <p>
            You can review these under System Settings {"->"} Privacy &amp; Security.
          </p>

          <h2>5) Finish onboarding</h2>
          <p>
            Sign in with your account, complete the initial setup prompts, and you
            are ready to start.
          </p>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
