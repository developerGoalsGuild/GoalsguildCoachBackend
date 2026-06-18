import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Setup Tutorial",
  description:
    "Complete setup tutorial for GoalsGuild Coach: BlackHole configuration, app settings, Ollama installation, and recommended models by machine class.",
  alternates: {
    canonical: "/tutorial",
  },
  openGraph: {
    url: "/tutorial",
    title: "Setup Tutorial | GoalsGuild Coach",
    description:
      "BlackHole setup, full app configuration, Ollama installation, and recommended models by machine class.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Setup Tutorial | GoalsGuild Coach",
    description:
      "BlackHole setup, full app configuration, Ollama installation, and recommended models by machine class.",
    images: ["/og-image.png"],
  },
};

export default function TutorialPage() {
  const sectionStyle = { marginBottom: 28 };
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: 12,
    marginBottom: 12,
    fontSize: "0.95rem",
  };
  const thTdStyle = {
    border: "1px solid #d9d9d9",
    padding: "10px 12px",
    textAlign: "left" as const,
    verticalAlign: "top" as const,
  };

  return (
    <main>
      <SiteNav ctaHref="/download" ctaLabel="Download App" />
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <h1 className="section-title">GoalsGuild Coach Setup Tutorial</h1>
          <p className="section-subtitle">
            Follow this guide to configure BlackHole, complete app settings, and
            run Ollama with the best model for your machine.
          </p>

          <div className="card" style={{ padding: 28 }}>
            <section style={sectionStyle}>
              <h2>1) Install and configure BlackHole (macOS)</h2>
              <ol>
                <li>
                  Install BlackHole 2ch using Homebrew:
                  <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                    <code>brew install --cask blackhole-2ch</code>
                  </pre>
                </li>
                <li>
                  Open <strong>Audio MIDI Setup</strong> and create an{" "}
                  <strong>Aggregate Device</strong> with:
                  <ul>
                    <li>BlackHole 2ch (system/interviewer audio)</li>
                    <li>Built-in Microphone (your voice)</li>
                  </ul>
                </li>
                <li>
                  Set your call app output to BlackHole and input to your microphone
                  (or the aggregate device, depending on your routing preference).
                </li>
              </ol>
              <p>
                If speaker labels are inverted in transcripts, enable{" "}
                <strong>Speaker Swap</strong> in settings.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2>2) Download and configure Ollama</h2>
              <ol>
                <li>
                  Install Ollama:
                  <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                    <code>brew install ollama</code>
                  </pre>
                </li>
                <li>
                  Start Ollama:
                  <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                    <code>ollama serve</code>
                  </pre>
                </li>
                <li>
                  Pull one model:
                  <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                    <code>ollama pull mistral:7b-instruct</code>
                  </pre>
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2>3) Suggested Ollama models by machine</h2>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thTdStyle}>Machine profile</th>
                    <th style={thTdStyle}>RAM (recommended)</th>
                    <th style={thTdStyle}>Suggested model</th>
                    <th style={thTdStyle}>Why</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={thTdStyle}>Base machine (older Intel / 8 GB)</td>
                    <td style={thTdStyle}>8-16 GB</td>
                    <td style={thTdStyle}>
                      <code>phi3:mini</code> or <code>qwen2.5:3b</code>
                    </td>
                    <td style={thTdStyle}>Fastest response with lower memory usage.</td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>Mainstream (M1/M2 or modern i5/i7)</td>
                    <td style={thTdStyle}>16 GB</td>
                    <td style={thTdStyle}>
                      <code>mistral:7b-instruct</code>
                    </td>
                    <td style={thTdStyle}>Balanced quality and speed for live coaching.</td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>Power user (M2 Pro/M3 Pro / high-end PC)</td>
                    <td style={thTdStyle}>24-32 GB</td>
                    <td style={thTdStyle}>
                      <code>qwen2.5:14b</code> (quantized)
                    </td>
                    <td style={thTdStyle}>Higher-quality reasoning with acceptable latency.</td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>Workstation (M3 Max / 64+ GB)</td>
                    <td style={thTdStyle}>48-64+ GB</td>
                    <td style={thTdStyle}>
                      <code>llama3.1:70b</code> (quantized)
                    </td>
                    <td style={thTdStyle}>Best quality, suitable for deep post-call analysis.</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Start with the smallest model that keeps real-time suggestions responsive,
                then scale up only if you need higher answer quality.
              </p>
              <h3 style={{ marginTop: 18 }}>How to identify your machine tier quickly</h3>
              <p>
                Use these quick checks and then match your machine to the table above.
              </p>
              <ul>
                <li>
                  <strong>macOS:</strong> Apple menu {"->"} <strong>About This Mac</strong>.
                  Check chip (Intel/M1/M2/M3) and memory (8 GB, 16 GB, 24 GB, etc.).
                </li>
                <li>
                  <strong>Windows:</strong> Settings {"->"} <strong>System {"->"} About</strong>.
                  Check <strong>Installed RAM</strong> and processor generation.
                </li>
                <li>
                  <strong>Rule of thumb:</strong> prioritize RAM first, then CPU/GPU tier.
                  If unsure, choose the lower model class and move up only if latency stays acceptable.
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2>4) Configure all key app settings</h2>
              <ul>
                <li>
                  <strong>LLM Provider:</strong> set to <code>ollama</code>.
                </li>
                <li>
                  <strong>OLLAMA_BASE_URL:</strong> <code>https://www.GoalsGuild.com</code>.
                </li>
                <li>
                  <strong>LLM Model:</strong> choose from the table above.
                </li>
                <li>
                  <strong>Whisper Model:</strong> use <code>large-v3-turbo-q4</code> on Apple Silicon.
                </li>
                <li>
                  <strong>Transcription Provider:</strong> <code>local</code> for offline mode.
                </li>
                <li>
                  <strong>Segment Duration:</strong> 2.5-3.5 seconds.
                </li>
                <li>
                  <strong>Segment Overlap:</strong> 0.3-0.6 seconds.
                </li>
                <li>
                  <strong>BlackHole Device Name:</strong> <code>BlackHole 2ch</code>.
                </li>
                <li>
                  <strong>Aggregate Device Name:</strong> the exact name from Audio MIDI Setup.
                </li>
                <li>
                  <strong>BlackHole Channel Count:</strong> <code>2</code>.
                </li>
                <li>
                  <strong>Sample Rate:</strong> <code>16000</code> (default) or <code>44100</code>.
                </li>
                <li>
                  <strong>Language Hint:</strong> set interview language (or auto).
                </li>
                <li>
                  <strong>Suggestion Interval:</strong> 15-30 seconds depending on preference.
                </li>
              </ul>
            </section>

            <section>
              <h2>5) Validate your setup</h2>
              <ol>
                <li>Open app Settings and click connection tests where available.</li>
                <li>Start a short mock call and verify transcript and live tips.</li>
                <li>
                  If transcript speakers are swapped, toggle <strong>Invert Speakers</strong>.
                </li>
              </ol>
            </section>
          </div>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
