import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gazelle.io — K-6 AI Adaptive Learning",
  description:
    "Portfolio/demo build for a K-6 adaptive learning platform with a Next.js teacher dashboard, SwiftUI iOS surface, Supabase, pgvector, and Mastra agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
