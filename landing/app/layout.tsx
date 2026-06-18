import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.goalsguild.com";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GoalsGuild Coach | AI Interview & Career Coaching",
    template: "%s | GoalsGuild Coach",
  },
  description:
    "GoalsGuild Coach provides real-time interview guidance, post-call feedback, and career optimization tools to help candidates perform and get hired.",
  keywords: [
    "AI interview coach",
    "interview preparation",
    "job interview assistant",
    "career coaching",
    "resume optimization",
    "cover letter generator",
    "linkedin optimization",
    "ollama interview coach",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "GoalsGuild Coach | AI Interview & Career Coaching",
    description:
      "Real-time interview coaching, post-call feedback, and career optimization tools for serious candidates.",
    siteName: "GoalsGuild Coach",
    images: [
      {
        url: `${basePath}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "GoalsGuild Coach social preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalsGuild Coach | AI Interview & Career Coaching",
    description:
      "Real-time interview coaching, post-call feedback, and career optimization tools.",
    images: [`${basePath}/og-image.png`],
  },
  icons: {
    icon: `${basePath}/goalsguild-logo.png`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
