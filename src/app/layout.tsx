import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Karte — Mini-apps NFC intelligentes",
  description:
    "Karte, by Adamkom & JJP : la mini-app NFC de ton commerce, propulsée par l'IA. Tap. Connect. Grow.",
  icons: { icon: "/logo-karte.png", apple: "/logo-karte.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
