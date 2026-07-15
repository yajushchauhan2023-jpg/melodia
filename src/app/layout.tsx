import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melodia Billing",
  description: "AI-powered music learning with Stripe subscriptions"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
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
