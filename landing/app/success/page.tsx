"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

function SuccessContent() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const licenseKey = searchParams.get("license_key");

  return (
    <section
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(180deg, #f5f8ff 0%, #ffffff 55%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#fff",
          border: "1px solid #e6ebff",
          borderRadius: 18,
          boxShadow: "0 18px 45px rgba(23, 43, 99, 0.12)",
          padding: 28,
        }}
      >
        <p
          style={{
            display: "inline-block",
            margin: 0,
            padding: "6px 12px",
            borderRadius: 999,
            background: "#e8f9ef",
            color: "#0f8a46",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Payment complete
        </p>
        <h1 style={{ margin: "14px 0 8px", fontSize: 34, lineHeight: 1.2 }}>
          Thanks for your purchase!
        </h1>
        <p style={{ margin: "0 0 18px", color: "#4b5563", fontSize: 16 }}>
          Your license key is now ready. We also send a copy to your email.
        </p>

        <div
          style={{
            border: "1px solid #edf1ff",
            borderRadius: 12,
            background: "#f9fbff",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#1f2a44" }}>
            Stripe session
          </p>
          <code style={{ wordBreak: "break-all", color: "#334155" }}>{sessionId || "unknown"}</code>
        </div>

        <div
          style={{
            border: "1px solid #edf1ff",
            borderRadius: 12,
            background: "#f9fbff",
            padding: 16,
            marginBottom: 22,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#1f2a44" }}>
            License key
          </p>
          <code style={{ wordBreak: "break-all", color: "#334155" }}>{licenseKey || "Check your email"}</code>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href={`${basePath}/download.html`}
            style={{
              textDecoration: "none",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 700,
            }}
          >
            Go to download page
          </a>
          <a
            href={`${basePath}/index.html`}
            style={{
              textDecoration: "none",
              background: "#fff",
              color: "#1f2a44",
              border: "1px solid #d8e0ff",
              borderRadius: 10,
              padding: "11px 16px",
              fontWeight: 700,
            }}
          >
            Back to homepage
          </a>
        </div>
      </section>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <main>
      <SiteNav ctaHref="/download" ctaLabel="Download App" />
      <Suspense fallback={<p>Loading...</p>}>
        <SuccessContent />
      </Suspense>
      <Footer />
      <CookieConsent />
    </main>
  );
}