"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeLicenseApiUrl } from "../../lib/licenseApiUrl";
import { publicPageUrl } from "../../lib/publicPageUrl";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("Missing token.");
        return;
      }
      const rawApiUrl = process.env.NEXT_PUBLIC_LICENSE_API_URL;
      if (!rawApiUrl) {
        setStatus("API URL not configured.");
        return;
      }
      const apiUrl = normalizeLicenseApiUrl(rawApiUrl);
      const res = await fetch(`${apiUrl}/verify-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error ? ` (${payload.error})` : "";
        setStatus(`Verification failed${reason}.`);
        return;
      }
      const activationToken = payload.activation_token || token;
      window.location.href = `${publicPageUrl("trial-verified")}?token=${encodeURIComponent(activationToken)}`;
    }
    void run();
  }, [token]);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 className="section-title">Verify trial email</h1>
        <p className="section-subtitle">{status}</p>
      </div>
    </section>
  );
}

export default function VerifyPage() {
  return (
    <main>
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Now" />
      <Suspense fallback={<p>Loading...</p>}>
        <VerifyContent />
      </Suspense>
      <Footer />
      <CookieConsent />
    </main>
  );
}