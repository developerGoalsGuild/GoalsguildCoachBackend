import type { Metadata } from "next";
import { CookieConsent } from "../../components/CookieConsent";
import { Footer } from "../../components/Footer";
import { SiteNav } from "../../components/SiteNav";

export const metadata: Metadata = {
  title: "Windows Setup Guide",
  description:
    "Step-by-step Windows setup guide for GoalsGuild Coach: installer, SmartScreen, and capturing both sides of a call with Voicemeeter (VB-Audio).",
  alternates: {
    canonical: "/setup-windows",
  },
  openGraph: {
    url: "/setup-windows",
    title: "Windows Setup Guide | GoalsGuild Coach",
    description:
      "Install GoalsGuild Coach on Windows and route your meeting audio with Voicemeeter so both sides of the call are transcribed.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Windows Setup Guide | GoalsGuild Coach",
    description:
      "Install GoalsGuild Coach on Windows and route your meeting audio with Voicemeeter so both sides of the call are transcribed.",
    images: ["/og-image.png"],
  },
};

export default function SetupWindowsPage() {
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
  const codeBlock = { marginTop: 8, whiteSpace: "pre-wrap" as const };

  return (
    <main>
      <SiteNav ctaHref="/download" ctaLabel="Download App" />
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <h1 className="section-title">Set Up GoalsGuild Coach on Windows</h1>
          <p className="section-subtitle">
            Install the app, then route your meeting audio through Voicemeeter so
            GoalsGuild Coach can hear and transcribe both you and the interviewer.
          </p>

          <div className="card" style={{ padding: 28 }}>
            <section style={sectionStyle}>
              <h2>1) Download the installer</h2>
              <p>
                Click the download link from your purchase email and save the{" "}
                <strong>.exe</strong> installer to your Downloads folder.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2>2) Run the installer</h2>
              <ol>
                <li>Double-click the installer file.</li>
                <li>
                  Allow the app to make changes when Windows asks for permission.
                </li>
                <li>Complete the install wizard and finish setup.</li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2>3) If SmartScreen appears</h2>
              <p>
                Select <strong>More info</strong>, then <strong>Run anyway</strong>{" "}
                to continue the installation.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2>4) Launch the app</h2>
              <p>
                Open GoalsGuild Coach from the Start menu or desktop shortcut after
                the installer completes.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2>5) Capture call audio with Voicemeeter</h2>
              <p>
                On Windows, GoalsGuild Coach listens to a <strong>recording</strong>{" "}
                device. To transcribe <em>both</em> sides of a call, route your
                meeting app (Teams, Zoom, Meet, etc.) through{" "}
                <strong>Voicemeeter</strong> (VB-Audio) so the mixed audio appears on
                a Voicemeeter virtual output that you can select as the app&apos;s
                input.
              </p>

              <h3 style={{ marginTop: 18 }}>Install Voicemeeter</h3>
              <ol>
                <li>
                  Download and install <strong>Voicemeeter</strong> from{" "}
                  <a
                    href="https://vb-audio.com/Voicemeeter/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vb-audio.com/Voicemeeter
                  </a>
                  . The standard edition is enough; Banana/Potato add more buses if
                  you want them.
                </li>
                <li>
                  <strong>Restart Windows</strong> after installation so the virtual
                  audio devices register correctly.
                </li>
              </ol>

              <h3 style={{ marginTop: 18 }}>Understand the routing</h3>
              <p>
                Voicemeeter mixes audio from <strong>input strips</strong> (your
                microphone and the virtual input that the meeting app plays into) and
                sends them to <strong>output buses</strong>:
              </p>
              <ul>
                <li>
                  <strong>A1</strong> = a physical output (your speakers or
                  headphones) so you can still hear the call.
                </li>
                <li>
                  <strong>B1</strong> = a virtual output that GoalsGuild Coach records
                  as its input. Everything you route to B1 gets transcribed.
                </li>
              </ul>

              <h3 style={{ marginTop: 18 }}>Configure Voicemeeter (step by step)</h3>
              <ol>
                <li>
                  <strong>Open Voicemeeter.</strong> You&apos;ll see hardware input
                  strips on the left and virtual inputs on the right, with the A/B
                  bus buttons at the top of each strip.
                </li>
                <li>
                  <strong>Set your listening output (A1).</strong> Top-right, click{" "}
                  <code>A1</code> (or <code>HARDWARE OUT</code>) and select your
                  speakers or headphones (for example <code>WDM: Speakers</code> or{" "}
                  <code>MME: Headphones</code>). This is what you hear.
                </li>
                <li>
                  <strong>Assign your microphone.</strong> On the first hardware input
                  strip, click <code>HARDWARE INPUT 1</code> and choose your mic
                  (prefer the <code>WDM</code> entry). At the top of that strip, enable
                  the <code>B1</code> button so your voice is sent to the recording
                  bus. Leave <code>A1</code> off on the mic strip to avoid hearing your
                  own echo.
                </li>
                <li>
                  <strong>Route the meeting audio.</strong> The interviewer&apos;s
                  voice arrives on the <strong>Voicemeeter VAIO</strong> virtual input
                  strip (right side). Enable both <code>A1</code> (so you hear them)
                  and <code>B1</code> (so it&apos;s recorded) on that strip.
                </li>
                <li>
                  <strong>Result:</strong> your mic and the remote voice are both on
                  bus <strong>B1</strong>, which is the single device GoalsGuild Coach
                  records.
                </li>
              </ol>

              <h3 style={{ marginTop: 18 }}>Point Windows and your meeting app at Voicemeeter</h3>
              <ol>
                <li>
                  In your conferencing app&apos;s audio settings, set the{" "}
                  <strong>speaker / output</strong> to{" "}
                  <code>Voicemeeter Input</code> (the VAIO virtual input). This sends
                  the interviewer&apos;s voice into the Voicemeeter VAIO strip.
                </li>
                <li>
                  Keep your <strong>microphone</strong> as the conferencing
                  app&apos;s input so the other person still hears you normally.
                </li>
                <li>
                  Optional: in <strong>Windows Settings → System → Sound</strong>, set{" "}
                  <code>Voicemeeter Input</code> as the default <strong>Output</strong>{" "}
                  device if you want system sounds and other apps to flow through
                  Voicemeeter too.
                </li>
                <li>
                  Confirm a Voicemeeter <strong>output / recording</strong> device (for
                  example <code>Voicemeeter Out B1</code>, <code>Voicemeeter Output</code>,
                  or <code>Voicemeeter Aux Output</code>) appears under{" "}
                  <strong>Input</strong>. The exact name varies by edition.
                </li>
              </ol>

              <p style={{ marginTop: 12 }}>
                <strong>Important:</strong> set the same sample rate everywhere.
                In Voicemeeter, open <code>Menu → System Settings / Options</code> and
                set <strong>Samplerate</strong> to match the Windows device format and
                the app&apos;s <strong>Sample Rate</strong> setting (16000 Hz is
                recommended). Mismatched rates are the most common cause of silent or
                garbled transcripts.
              </p>

              <h3 style={{ marginTop: 18 }}>Match the app settings</h3>
              <p>
                Open <strong>Settings</strong> in GoalsGuild Coach and set these
                fields to match your Voicemeeter routing:
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thTdStyle}>Setting</th>
                    <th style={thTdStyle}>Value</th>
                    <th style={thTdStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={thTdStyle}>Voicemeeter recording device</td>
                    <td style={thTdStyle}>
                      <code>Voicemeeter Out B1</code>
                    </td>
                    <td style={thTdStyle}>
                      Use the exact name (or a unique substring) of the Voicemeeter
                      bus that carries your mixed meeting audio, as shown in Windows
                      Sound settings.
                    </td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>Optional second input</td>
                    <td style={thTdStyle}>
                      <em>(leave blank)</em>
                    </td>
                    <td style={thTdStyle}>
                      Only fill this in if you merge two inputs outside Voicemeeter.
                      When Voicemeeter alone carries both sides (recommended), leave
                      it empty.
                    </td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>System / remote channel count</td>
                    <td style={thTdStyle}>
                      <code>2</code>
                    </td>
                    <td style={thTdStyle}>
                      Number of channels at the start of the stream that are
                      system/remote audio. Stereo bus → <code>2</code>.
                    </td>
                  </tr>
                  <tr>
                    <td style={thTdStyle}>Sample Rate</td>
                    <td style={thTdStyle}>
                      <code>16000</code>
                    </td>
                    <td style={thTdStyle}>
                      Recommended for Whisper. Use <code>44100</code> or{" "}
                      <code>48000</code> only if Voicemeeter or your driver forces it
                      (match Voicemeeter&apos;s sample rate to avoid silence).
                    </td>
                  </tr>
                </tbody>
              </table>

              <p style={{ marginTop: 12 }}>
                <strong>Tip:</strong> If transcripts show the wrong speaker labels,
                enable <strong>Swap Me / Other</strong> (Speaker Swap) in Settings so
                the channel order matches <code>[Me]</code> and <code>[Other]</code>.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2>6) Finish onboarding</h2>
              <p>
                Sign in with your account and complete the initial setup prompts.
                Choose your LLM provider and transcription provider, then save.
              </p>
            </section>

            <section>
              <h2>7) Validate your setup</h2>
              <ol>
                <li>
                  Play any audio (a YouTube video works) routed through Voicemeeter
                  and confirm the level meters move in both Voicemeeter and the app.
                </li>
                <li>
                  Start a short test call or mock session and verify the live
                  transcript shows <em>both</em> your voice and the other side.
                </li>
                <li>
                  If only one side is transcribed, recheck that both the microphone
                  and the meeting-app strip are routed to the same Voicemeeter bus
                  (B1) and that you selected that bus as the recording device.
                </li>
                <li>
                  If you hear silence or the transcript is empty, make sure the
                  Voicemeeter and Windows sample rates match the app&apos;s Sample
                  Rate setting.
                </li>
              </ol>
              <pre style={codeBlock}>
                <code>
                  Conferencing app output → Voicemeeter Input (VAIO){"\n"}Your
                  microphone → Voicemeeter hardware input (Stripe 1){"\n"}Both strips
                  → Bus B1{"\n"}GoalsGuild Coach input → Voicemeeter Out B1
                </code>
              </pre>
            </section>
          </div>
        </div>
      </section>
      <Footer />
      <CookieConsent />
    </main>
  );
}
