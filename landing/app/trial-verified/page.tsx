"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

function TrialVerifiedContent() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 className="section-title">Email verified</h1>
        <p className="section-subtitle">Your activation token (use this with your email in the app under Settings → License):</p>
        <pre style={{ padding: 16, background: "#eee", borderRadius: 8 }}>
          {token || "Missing token"}
        </pre>
        <p>
          The app will issue your <strong>GGC-TRIAL-…</strong> license key when you activate the trial there.
        </p>
        <a className="btn btn-primary" href={`${basePath}/download.html`}>Go to download page</a>
      </div>
    </section>
  );
}

export default function TrialVerifiedPage() {
  return (
    <main>
      <SiteNav ctaHref="/download" ctaLabel="Download App" />
      <Suspense fallback={<p>Loading...</p>}>
        <TrialVerifiedContent />
      </Suspense>
      <Footer />
      <CookieConsent />
    </main>
  );
}