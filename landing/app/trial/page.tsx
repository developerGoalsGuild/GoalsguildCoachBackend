"use client";
import { FormEvent, useState } from "react";
import { normalizeLicenseApiUrl } from "../../lib/licenseApiUrl";
import { publicPageUrl } from "../../lib/publicPageUrl";
import { CookieConsent } from "../../components/CookieConsent";
import { SiteNav } from "../../components/SiteNav";
import { Footer } from "../../components/Footer";

export default function TrialPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Sending verification email...");
    const rawApiUrl = process.env.NEXT_PUBLIC_LICENSE_API_URL;
    if (!rawApiUrl) {
      setStatus("Error: API URL not configured.");
      setIsLoading(false);
      return;
    }
    const apiUrl = normalizeLicenseApiUrl(rawApiUrl);
    try {
      const callbackUrl = publicPageUrl("verify");
      const res = await fetch(`${apiUrl}/request-verification`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, callback_url: callbackUrl })
      });

      if (res.ok) {
        setStatus("Success! Check your inbox for the verification link.");
      } else {
        setStatus("Failed to request trial. Please try again.");
      }
    } catch (err) {
      setStatus("Network error. Please try again later.");
    }
    setIsLoading(false);
  }

  return (
    <main>
      <SiteNav ctaHref="/checkout" ctaLabel="Buy Now" />
      
      <section className="hero" style={{ paddingBottom: "40px" }}>
        <div className="container">
          <h1 className="hero-title">
            Start your <span className="hero-highlight">7-Day Free Trial</span>
          </h1>
          <p className="hero-subtitle">
            Experience the full power of GoalsGuild Coach. No credit card required.
          </p>
        </div>
      </section>

      <section className="section section-alt" style={{ paddingTop: "40px" }}>
        <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "60px", justifyContent: "center", alignItems: "flex-start" }}>
          
          {/* Form Card */}
          <div className="card" style={{ flex: "1 1 400px", maxWidth: "500px", padding: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "1.6rem", color: "var(--primary-color)" }}>
              Request Trial Access
            </h2>
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label htmlFor="email" style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--text-dark)" }}>
                  Work Email Address
                </label>
                <input 
                  id="email"
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@company.com" 
                  required 
                  disabled={isLoading}
                  style={{ 
                    width: "100%", 
                    padding: "14px 16px", 
                    borderRadius: "10px", 
                    border: "1px solid var(--border-color)",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
                style={{ 
                  width: "100%", 
                  fontSize: "1.1rem", 
                  padding: "16px",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer"
                }}
              >
                {isLoading ? "Requesting..." : "Get My Trial Key"}
              </button>
            </form>
            
            {status && (
              <div style={{ 
                marginTop: "24px", 
                padding: "16px", 
                borderRadius: "10px", 
                backgroundColor: status.includes("Success") ? "#e6f4ea" : "#fef0f0",
                color: status.includes("Success") ? "#1e5aa8" : "#d32f2f",
                fontWeight: 500,
                textAlign: "center",
                border: `1px solid ${status.includes("Success") ? "#c3e6cb" : "#f5c6cb"}`,
                wordBreak: "break-all"
              }}>
                {status}
              </div>
            )}
            
            <p style={{ marginTop: "24px", fontSize: "0.9rem", color: "var(--text-light)", textAlign: "center", lineHeight: 1.5 }}>
              By requesting a trial, you agree to our Terms of Service and Privacy Policy. We will email you a verification link to activate your trial.
            </p>
          </div>

          {/* Features List */}
          <div style={{ flex: "1 1 300px", maxWidth: "450px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 style={{ fontSize: "1.6rem", marginBottom: "24px", color: "var(--text-dark)" }}>What's included in the trial?</h3>
            <ul className="detail-list" style={{ fontSize: "1.1rem", listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontWeight: "bold" }}>✓</span>
                <div>
                  <strong style={{ display: "block", color: "var(--text-dark)", marginBottom: "4px" }}>Real-time Coaching</strong>
                  <span style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>Live suggestions and guidance during your actual interviews.</span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontWeight: "bold" }}>✓</span>
                <div>
                  <strong style={{ display: "block", color: "var(--text-dark)", marginBottom: "4px" }}>Post-call Summaries</strong>
                  <span style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>Detailed feedback, scoring, and actionable advice after every call.</span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontWeight: "bold" }}>✓</span>
                <div>
                  <strong style={{ display: "block", color: "var(--text-dark)", marginBottom: "4px" }}>Career Tools Suite</strong>
                  <span style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>CV reshaping, cover letter generation, and Job Description matching.</span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontWeight: "bold" }}>✓</span>
                <div>
                  <strong style={{ display: "block", color: "var(--text-dark)", marginBottom: "4px" }}>Unlimited Practice</strong>
                  <span style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>Run mock interviews with our AI to perfect your delivery.</span>
                </div>
              </li>
              <li style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--primary-color)", fontSize: "1.2rem", fontWeight: "bold" }}>✓</span>
                <div>
                  <strong style={{ display: "block", color: "var(--text-dark)", marginBottom: "4px" }}>Local-First Privacy</strong>
                  <span style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>Your audio and transcripts stay securely on your machine.</span>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>

      <Footer />
      <CookieConsent />
    </main>
  );
}
