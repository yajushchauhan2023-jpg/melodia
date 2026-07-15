import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://melodia-ai.vercel.app"),
  title: {
    default: "Melodia | AI Music Learning Platform",
    template: "%s | Melodia"
  },
  description: "Learn music smarter with Melodia, your personal AI tutor for instruments, sheet music decoding, practice feedback, progress tracking, and live teachers online.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Melodia | AI Music Learning Platform",
    description: "Learn music smarter with Melodia, your personal AI tutor for instruments, sheet music decoding, practice feedback, progress tracking, and live teachers online.",
    images: ["/og-image.jpg"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Melodia | AI Music Learning Platform",
    description: "Learn music smarter with Melodia, your personal AI tutor for instruments, sheet music decoding, practice feedback, progress tracking, and live teachers online.",
    images: ["/og-image.jpg"]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <a className="skip-link" href="#maincontent">Skip to main content</a>
          <header className="nav shell">
            <a className="brand" href="/">
              <span className="mark">♪</span>
              <span>Melodia</span>
            </a>
            <nav className="nav-links">
              <a href="/pricing">Plans</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/dashboard/billing">Billing</a>
              <a href="/about">About</a>
            </nav>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="button secondary">Login</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
