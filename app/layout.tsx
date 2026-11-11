import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "GhanaPrep 🇬🇭 – BECE & WASSCE Practice",
  description:
    "BECE & WASSCE practice with AI marking, Twi voice explanations, teacher quizzes and a live leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0f0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
