import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gazelle.io — Teacher Dashboard",
  description: "Curriculum-aligned lesson planning and class insights for K-6 teachers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
